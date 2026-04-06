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
const user = await Auth.create({...req.body});
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
 // if user info is wrong || if user is not authorized
if (!user) {
    throw new UnauthenticatedError("Invalid Credentials");
}
}

export { signUp, login }