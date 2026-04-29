"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const RoomSchema = new mongoose_1.default.Schema({
    name: {
        type: String,
        required: [true, 'Room name is required'],
        unique: true,
        trim: true,
        maxLength: 100
    },
    participants: {
        type: [{ type: String }], // array of userIds objects, not ObjectIds [strings]
        default: []
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    deletedAt: {
        type: Date,
        default: null
    },
    updatedAt: {
        type: Date,
        default: Date.now
    },
    createdBy: {
        type: String, // userId of the creator
        required: true
    },
    description: {
        type: String,
        maxLength: 500
    }
}, {
    timestamps: true, // auto createdAt + updatedAt
});
exports.default = mongoose_1.default.model('Room', RoomSchema);
