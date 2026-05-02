import mongoose, { Document } from "mongoose";
interface INotification extends Document{
    userId: string;   // who receives the notification
    roomId?: string; // Optional, if the notification is related to a specific room
    message: string;
    isRead: boolean;
    createdAt: Date;
    type: 'message' | 'mention' | 'join' | 'leave'
}

const Notifications = new mongoose.Schema<INotification>({
    userId: {
        type: String,
        index: true,
        required: true
    },
    roomId:{
        type: String,
        required: true
    },
    message: {
        type: String,
        required: [true, 'Message is required']
    },
    isRead: {
        type: Boolean,
        default: false
    },
    type: {
        type: String,
        enum: ['message', 'mention', 'join', 'leave'],
        default: 'message'
    }
},
 { timestamps: true }
);

export default mongoose.model('Notifications', Notifications);