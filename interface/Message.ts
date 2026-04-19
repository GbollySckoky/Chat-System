import mongoose, {Schema, Document} from 'mongoose';

interface SenderInfo {
    userId: string;
    username: string;
    avatar?: string
}

type MessageType = 'text' | 'image' | 'file';

export interface IMessage extends Document {
    sender: SenderInfo;
    roomId: string;
    content: string;
    type: MessageType;
    readBy: string[]; // array of userIds (strings), not ObjectIds
    deletedAt: Date;
    createdAt: Date; // comes from timestamps: true
    updatedAt: Date;
}
