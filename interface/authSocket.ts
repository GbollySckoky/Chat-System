import { Socket } from "socket.io";

export interface AuthSocket extends Socket {
    user?: {
        userId: string;
        username: string;
        avatar?: string;
    };
}

export interface SendMessagePayload {
    roomId: string;
    content: string;
    type?: 'text' | 'image' | 'file';
}