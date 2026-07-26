import { Response } from 'express';
import mongoose from 'mongoose';
import { ErrorCode } from '../../constants/errorCodes';

/**
 * Validates a MongoDB ObjectID. Returns 400 if invalid.
 * @returns `true` if the ID is valid, `false` otherwise (response already sent).
 */
export function validateObjectId(id: string, res: Response): boolean {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    res.status(400).json({ message: 'Invalid ID', code: ErrorCode.INVALID_ID });
    return false;
  }
  return true;
}
