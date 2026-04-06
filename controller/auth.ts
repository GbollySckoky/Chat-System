import Auth from "../models/auth"
import { Request, Response } from 'express'

const signUp = async (req: Request, res: Response) => {
//     res.status(201).json({ message: "User created successfully" });
//   } catch (error: any) {
//     res.status(500).json({ message: error.message });
//   }
const user = await Auth.create({...req.body});
console.log(user);
const token = user.createJWT();
console.log(token);
console.log(user.name);
res.status(201).json({ user: { name: user.name }, token });
}