import { StatusCodes } from "http-status-codes";
import Auth from "../models/auth"
import { Request, Response } from 'express'
import UnauthenticatedError from "../errors/unauthenticated";
import BadRequestError from "../errors/bad-request";



const signUp = async (req: Request, res: Response) => {
//     res.status(201).json({ message: "User created successfully" });
//   } catch (error: any) {
//     res.status(500).json({ message: error.message });
//   }
 // Validate first, before touching the DB
 const { name, email, password } = req.body;

  if(!name) return res.status(StatusCodes.BAD_REQUEST).json({ success: false, message: "Please provide name" });
  if(!email) return res.status(StatusCodes.BAD_REQUEST).json({ success: false, message: "Please provide email" });
  if(!password) return res.status(StatusCodes.BAD_REQUEST).json({ success: false, message: "Please provide password" });
  if(password.length < 6) return res.status(StatusCodes.BAD_REQUEST).json({ success: false, message: "Password must be at least 6 characters" });
  if(name.length < 3 || name.length > 50) return res.status(StatusCodes.BAD_REQUEST).json({ success: false, message: "Name must be between 3 and 50 characters" });

const user = await Auth.create({name, email, password});

console.log("user:", user);
const token = user.createJWT();
console.log("token:", token);
console.log("name:", user.name);
res.status(StatusCodes.CREATED).json({ user: { name: user.name }, token });
}


const login = async (req: Request, res: Response) => {
const { email, password } = req.body;

if (!email || !password) {
    throw new BadRequestError("Please provide email and password");
}

// To verify the login or if the user exits
const user = await Auth.findOne({ email });
console.log("user:", user);
 // if user info is wrong || if user is not authorized
if (!user) {
    throw new UnauthenticatedError("Invalid Credentials");
}

// check if password is correct
const isPasswordCorrect = await user.comparePassword(password);
console.log("isPasswordCorrect:", isPasswordCorrect);
if (!isPasswordCorrect) {
    throw new UnauthenticatedError("Invalid Credentials");
}

// check if password is correct, then create token
const token = user.createJWT();
console.log("token:", token);
res.status(StatusCodes.OK).json({ user: { name: user.name }, token });
}

export { signUp, login }