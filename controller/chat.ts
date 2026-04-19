import { Server } from "socket.io";
import type { Server as SocketServer } from "socket.io";
import {AuthSocket, SendMessagePayload} from "../interface/authSocket"
import Messages from "../models/message";


const io = new Server(3000, {
    cors: {
        origin: "http://localhost:5173",
        methods: ["GET", "POST"]
    }
});

// In-memory presence store: roomId → Set of { userId, username, socketId }
// For production at scale, swap this for Redis with `socket.io-redis`
const roomPresence = new Map<string, Set<{ userId: string; username: string; avatar?: string; socketId: string }>>();
 
const getPresenceList = (roomId: string) =>
  Array.from(roomPresence.get(roomId) ?? []);


export function registerChatHandlers(io: Server, socket: AuthSocket) {
    const user = socket.user!;

    io.on('connection', () => {
        console.log('Connected.....')
    })

    // ─── room:join ─────────────────────────────────────────────────────────────
    // Client joins a room → socket joins the Socket.IO room, presence is updated
  socket.on("room:join", async (roomId: string, callback) => {
    try{
        await socket.join(roomId);

        // add to presence map
        if(!roomPresence.has(roomId)) roomPresence.set(roomId, new Set());
        roomPresence.get(roomId)!.add({
            userId: user.userId,    
            username: user.username,
            avatar: user.avatar,
            socketId: socket.id
        })

        // Sends a message only to clients who have joined a specific room
        io.to('room:join').emit('presence:update', { roomId, users: getPresenceList(roomId) });
        callback({ status: 'ok' });
        console.log(`👥 ${user.username} joined room: ${roomId}`);
    } catch (error) {
        console.error("Error occurred while joining room:", error);
        callback({ status: 'error', message: 'Failed to join room' });
    }

      // ─── room:leave ────────────────────────────────────────────────────────────
    socket.on("room:leave", async (roomId: string) => {
        await socket.leave(roomId);
        removeFromPresence(roomId, socket.id)
        // notify the group he/she left
        io.to(roomId).emit('presence:update', { roomId, users: getPresenceList(roomId) });
        console.log(`👋 ${user.username} left room: ${roomId}`);
    })
    // console.log("a user connected");

    // socket.on("disconnect", () => {
    //     console.log("user disconnected");
    // });

    // socket.on("chat message", (msg: string) => {
    //     console.log("message: " + msg);
    //     io.emit("chat message", msg);
    // });
})
}

const removeFromPresence = (roomId: string, socketId: string) => {
    const room = roomPresence.get(roomId);
    if (room) {
        // A simple analogy — imagine room is a bag of items. of tells you to reach in and pick one out. user is just what you call the thing in your hand while you're looking at it. When you're done you reach back in, grab the next one, and user now refers to that one instead.
        for (const user of room) {
            if (user.socketId === socketId) {
                room.delete(user);
                break;
            }
        }
        if (room.size === 0) {
            roomPresence.delete(roomId);
        }
    }
}