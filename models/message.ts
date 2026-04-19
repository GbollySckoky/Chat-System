import mongoose from 'mongoose';
import { IMessage } from '../interface/Message';


const MessageSchema = new mongoose.Schema<IMessage>({
   sender: {
        userId:   { type: String, required: true },
        username: { type: String, required: true },
        avatar:   { type: String },
    },
    content: {
        type: String,
        required: [true, 'Message content is required'],
        maxLength: 400
    },
    roomId: {
        type: String,
        required: true,
        index: true
    },
    type: {
        type: String,
        enum: ['text', 'image', 'file'],
        default: 'text'
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    readBy: {
        type: [String], // array of userIds (strings), not ObjectIds
        default: []
    },
    deletedAt: {
        type: Date,
        default: null
    },
},
    {
        timestamps: true, // auto createdAt + updatedAt
    });

    // compound index for paginated history queries
MessageSchema.index({ roomId: 1, createdAt: -1 });

// soft delete filter — never return deleted messages
MessageSchema.pre('find', function () {
    this.where({ deletedAt: null });
});

export default mongoose.model('Messages', MessageSchema);