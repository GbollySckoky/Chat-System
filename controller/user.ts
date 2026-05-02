import { NextFunction, Response} from "express"
import { AuthRequest} from "../interface/authRequest"
import Auth from "../models/auth"

const getAllUsers = async (req: AuthRequest, res: Response, next: NextFunction) => {
    const users = await Auth.find()
    const userId = req.user?.userId
    
}