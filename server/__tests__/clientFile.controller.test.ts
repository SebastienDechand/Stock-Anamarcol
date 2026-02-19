import { Request, Response } from "express";

const mockClientFileModel = {
  find: jest.fn(),
  findById: jest.fn(),
  create: jest.fn(),
  findByIdAndDelete: jest.fn(),
};

jest.mock("../models/clientFile.model", () => ({
  __esModule: true,
  default: mockClientFileModel,
}));

jest.mock("../utils/audit.utils", () => ({
  logEvent: jest.fn().mockResolvedValue(undefined),
}));

jest.mock("../utils/validate.utils", () => ({
  validateObjectId: jest.fn((id: string, res: Response) => {
    const valid = /^[a-f\d]{24}$/i.test(id);
    if (!valid) {
      (res.status as jest.Mock)(400).json({ error: "Invalid ObjectId" });
    }
    return valid;
  }),
}));

import {
  getClientFiles,
  getClientFile,
  createClientFile,
  updateClientFile,
  deleteClientFile,
} from "../controllers/clientFile.controller";

const VALID_ID = "507f1f77bcf86cd799439011";

const mockFile = {
  _id: VALID_ID,
  nom: "DUPONT",
  prenom: "Jean",
  societe: "TestCorp",
  equipement: { nbCaisses: 2, nbCashguard: 1 },
  save: jest.fn(),
};

describe("ClientFile Controller", () => {
  let req: Partial<Request>;
  let res: Partial<Response>;

  beforeEach(() => {
    req = { params: {}, body: {}, query: {} };
    res = {
      locals: { user: { pseudo: "admin" } },
      status: jest.fn().mockReturnThis() as unknown as Response["status"],
      json: jest.fn() as unknown as Response["json"],
    };
    jest.clearAllMocks();
    jest.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  // ─── getClientFiles ────────────────────────────────────
  describe("getClientFiles", () => {
    it("should return all client files with 200", async () => {
      const files = [mockFile];
      mockClientFileModel.find.mockReturnValue({
        sort: jest.fn().mockReturnValue({
          populate: jest.fn().mockReturnValue({
            lean: jest.fn().mockResolvedValue(files),
          }),
        }),
      });

      await getClientFiles(req as Request, res as Response);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(files);
    });

    it("should return 500 on error", async () => {
      mockClientFileModel.find.mockReturnValue({
        sort: jest.fn().mockReturnValue({
          populate: jest.fn().mockReturnValue({
            lean: jest.fn().mockRejectedValue(new Error("DB error")),
          }),
        }),
      });

      await getClientFiles(req as Request, res as Response);

      expect(res.status).toHaveBeenCalledWith(500);
    });
  });

  // ─── getClientFile ─────────────────────────────────────
  describe("getClientFile", () => {
    it("should return 400 when ID is invalid", async () => {
      req.params = { id: "invalid" };
      await getClientFile(req as Request, res as Response);
      expect(res.status).toHaveBeenCalledWith(400);
    });

    it("should return 404 when file not found", async () => {
      req.params = { id: VALID_ID };
      mockClientFileModel.findById.mockReturnValue({
        populate: jest.fn().mockReturnValue({
          lean: jest.fn().mockResolvedValue(null),
        }),
      });

      await getClientFile(req as Request, res as Response);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        message: "Fiche client introuvable",
      });
    });

    it("should return the file with 200", async () => {
      req.params = { id: VALID_ID };
      mockClientFileModel.findById.mockReturnValue({
        populate: jest.fn().mockReturnValue({
          lean: jest.fn().mockResolvedValue(mockFile),
        }),
      });

      await getClientFile(req as Request, res as Response);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(mockFile);
    });
  });

  // ─── createClientFile ──────────────────────────────────
  describe("createClientFile", () => {
    it("should create a client file and return 201", async () => {
      req.body = { nom: "DUPONT", prenom: "Jean" };
      mockClientFileModel.create.mockResolvedValue({
        ...mockFile,
        _id: { toString: () => VALID_ID },
      });

      await createClientFile(req as Request, res as Response);

      expect(mockClientFileModel.create).toHaveBeenCalledWith(
        expect.objectContaining({ nom: "DUPONT", createdBy: "admin" }),
      );
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({
        clientFile: expect.anything(),
      });
    });

    it("should return 400 on validation error", async () => {
      req.body = {};
      mockClientFileModel.create.mockRejectedValue(
        new Error("validation failed"),
      );

      await createClientFile(req as Request, res as Response);

      expect(res.status).toHaveBeenCalledWith(400);
    });
  });

  // ─── updateClientFile ──────────────────────────────────
  describe("updateClientFile", () => {
    it("should return 400 when ID is invalid", async () => {
      req.params = { id: "invalid" };
      await updateClientFile(req as Request, res as Response);
      expect(res.status).toHaveBeenCalledWith(400);
    });

    it("should return 404 when file not found", async () => {
      req.params = { id: VALID_ID };
      mockClientFileModel.findById.mockResolvedValue(null);

      await updateClientFile(req as Request, res as Response);

      expect(res.status).toHaveBeenCalledWith(404);
    });

    it("should update fields and return 200", async () => {
      req.params = { id: VALID_ID };
      req.body = { nom: "MARTIN", ville: "Paris" };

      const file = {
        ...mockFile,
        save: jest.fn().mockResolvedValue({ ...mockFile, nom: "MARTIN" }),
      };
      mockClientFileModel.findById.mockResolvedValue(file);

      await updateClientFile(req as Request, res as Response);

      expect(file.save).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(200);
    });
  });

  // ─── deleteClientFile ──────────────────────────────────
  describe("deleteClientFile", () => {
    it("should return 400 when ID is invalid", async () => {
      req.params = { id: "invalid" };
      await deleteClientFile(req as Request, res as Response);
      expect(res.status).toHaveBeenCalledWith(400);
    });

    it("should return 404 when file not found", async () => {
      req.params = { id: VALID_ID };
      mockClientFileModel.findByIdAndDelete.mockResolvedValue(null);

      await deleteClientFile(req as Request, res as Response);

      expect(res.status).toHaveBeenCalledWith(404);
    });

    it("should delete file and return 200", async () => {
      req.params = { id: VALID_ID };
      mockClientFileModel.findByIdAndDelete.mockResolvedValue(mockFile);

      await deleteClientFile(req as Request, res as Response);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({ message: "Fiche supprimée" });
    });
  });
});
