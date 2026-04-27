import { NextFunction, Request, Response } from 'express'
import { StatusCodes } from 'http-status-codes'
import CustomAPIError from '../errors/custom-api'

// Mongoose vlidation error
// Validation error
// Cast Error
const errorHandlerMiddleware = (err: any, req: Request, res: Response, next: NextFunction) => {
  let customError = {
    // set default
    statusCode: err.statusCode || StatusCodes.INTERNAL_SERVER_ERROR,
    msg: err.message || 'Something went wrong try again later',
  }


  if (err instanceof CustomAPIError) {
    return res.status(err.statusCode).json({ msg: err.message })
  }
  // Validation Error
  if (err.name === 'ValidationError') {
    customError.msg = Object.values(err.errors)
      .map((item: any) => item.message)
      .join(',')
    customError.statusCode = StatusCodes.BAD_REQUEST
  }
  // Duplicate/mongoose errors
  if (err.code && err.code === 11000) {
    customError.msg = `Duplicate value entered for ${Object.keys(
      err.keyValue
    )} field, please choose another value`
    customError.statusCode = StatusCodes.BAD_REQUEST
  }
  // Cast Error
  if (err.name === 'CastError') {
    customError.msg = `No item found with id : ${err.value}`
    customError.statusCode = StatusCodes.NOT_FOUND
  }
  // console.log(customError.msg)
  return res.status(customError.statusCode).json({ msg: customError.msg })
}

export default errorHandlerMiddleware
