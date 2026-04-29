"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
require('dotenv').config();
const AuthSchema = new mongoose_1.default.Schema({
    name: {
        type: String,
        required: [true, 'Name is required'],
        minLength: 3,
        maxLength: 50,
        unique: false
    },
    email: {
        type: String,
        require: [true, 'Please provide an email'],
        match: [
            /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/, //regex
            'Please provide a valid email'
        ],
        unique: true
    },
    password: {
        type: String,
        require: [true, 'Please provide a password'],
        minLength: 6
    },
    avatar: {
        type: String,
        default: null
    }
});
// module.exports = mongoose.model('Auth', Auth);
// Hash Passsword
AuthSchema.pre('save', function (next) {
    return __awaiter(this, void 0, void 0, function* () {
        const userSalt = yield bcryptjs_1.default.genSalt(10);
        this.password = yield bcryptjs_1.default.hash(this.password, userSalt);
        next();
    });
});
// process.env.JWT_SECRET_KEY u still need to look into the all keys generator
// This function creates a JWT (JSON Web Token) for a user. Here's a breakdown:
// In simple terms — after a user signs up or logs in, you call user.createJWT() and send the token back to the client. 
// The client stores it and sends it with every request to prove they're logged in, instead of sending their 
// password every time.
AuthSchema.methods.createJWT = function () {
    return jsonwebtoken_1.default.sign({ userId: this._id, name: this.name }, process.env.JWT_SECRET_KEY, { expiresIn: process.env.JWT_LIFETIME });
};
AuthSchema.methods.comparePassword = function (candidatePassword) {
    return __awaiter(this, void 0, void 0, function* () {
        const isMatch = yield bcryptjs_1.default.compare(candidatePassword, this.password);
        return isMatch;
    });
};
exports.default = mongoose_1.default.model('Auth', AuthSchema);
