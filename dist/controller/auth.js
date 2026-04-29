"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.login = exports.signUp = void 0;
const http_status_codes_1 = require("http-status-codes");
const auth_1 = __importDefault(require("../models/auth"));
const unauthenticated_1 = __importDefault(require("../errors/unauthenticated"));
const bad_request_1 = __importDefault(require("../errors/bad-request"));
const signUp = async (req, res) => {
    //     res.status(201).json({ message: "User created successfully" });
    //   } catch (error: any) {
    //     res.status(500).json({ message: error.message });
    //   }
    // Validate first, before touching the DB
    const { name, email, password } = req.body;
    if (!name)
        return res.status(http_status_codes_1.StatusCodes.BAD_REQUEST).json({ success: false, message: "Please provide name" });
    if (!email)
        return res.status(http_status_codes_1.StatusCodes.BAD_REQUEST).json({ success: false, message: "Please provide email" });
    if (!password)
        return res.status(http_status_codes_1.StatusCodes.BAD_REQUEST).json({ success: false, message: "Please provide password" });
    if (password.length < 6)
        return res.status(http_status_codes_1.StatusCodes.BAD_REQUEST).json({ success: false, message: "Password must be at least 6 characters" });
    if (name.length < 3 || name.length > 50)
        return res.status(http_status_codes_1.StatusCodes.BAD_REQUEST).json({ success: false, message: "Name must be between 3 and 50 characters" });
    const user = await auth_1.default.create({ name, email, password });
    console.log("user:", user);
    const token = user.createJWT();
    console.log("token:", token);
    console.log("name:", user.name);
    res.status(http_status_codes_1.StatusCodes.CREATED).json({ user: { name: user.name }, token });
};
exports.signUp = signUp;
const login = async (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) {
        throw new bad_request_1.default("Please provide email and password");
    }
    // To verify the login or if the user exits
    const user = await auth_1.default.findOne({ email });
    console.log("user:", user);
    // if user info is wrong || if user is not authorized
    if (!user) {
        throw new unauthenticated_1.default("Invalid Credentials");
    }
    // check if password is correct
    const isPasswordCorrect = await user.comparePassword(password);
    console.log("isPasswordCorrect:", isPasswordCorrect);
    if (!isPasswordCorrect) {
        throw new unauthenticated_1.default("Invalid Credentials");
    }
    // check if password is correct, then create token
    const token = user.createJWT();
    console.log("token:", token);
    res.status(http_status_codes_1.StatusCodes.OK).json({ user: { name: user.name }, token });
};
exports.login = login;
