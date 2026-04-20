import type { Server as SocketServer } from "socket.io";
import { AuthSocket, SendMessagePayload } from "../interface/authSocket";
import Messages from "../models/message";

const roomPresence = new Map<string, Set<{ userId: string; username: string; avatar?: string; socketId: string }>>();

const getPresenceList = (roomId: string) =>
    Array.from(roomPresence.get(roomId) ?? []);

export function registerChatHandlers(io: SocketServer, socket: AuthSocket) {
    const user = socket.user!;

    socket.on("room:join", async (roomId: string, callback) => {
        try {
            await socket.join(roomId);

            if (!roomPresence.has(roomId)) roomPresence.set(roomId, new Set());
            roomPresence.get(roomId)!.add({
                userId: user.userId,
                username: user.username,
                avatar: user.avatar,
                socketId: socket.id
            });

            io.to(roomId).emit('presence:update', { roomId, users: getPresenceList(roomId) });
            callback({ status: 'ok' });
            console.log(`👥 ${user.username} joined room: ${roomId}`);
        } catch (error) {
            console.error("Error joining room:", error);
            callback({ status: 'error', message: 'Failed to join room' });
        }
    });

    socket.on("room:leave", async (roomId: string) => {
        await socket.leave(roomId);
        removeFromPresence(roomId, socket.id);
        io.to(roomId).emit('presence:update', { roomId, users: getPresenceList(roomId) });
        console.log(`👋 ${user.username} left room: ${roomId}`);
    });

    socket.on("message:send", async (payload: SendMessagePayload, callback) => {
        const { roomId, content, type = 'text' } = payload;

        if (!content?.trim()) return callback({ status: 'error', message: 'Message cannot be empty' });
        if (!roomId) return callback({ status: 'error', message: 'roomId is required' });
        if (content.length > 4000) return callback({ status: 'error', message: 'Message too long' });

        try {
            const saved = await Messages.create({
                roomId,
                sender: { userId: user.userId, username: user.username, avatar: user.avatar },
                content: content.trim(),
                type,
                readBy: [user.userId],
            });

            const messageData = saved.toObject();
            io.to(roomId).emit("message:new", messageData);
            callback({ status: 'ok', message: messageData });
        } catch (error) {
            console.error("Error sending message:", error);
            callback({ status: 'error', message: 'Failed to send message' });
        }
    });

    socket.on("message:delete", async (messageId: string, callback) => {
        try {
            const message = await Messages.findById(messageId);
            if (!message) return callback({ status: 'error', message: 'Message not found' });
            if (message.sender.userId !== user.userId) return callback({ status: 'error', message: 'Unauthorized' });

            message.deletedAt = new Date();
            await message.save();

            io.to(message.roomId).emit("message:deleted", { messageId });
            callback({ status: 'ok' });
        } catch (error) {
            console.error("Error deleting message:", error);
            callback({ status: 'error', message: 'Failed to delete message' });
        }
    });

    socket.on("typing:start", (roomId: string) => {
        socket.to(roomId).emit("typing:update", {
            userId: user.userId,
            username: user.username,
            isTyping: true
        });
    });

    socket.on("typing:stop", (roomId: string) => {
        socket.to(roomId).emit("typing:update", {
            userId: user.userId,
            username: user.username,
            isTyping: false
        });
    });

    socket.on("disconnect", () => {
        for (const roomId of roomPresence.keys()) {
            removeFromPresence(roomId, socket.id);
            if (roomPresence.get(roomId)!.size > 0) {
                io.to(roomId).emit("presence:update", getPresenceList(roomId));
            }
        }
        console.log(`❌ Disconnected: ${user.username} [${socket.id}]`);
    });
}

const removeFromPresence = (roomId: string, socketId: string) => {
    const room = roomPresence.get(roomId);
    if (room) {
        for (const user of room) {
            if (user.socketId === socketId) {
                room.delete(user);
                break;
            }
        }
        if (room.size === 0) roomPresence.delete(roomId);
    }
};