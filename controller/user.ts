import { NextFunction, Response} from "express"
import { AuthRequest} from "../interface/authRequest"
import Auth from "../models/auth"
import { StatusCodes } from "http-status-codes"

const getAllUsers = async (req: AuthRequest, res: Response, next: NextFunction) => {
    const userId = req.user?.userId
    const {name, email} = req.query
    if(!userId) return res.status(StatusCodes.UNAUTHORIZED).json({ success: false, message: "Unauthorized" });
   

    const queryObject: Record<string, any> = {}

    if(!name){
        queryObject.name = name
    }

    if(!email){
        queryObject.email = email
    }

     const users = await Auth.find(queryObject)

    return res.status(StatusCodes.OK).json({ success: true, data: users })

}