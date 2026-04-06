import { NextFunction, Response } from "express"
const jwt = require('jsonwebtoken')
const { UnauthenticatedError } = require('../errors')
import { AuthRequest } from "../types/authRequest"

const auth = async (req: AuthRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer")) {
    throw new UnauthenticatedError("Authentication invalid");
  }

  const token = authHeader.split(" ")[1];

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET_KEY as string) as {
      userId: string;
      name: string;
    };

    req.user = {
      userId: payload.userId,
      name: payload.name,
    };

    next();
  } catch (error) {
    throw new UnauthenticatedError("Authentication invalid");
  }
};
module.exports = auth