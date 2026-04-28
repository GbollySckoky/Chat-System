import mongoose from "mongoose";
import { IRoom } from "../interface/room";

const RoomSchema = new mongoose.Schema<IRoom>({
    name: {
        type: String,
        required: [true, 'Room name is required'],
        unique: true,
        trim: true,
        maxLength: 100
    },
    participants: {
        type: [{type: String}], // array of userIds objects, not ObjectIds [strings]
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
},
    {
        timestamps: true, // auto createdAt + updatedAt
    });

export default mongoose.model('Room', RoomSchema);