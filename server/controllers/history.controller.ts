import { Request, Response } from "express";
import HistoryModel from "../models/history.model";
import { validateObjectId } from "../utils/validate.utils";
import { ErrorCode } from "../constants/errorCodes";

export const getItemHistory = async (
  req: Request,
  res: Response,
): Promise<void> => {
  if (!validateObjectId(req.params.id as string, res)) return;

  try {
    const history = await HistoryModel.find({ itemId: req.params.id })
      .sort({ createdAt: -1 })
      .limit(100)
      .lean();

    res.status(200).json(history);
  } catch (err) {
    console.error("Error fetching item history:", err);
    res
      .status(500)
      .json({ message: "Internal server error", code: ErrorCode.INTERNAL_ERROR });
  }
};
