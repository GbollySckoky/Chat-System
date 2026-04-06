import { StatusCodes }  from 'http-status-codes';
import CustomAPIError  from './custom-api';

class BadRequestError extends CustomAPIError {
  constructor(message: string = 'Bad Request') {
    super(message, StatusCodes.BAD_REQUEST);
    // this.statusCode = StatusCodes.BAD_REQUEST;
  }
}

export default BadRequestError;
