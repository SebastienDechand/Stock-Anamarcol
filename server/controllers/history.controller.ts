import { Request, Response } from "express";
import HistoryModel from "../models/history.model";
import { validateObjectId } from "../utils/validate.utils";
import { handleError } from "../utils/response.utils";

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
    handleError(res, err, "Error fetching item history:");
  }
};
