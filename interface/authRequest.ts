import { Request } from "express";

export interface AuthRequest extends Request {
  user?: {
    userId: string;
    name: string;
    avatar?: string
  };
}