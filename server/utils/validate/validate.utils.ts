import { Response } from 'express';
import mongoose from 'mongoose';
import { ErrorCode } from '../../constants/errorCodes';
import { SUPPLIERS, STATUSES, Supplier, Status } from '../../constants';

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

export function validateSupplier(supplier: string | string[], res: Response): supplier is Supplier {
  const isValid = typeof supplier === 'string' && SUPPLIERS.some((s) => s === supplier);
  if (!isValid) {
    res.status(400).json({ message: 'Invalid supplier' });
    return false;
  }
  return true;
}

export function validateStatus(status: string | string[], res: Response): status is Status {
  const isValid = typeof status === 'string' && STATUSES.some((s) => s === status);
  if (!isValid) {
    res.status(400).json({ message: 'Invalid status' });
    return false;
  }
  return true;
}
