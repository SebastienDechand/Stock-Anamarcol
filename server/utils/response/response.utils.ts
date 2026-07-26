import { Response } from 'express';
import { ErrorCode } from '../../constants/errorCodes';

// Logs the error server-side and sends a uniform 500 JSON response.
export function handleError(
  res: Response,
  err: unknown,
  logMessage: string,
  responseMessage = 'Internal server error',
  code: ErrorCode = ErrorCode.INTERNAL_ERROR,
): void {
  console.error(logMessage, err);
  res.status(500).json({ message: responseMessage, code });
}
