import { StatusCodes } from 'http-status-codes';
import CustomAPIError from './custom-api';

class UnauthenticatedError extends CustomAPIError {
  constructor(message: string = 'Authentication invalid') {
    super(message, StatusCodes.UNAUTHORIZED);
  }
}

export default UnauthenticatedError;