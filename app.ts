/**
 * ============================================================
 * SERVER ENTRY POINT
 * ============================================================
 * This is the root file of the application.
 * It is responsible for:
 *  1. Loading environment variables
 *  2. Validating required env vars before anything runs
 *  3. Setting up Express with all middleware
 *  4. Setting up Socket.IO with JWT auth
 *  5. Connecting to MongoDB
 *  6. Starting the HTTP server
 *  7. Handling graceful shutdown
 * ============================================================
 */

// ─── Load env vars FIRST before any other imports ────────────────────────────
// This ensures process.env is populated before any module reads from it
import dotenv from "dotenv";
dotenv.config();

// ─── Validate required environment variables ─────────────────────────────────
// We fail fast here — if critical env vars are missing, we crash immediately
// with a clear error instead of silently failing later at runtime
const REQUIRED_ENV_VARS = ["MONGO_URI", "JWT_SECRET_KEY", "CLIENT_URL"];

// The of is just the syntax that says "go through each item in this array"
for (const key of REQUIRED_ENV_VARS) {
  if (!process.env[key]) {
    console.error(`❌ Missing required environment variable: ${key}`);
    process.exit(1); // Kill the process immediately — don't start a broken server
  }
}

// ─── Core imports ─────────────────────────────────────────────────────────────
import express, { Request, Response, NextFunction } from "express";
import http from "http";
import { Server } from "socket.io";

// ─── Security & middleware imports ────────────────────────────────────────────
import helmet from "helmet"; // Sets secure HTTP headers (XSS, clickjacking, etc.)
import cors from "cors"; // Cross-Origin Resource Sharing
import morgan from "morgan"; // HTTP request logger
import rateLimit from "express-rate-limit"; // Limits repeated requests to prevent abuse
import jwt from "jsonwebtoken";
import swaggerUi from "swagger-ui-express";
import swaggerSpec from "./swagger";

import connectDB from "./db/connect";
import authRouter from "./route/auth";
import messageRouter from "./route/message";
import notFound from "./middleware/not-found";
import { AuthSocket } from "./interface/authSocket";
import { registerChatHandlers } from "./controller/chat";
import errorHandler from "./middleware/error-handler";
import authMiddleware from "./middleware/authentication";
import notificationRouter from './route/notification'

// ─── Shared CORS config ───────────────────────────────────────────────────────
// Defined once and reused in both Express and Socket.IO
// This prevents them from drifting out of sync over time
const CORS_OPTIONS = {
  origin: process.env.CLIENT_URL?.split(",") || ["http://localhost:3000", "http://localhost:5173"],
  // CLIENT_URL can be a comma-separated string in .env for multiple origins
  // e.g. CLIENT_URL="https://myapp.com,https://admin.myapp.com"
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
  credentials: true, // Allow cookies and Authorization headers from the browser
};

// ─── Express app setup ────────────────────────────────────────────────────────
const app = express();

// Wrapping Express in a raw HTTP server is required for Socket.IO
// Socket.IO needs direct access to the HTTP server to handle WebSocket upgrades
const httpServer = http.createServer(app);

// ─── Socket.IO setup ──────────────────────────────────────────────────────────
// Export so other modules (controllers, services) can emit events
export const io = new Server(httpServer, {
  cors: CORS_OPTIONS,

  // How long (ms) Socket.IO waits before considering a connection dead
  // and attempting to reconnect. Lower = faster detection, higher = more tolerance
  pingTimeout: 60000,

  // How often (ms) the server sends a ping to the client to check if it's alive
  pingInterval: 25000,
});

// ─── Socket.IO Authentication Middleware ──────────────────────────────────────
// This runs before EVERY socket connection is established.
// Think of it as the bouncer at the door — no valid token, no entry.
io.use((socket: AuthSocket, next) => {
  // Token can come from two places:
  // 1. socket.handshake.auth.token — recommended (set on client: { auth: { token } })
  // 2. Authorization header — fallback for clients sending it as a header
  const authHeader = socket.handshake.headers["authorization"];

  const token =
    socket.handshake.auth?.token ||
    (authHeader?.startsWith("Bearer ") ? authHeader.split(" ")[1] : null);

  if (!token) {
    // Reject the connection immediately if no token is provided
    return next(new Error("Authentication error: No token provided"));
  }

  try {
    // Verify the token signature and expiry using our secret key
    // If valid, decoded contains the payload we signed during login (userId, username, etc.)
    const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY!) as {
      userId: string;
      username: string;
      avatar?: string;
    };

    // Attach decoded user to the socket instance
    // This makes socket.user available in all chat handlers
    // Like giving them a name tag after passing the door check
    socket.user = decoded;

    next(); // ✅ Allow the connection
  } catch (err) {
    // Token is invalid, expired, or tampered with — reject
    return next(new Error("Authentication error: Invalid or expired token"));
  }
});

// ─── Socket.IO Connection Handler ─────────────────────────────────────────────
// Fires once per successful authenticated connection
io.on("connection", (socket: AuthSocket) => {
  console.log(`✅ ${socket.user?.username} connected [${socket.id}]`);

  // Register all chat-related event handlers for this socket
  // Keeping this in a separate file keeps server.ts clean
  registerChatHandlers(io, socket);

  // Log when a socket disconnects
  // reason tells you why: "transport close", "ping timeout", "server namespace disconnect", etc.
  socket.on("disconnect", (reason) => {
    console.log(`🔴 ${socket.user?.username} disconnected — reason: ${reason}`);
  });
});

