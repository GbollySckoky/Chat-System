"use strict";
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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.io = void 0;
// ─── Load env vars FIRST before any other imports ────────────────────────────
// This ensures process.env is populated before any module reads from it
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
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
const express_1 = __importDefault(require("express"));
const http_1 = __importDefault(require("http"));
const socket_io_1 = require("socket.io");
// ─── Security & middleware imports ────────────────────────────────────────────
const helmet_1 = __importDefault(require("helmet")); // Sets secure HTTP headers (XSS, clickjacking, etc.)
const cors_1 = __importDefault(require("cors")); // Cross-Origin Resource Sharing
const morgan_1 = __importDefault(require("morgan")); // HTTP request logger
const express_rate_limit_1 = __importDefault(require("express-rate-limit")); // Limits repeated requests to prevent abuse
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const swaggerUi = require("swagger-ui-express"); // shows docs
const swaggerSpec = require("./swagger");
const connect_1 = __importDefault(require("./db/connect"));
const auth_1 = __importDefault(require("./route/auth"));
const message_1 = __importDefault(require("./route/message"));
const not_found_1 = __importDefault(require("./middleware/not-found"));
const chat_1 = require("./controller/chat");
const error_handler_1 = __importDefault(require("./middleware/error-handler"));
const authentication_1 = __importDefault(require("./middleware/authentication"));
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
const app = (0, express_1.default)();
// Wrapping Express in a raw HTTP server is required for Socket.IO
// Socket.IO needs direct access to the HTTP server to handle WebSocket upgrades
const httpServer = http_1.default.createServer(app);
// ─── Socket.IO setup ──────────────────────────────────────────────────────────
// Export so other modules (controllers, services) can emit events
exports.io = new socket_io_1.Server(httpServer, {
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
exports.io.use((socket, next) => {
    // Token can come from two places:
    // 1. socket.handshake.auth.token — recommended (set on client: { auth: { token } })
    // 2. Authorization header — fallback for clients sending it as a header
    const authHeader = socket.handshake.headers["authorization"];
    const token = socket.handshake.auth?.token ||
        (authHeader?.startsWith("Bearer ") ? authHeader.split(" ")[1] : null);
    if (!token) {
        // Reject the connection immediately if no token is provided
        return next(new Error("Authentication error: No token provided"));
    }
    try {
        // Verify the token signature and expiry using our secret key
        // If valid, decoded contains the payload we signed during login (userId, username, etc.)
        const decoded = jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET_KEY);
        // Attach decoded user to the socket instance
        // This makes socket.user available in all chat handlers
        // Like giving them a name tag after passing the door check
        socket.user = decoded;
        next(); // ✅ Allow the connection
    }
    catch (err) {
        // Token is invalid, expired, or tampered with — reject
        return next(new Error("Authentication error: Invalid or expired token"));
    }
});
// ─── Socket.IO Connection Handler ─────────────────────────────────────────────
// Fires once per successful authenticated connection
exports.io.on("connection", (socket) => {
    console.log(`✅ ${socket.user?.username} connected [${socket.id}]`);
    // Register all chat-related event handlers for this socket
    // Keeping this in a separate file keeps server.ts clean
    (0, chat_1.registerChatHandlers)(exports.io, socket);
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
app.use((0, helmet_1.default)());
// 2. CORS
// Must come before routes so preflight OPTIONS requests are handled
app.use((0, cors_1.default)(CORS_OPTIONS));
// 3. Request logging
// "dev" format: METHOD /path STATUS response-time ms
// Use "combined" in production for Apache-style logs (good for log aggregators)
app.use((0, morgan_1.default)(process.env.NODE_ENV === "production" ? "combined" : "dev"));
// 4. Body parsing
// Parses incoming JSON request bodies and makes them available as req.body
// limit prevents payload bomb attacks (someone sending a 500MB JSON body)
app.use(express_1.default.json({ limit: "10kb" }));
// 5. Rate limiting
// Limits each IP to 100 requests per 15 minutes on all routes
// Prevents brute force attacks, scraping, and API abuse
const globalRateLimiter = (0, express_rate_limit_1.default)({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100,
    standardHeaders: true, // Return rate limit info in RateLimit-* headers
    legacyHeaders: false,
    message: { error: "Too many requests, please try again later." },
});
app.use(globalRateLimiter);
// Stricter rate limit specifically for auth routes
// Prevents brute-forcing login/register endpoints
const authRateLimiter = (0, express_rate_limit_1.default)({
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
app.get("/health", (_req, res) => {
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
app.use("/api/v1/auth", authRateLimiter, auth_1.default);
// Message routes — fetch conversations, message history, etc.
app.use("/api/v1/messages", authentication_1.default, message_1.default);
// ============================================================
// ERROR HANDLING
// Must be defined AFTER all routes
// ============================================================
// 404 handler — catches any request that didn't match a route above
app.use(not_found_1.default);
app.use(error_handler_1.default); // Custom error handler for Mongoose validation, duplicate keys, etc.
// Global error handler
// Express recognizes this as an error handler because it has 4 parameters (err, req, res, next)
// Any middleware or route that calls next(err) will end up here
app.use((err, _req, res, _next) => {
    console.error("❌ Unhandled error:", err.message);
    res.status(500).json({
        error: process.env.NODE_ENV === "production"
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
        await (0, connect_1.default)(process.env.MONGO_URI);
        console.log("✅ MongoDB connected");
        httpServer.listen(PORT, () => {
            console.log(`🚀 Server running on port ${PORT} [${process.env.NODE_ENV || "development"}]`);
        });
    }
    catch (err) {
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
const shutdown = (signal) => {
    console.log(`\n⚠️  ${signal} received. Shutting down gracefully...`);
    // Close all active Socket.IO connections
    exports.io.close(() => {
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
