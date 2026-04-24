require('dotenv').config();
import express from 'express';
import connectDB from './db/connect';
const authRouter = require('./route/auth');;
import { Server } from 'socket.io';
import http from 'http';
import notFound from './middleware/not-found';
import jwt from "jsonwebtoken";
import cors from "cors";
import { AuthSocket } from './interface/authSocket';
import { registerChatHandlers } from './controller/chat';
import messageRouter from './route/message';  

const app = express();
const httpServer = http.createServer(app);


// ─── Socket.IO Server Setup ───────────────────────────────────────────────────
export const io = new Server(httpServer, {
  cors: {
    origin: process.env.CLIENT_URL || "http://localhost:5173",
    methods: ["GET", "POST"],
    credentials: true,
  },
  // Every 25 seconds the server sends a ping to every connected client basically asking "you still there?".
  //  This is to detect dead connections.
  pingInterval: 25000,
//   If the client doesn't reply to that ping within 60 seconds, the server assumes they're gone and disconnects them
// . This fires the disconnect event and cleans up their presence.
  pingTimeout: 60000,
  // Allow up to 1MB per message
  maxHttpBufferSize: 1e6,
});

// ─── JWT Auth Middleware (runs before every connection) ───────────────────────
io.use((socket: AuthSocket, next) => {
  const token =
    socket.handshake.auth.token ||
    socket.handshake.headers["authorization"]?.split(" ")[1];
 
  if (!token) return next(new Error("Authentication error: No token provided"));
 
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as {
      userId: string;
      username: string;
      avatar?: string;
    };
    socket.user = decoded; // Attach user to socket instance
    next();
  } catch {
    next(new Error("Authentication error: Invalid token"));
  }
});
 
// ─── Register Chat Event Handlers ────────────────────────────────────────────
io.on("connection", (socket: AuthSocket) => {
  console.log(`✅ User connected: ${socket.user?.username} [${socket.id}]`);
  registerChatHandlers(io, socket);
});

app.use(express.json());
app.use(cors({ origin: process.env.CLIENT_URL || "http://localhost:5173", credentials: true }));
app.use("/api/messages", messageRouter);
app.use(express.json());

app.use('/api/v1/auth', authRouter);

app.use(notFound);
const PORT = process.env.PORT || 5000;

const start = async () => {
    try {
        await connectDB(process.env.MONGO_URI as string);
        console.log('Connected to MongoDB');
        app.listen(PORT, () => console.log(`Server is running on port ${PORT}`));
    } catch (error) {
        console.error('Error connecting to MongoDB:', error);
    }
}

start();