// ============================================================
// EXPRESS MIDDLEWARE STACK
// Order matters — middleware runs top to bottom on every request
// ============================================================
app.set('trust proxy', 1);

// 1. Security headers
// Helmet sets ~15 HTTP headers that protect against common attacks
// e.g. X-Content-Type-Options, X-Frame-Options, Content-Security-Policy
app.use(helmet());

// 2. CORS
// Must come before routes so preflight OPTIONS requests are handled
app.use(cors(CORS_OPTIONS));

// 3. Request logging
// "dev" format: METHOD /path STATUS response-time ms
// Use "combined" in production for Apache-style logs (good for log aggregators)
app.use(morgan(process.env.NODE_ENV === "production" ? "combined" : "dev"));

// 4. Body parsing
// Parses incoming JSON request bodies and makes them available as req.body
// limit prevents payload bomb attacks (someone sending a 500MB JSON body)
app.use(express.json({ limit: "10kb" }));

// 5. Rate limiting
// Limits each IP to 100 requests per 15 minutes on all routes
// Prevents brute force attacks, scraping, and API abuse
const globalRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,
  standardHeaders: true, // Return rate limit info in RateLimit-* headers
  legacyHeaders: false,
  message: { error: "Too many requests, please try again later." },
});
app.use(globalRateLimiter);

// Stricter rate limit specifically for auth routes
// Prevents brute-forcing login/register endpoints
const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20, // Only 20 auth attempts per 15 minutes per IP
  message: { error: "Too many authentication attempts, please try again later." },
});

// ============================================================
// ROUTES
// ============================================================

// Health check endpoint
// Useful for uptime monitors, load balancers, and Docker health checks
// Should always respond 200 if the server is running
app.get("/health", (_req: Request, res: Response) => {
  res.status(200).json({
    status: "ok",
    uptime: process.uptime(), // How long the server has been running in seconds
    timestamp: new Date().toISOString(),
  });
});

// swagger docs route
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// Auth routes — login, register, refresh token, etc.
// authRateLimiter applied specifically here because these are sensitive
app.use("/api/v1/auth", authRateLimiter, authRouter);

// Message routes — fetch conversations, message history, etc.
app.use("/api/v1/messages",authMiddleware, messageRouter);

app.use("/api/v1/messages/notification",authMiddleware, notificationRouter);

// ============================================================
// ERROR HANDLING
// Must be defined AFTER all routes
// ============================================================

// 404 handler — catches any request that didn't match a route above
app.use(notFound);
app.use(errorHandler); // Custom error handler for Mongoose validation, duplicate keys, etc.


// Global error handler
// Express recognizes this as an error handler because it has 4 parameters (err, req, res, next)
// Any middleware or route that calls next(err) will end up here
app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  console.error("❌ Unhandled error:", err.message);

  res.status(500).json({
    error:
      process.env.NODE_ENV === "production"
        ? "Something went wrong" // Don't leak internal error details in prod
        : err.message, // Show full error in development for easier debugging
  });
});

// ============================================================
// SERVER STARTUP
// ============================================================

const PORT = process.env.PORT || 5000;

const start = async () => {
  try {
    // Connect to MongoDB before starting the server
    // If DB connection fails, we don't want to accept requests
    await connectDB(process.env.MONGO_URI as string);
    console.log("✅ MongoDB connected");

    httpServer.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT} [${process.env.NODE_ENV || "development"}]`);
    });
  } catch (err) {
    console.error("❌ Failed to start server:", err);
    process.exit(1); // Exit with failure code — let process manager (PM2, Docker) restart it
  }
};

start();

// ============================================================
// GRACEFUL SHUTDOWN
// ============================================================
// When the process receives a termination signal (SIGTERM from Docker/Kubernetes,
// SIGINT from Ctrl+C), we want to:
//  1. Stop accepting new connections
//  2. Close existing socket connections cleanly
//  3. Close the HTTP server
// This prevents data loss and in-flight request corruption

const shutdown = (signal: string) => {
  console.log(`\n⚠️  ${signal} received. Shutting down gracefully...`);

  // Close all active Socket.IO connections
  io.close(() => {
    console.log("🔌 Socket.IO connections closed");
  });

  // Stop the HTTP server from accepting new connections
  // Callback fires once all existing connections are closed
  httpServer.close(() => {
    console.log("🛑 HTTP server closed");
    process.exit(0); // Exit with success code
  });

  // Force kill if graceful shutdown takes too long (e.g. hung connections)
  setTimeout(() => {
    console.error("❌ Forced shutdown after timeout");
    process.exit(1);
  }, 10000); // 10 seconds max
};

// Listen for termination signals
process.on("SIGTERM", () => shutdown("SIGTERM")); // Sent by Docker, Kubernetes, hosting platforms
process.on("SIGINT", () => shutdown("SIGINT")); // Sent by Ctrl+C in terminal

// Catch unhandled promise rejections
// Without this, they silently fail and can leave your app in a broken state
process.on("unhandledRejection", (reason) => {
  console.error("❌ Unhandled Promise Rejection:", reason);
  // In production, it's safer to crash and let the process manager restart
  process.exit(1);
});

// Catch uncaught synchronous exceptions
process.on("uncaughtException", (err) => {
  console.error("❌ Uncaught Exception:", err.message);
  process.exit(1);
});