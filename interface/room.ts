import { Document } from "mongoose";

export interface IRoom extends Document {
    name: string;
    participants: string[];
    description?: string;
    createdAt?: Date;
    updatedAt?: Date;
    deletedAt?: Date;
    createdBy?: string; // userId of the creator
}