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

     // ─── message:send ──────────────────────────────────────────────────────────
    // 1. Validate payload
    // 2. Persist to MongoDB
    // 3. Broadcast to all in room (including sender)
    // 4. ACK back to sender with the saved message
    // console.log("a user connected");

    socket.on("message:send", async (payload: SendMessagePayload, callback) => {
        const { roomId, content, type = 'text' } = payload;
        
        // Basic validation
        if (!content?.trim()) {
            return callback({ status: 'error', message: 'Message cannot be empty' });
        }

        if(!roomId){
            return callback({ status: 'error', message: 'roomId is required' });
        }

        if (content.length > 4000) {
            return callback({ status: 'error', message: "Message too long" });
        }
        
        try{
            const saved = await Messages.create({
                roomId,
                sender: {
                    userId: user.userId,
                    username: user.username,
                    avatar: user.avatar
                },
                content: content.trim(),
                type,
                readBy: [user.userId], // Sender has already read their own message
            });

            const messageData = saved.toObject();
            console.log("Message saved:", messageData);
            // Broadcast to everyone in the room, including sender
            io.to(roomId).emit("message:new", messageData);

            // ACK back to sender with the saved message
            callback({ status: 'ok', message: messageData });
        }catch (error) {
            console.error("Error occurred while sending message:", error);
            callback({ status: 'error', message: 'Failed to send message' });
        }
    })

     // ─── message:delete ────────────────────────────────────────────────────────


    // ─── typing indicators ─────────────────────────────────────────────────────
  // Emit to everyone in the room EXCEPT the sender (socket.to vs io.to)
    socket.on("typing:start", () => {
        io.to(roomId).emit("typing:update", 
        { 
            userId: user.userId, 
            username: user.username, 
            avatar: user.avatar, 
            isTyping: true });
    })

    socket.on("typing:stop", () => {
        io.to(roomId).emit("user:stopped_typing",{
            userId: user.userId,
            username: user.username,
            avatar: user.avatar,
            isTyping: false
        })
    })
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