"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerChatHandlers = registerChatHandlers;
const message_1 = __importDefault(require("../models/message"));
/**
 * For a chat system, the best practice is:
HTTP for — anything that is a resource operation:

POST /rooms — create room
GET /rooms — list rooms
DELETE /rooms/:roomId — delete room
GET /messages/:roomId — fetch message history
DELETE /messages/:messageId — delete message

WebSocket for — anything real-time:

sendMessage
joinRoom
leaveRoom
typing... indicators
Online/offline presence
 */
const roomPresence = new Map();
const getPresenceList = (roomId) => { var _a; return Array.from((_a = roomPresence.get(roomId)) !== null && _a !== void 0 ? _a : []); };
// CHECK README.MD FOR WEBSOCKET METHODS
function registerChatHandlers(io, socket) {
    const user = socket.user;
    socket.on("room:join", (roomId, callback) => __awaiter(this, void 0, void 0, function* () {
        try {
            yield socket.join(roomId);
            if (!roomPresence.has(roomId))
                roomPresence.set(roomId, new Set());
            roomPresence.get(roomId).add({
                userId: user.userId,
                username: user.username,
                avatar: user.avatar,
                socketId: socket.id
            });
            io.to(roomId).emit('presence:update', { roomId, users: getPresenceList(roomId) });
            callback({ status: 'ok' });
            console.log(`👥 ${user.username} joined room: ${roomId}`);
        }
        catch (error) {
            console.error("Error joining room:", error);
            callback({ status: 'error', message: 'Failed to join room' });
        }
    }));
    socket.on("room:leave", (roomId) => __awaiter(this, void 0, void 0, function* () {
        yield socket.leave(roomId);
        removeFromPresence(roomId, socket.id);
        io.to(roomId).emit('presence:update', { roomId, users: getPresenceList(roomId) });
        console.log(`👋 ${user.username} left room: ${roomId}`);
    }));
    socket.on("message:send", (payload, callback) => __awaiter(this, void 0, void 0, function* () {
        const { roomId, content, type = 'text' } = payload;
        if (!(content === null || content === void 0 ? void 0 : content.trim()))
            return callback({ status: 'error', message: 'Message cannot be empty' });
        if (!roomId)
            return callback({ status: 'error', message: 'roomId is required' });
        if (content.length > 4000)
            return callback({ status: 'error', message: 'Message too long' });
        try {
            const saved = yield message_1.default.create({
                roomId,
                sender: { userId: user.userId, username: user.username, avatar: user.avatar },
                content: content.trim(),
                type,
                readBy: [user.userId],
            });
            const messageData = saved.toObject();
            io.to(roomId).emit("message:new", messageData);
            callback({ status: 'ok', message: messageData });
        }
        catch (error) {
            console.error("Error sending message:", error);
            callback({ status: 'error', message: 'Failed to send message' });
        }
    }));
    socket.on("message:delete", (messageId, callback) => __awaiter(this, void 0, void 0, function* () {
        try {
            const message = yield message_1.default.findById(messageId);
            if (!message)
                return callback({ status: 'error', message: 'Message not found' });
            if (message.sender.userId !== user.userId)
                return callback({ status: 'error', message: 'Unauthorized' });
            message.deletedAt = new Date();
            yield message.save();
            io.to(message.roomId).emit("message:deleted", { messageId });
            callback({ status: 'ok' });
        }
        catch (error) {
            console.error("Error deleting message:", error);
            callback({ status: 'error', message: 'Failed to delete message' });
        }
    }));
    socket.on("typing:start", (roomId) => {
        socket.to(roomId).emit("typing:update", {
            userId: user.userId,
            username: user.username,
            isTyping: true
        });
    });
    socket.on("typing:stop", (roomId) => {
        socket.to(roomId).emit("typing:update", {
            userId: user.userId,
            username: user.username,
            isTyping: false
        });
    });
    socket.on("disconnect", () => {
        for (const roomId of roomPresence.keys()) {
            removeFromPresence(roomId, socket.id);
            if (roomPresence.get(roomId).size > 0) {
                io.to(roomId).emit("presence:update", getPresenceList(roomId));
            }
        }
        console.log(`❌ Disconnected: ${user.username} [${socket.id}]`);
    });
}
const removeFromPresence = (roomId, socketId) => {
    const room = roomPresence.get(roomId);
    if (room) {
        for (const user of room) {
            if (user.socketId === socketId) {
                room.delete(user);
                break;
            }
        }
        if (room.size === 0)
            roomPresence.delete(roomId);
    }
};
