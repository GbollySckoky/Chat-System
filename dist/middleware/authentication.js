"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const errors_1 = require("../errors");
require('dotenv').config();
const authMiddleware = async (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        throw new errors_1.UnauthenticatedError("Authentication invalid");
    }
    const token = authHeader.split(" ")[1];
    if (!process.env.JWT_SECRET_KEY) {
        throw new Error("JWT_SECRET_KEY is not defined");
    }
    try {
        // passing the id to the payload of the token, so we can use it later to identify the user
        const payload = jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET_KEY);
        req.user = {
            userId: payload.userId,
            name: payload.name,
            avatar: payload.avatar
        };
        next();
    }
    catch (error) {
        throw new errors_1.UnauthenticatedError("Authentication invalid");
    }
};
exports.default = authMiddleware;
