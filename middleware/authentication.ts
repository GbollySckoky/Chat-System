import { NextFunction, Response, Request } from "express"
import jwt from 'jsonwebtoken'
import { UnauthenticatedError } from '../errors'
import { AuthRequest } from "../interface/authRequest";
require('dotenv').config();

const authMiddleware = async (req: AuthRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    throw new UnauthenticatedError("Authentication invalid");
  }

  const token = authHeader.split(" ")[1];

  if (!process.env.JWT_SECRET_KEY) {
    throw new Error("JWT_SECRET_KEY is not defined");
  }

  try {
    // passing the id to the payload of the token, so we can use it later to identify the user
    const payload = jwt.verify(token, process.env.JWT_SECRET_KEY as string) as {
      userId: string;
      name: string;
      avatar: string;
    };

    req.user = {
      userId: payload.userId,
      name: payload.name,
      avatar: payload.avatar
    };

    next();
  } catch (error) {
    throw new UnauthenticatedError("Authentication invalid");
  }
};
export default authMiddleware