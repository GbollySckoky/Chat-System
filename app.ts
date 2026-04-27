import dotenv from "dotenv";
dotenv.config();

import express from "express";
import http from "http";
import { Server } from "socket.io";
import jwt from "jsonwebtoken";
import cors from "cors";

import connectDB from "./db/connect";
import authRouter from "./route/auth";
import messageRouter from "./route/message";
import notFound from "./middleware/not-found";
import { AuthSocket } from "./interface/authSocket";
import { registerChatHandlers } from "./controller/chat";

const app = express();
const httpServer = http.createServer(app);

export const io = new Server(httpServer, {
  cors: {
    origin: process.env.CLIENT_URL || [  "http://localhost:3000","http://localhost:5173"],
    methods: ["GET", "POST"],
    credentials: true,
  },
});

io.use((socket: AuthSocket, next) => {
  const authHeader = socket.handshake.headers["authorization"];

  const token =
    socket.handshake.auth.token ||
    (authHeader && authHeader.startsWith("Bearer ")
      ? authHeader.split(" ")[1]
      : null);

  if (!token) return next(new Error("Authentication error"));

  // try {
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET_KEY!
    ) as {
      userId: string;
      username: string;
      avatar?: string;
    };
// You give them a name tag:
// “Okay, you are Gbolahan. Come in.”
    socket.user = decoded;
    next();
  // } catch {
    next(new Error("Authentication error"));
  // }
});

io.on("connection", (socket: AuthSocket) => {
  console.log(`✅ ${socket.user?.username} connected`);
  registerChatHandlers(io, socket);
});

app.use(express.json());
/**
 * Why credentials: true?
 * 👉 Means:
 * “Allow cookies / auth headers (like JWT) to be sent”
 * Without it:
 * “No cookies / auth headers will be sent”
 * 
 * "*" 
 * But "*" means:
 * “Allow ANY website in the world”
 * means allow any browser to connect, but it won't work with credentials: true. 
 * You need to specify the exact origin (like http://localhost:3000) for it to work properly.
 * so take it out and add your client URL in the origin field, or if you want to allow multiple origins you can do something like this:
 * origin: [ "http://localhost:3000", "http://localhost:5173" ]
 * 
 * In development, you might want to allow all origins for testing, but in production, you should specify the exact origin of your client application for security reasons.
 * * */
app.use(cors({ origin: process.env.CLIENT_URL, credentials: true }));

app.use("/api/v1/messages", messageRouter);
app.use("/api/v1/auth", authRouter);

app.use(notFound);

const PORT = process.env.PORT || 5000;

const start = async () => {
  await connectDB(process.env.MONGO_URI as string);

  httpServer.listen(PORT, () => {
    console.log(`Server running on ${PORT}`);
  });
};

start();