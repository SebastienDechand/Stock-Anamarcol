import { Request, Response } from "express";

const mockHistoryModel = {
  find: jest.fn(),
};

jest.mock("../models/history.model", () => ({
  __esModule: true,
  default: mockHistoryModel,
}));

import { getItemHistory } from "../controllers/history.controller";

describe("History Controller", () => {
  let req: Partial<Request>;
  let res: Partial<Response>;

  beforeEach(() => {
    req = { params: {} };
    res = {
      status: jest.fn().mockReturnThis() as unknown as Response["status"],
      json: jest.fn() as unknown as Response["json"],
    };
    jest.clearAllMocks();
    jest.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => jest.restoreAllMocks());

  describe("getItemHistory", () => {
    it("should return 400 for an invalid ObjectId", async () => {
      req.params = { id: "invalid" };
      await getItemHistory(req as Request, res as Response);
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ message: "ID invalide" });
    });

    it("should return item history sorted by createdAt desc", async () => {
      req.params = { id: "507f1f77bcf86cd799439011" };
      const entries = [
        { _id: "h1", action: "update", field: "quantite" },
        { _id: "h2", action: "create" },
      ];
      mockHistoryModel.find.mockReturnValue({
        sort: jest.fn().mockReturnValue({
          limit: jest.fn().mockReturnValue({
            lean: jest.fn().mockResolvedValue(entries),
          }),
        }),
      });

      await getItemHistory(req as Request, res as Response);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(entries);
      expect(mockHistoryModel.find).toHaveBeenCalledWith({
        itemId: "507f1f77bcf86cd799439011",
      });
    });

    it("should return an empty array when no history exists", async () => {
      req.params = { id: "507f1f77bcf86cd799439011" };
      mockHistoryModel.find.mockReturnValue({
        sort: jest.fn().mockReturnValue({
          limit: jest.fn().mockReturnValue({
            lean: jest.fn().mockResolvedValue([]),
          }),
        }),
      });

      await getItemHistory(req as Request, res as Response);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith([]);
    });

    it("should return 500 on database error", async () => {
      req.params = { id: "507f1f77bcf86cd799439011" };
      mockHistoryModel.find.mockReturnValue({
        sort: jest.fn().mockReturnValue({
          limit: jest.fn().mockReturnValue({
            lean: jest.fn().mockRejectedValue(new Error("DB error")),
          }),
        }),
      });

      await getItemHistory(req as Request, res as Response);
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        message: "Erreur interne du serveur",
      });
    });
  });
});
