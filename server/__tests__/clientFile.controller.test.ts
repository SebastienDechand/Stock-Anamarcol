import { describe, it, expect, vi, beforeEach, afterEach, Mock } from "vitest";
import { Request, Response } from "express";

// Mock fs so unlink does not touch the real filesystem
vi.mock("fs", async () => ({
  ...(await vi.importActual<typeof import("fs")>("fs")),
  mkdirSync: vi.fn(),
  unlink: vi.fn((_p: string, cb: (err: null) => void) => cb(null)),
}));

const mockClientFileModel = vi.hoisted(() => ({
  find: vi.fn(),
  findById: vi.fn(),
  create: vi.fn(),
  findByIdAndDelete: vi.fn(),
}));

vi.mock("../models/clientFile.model", () => ({
  __esModule: true,
  default: mockClientFileModel,
}));

vi.mock("../utils/audit.utils", () => ({
  logEvent: vi.fn().mockResolvedValue(undefined),
}));

vi.mock("../utils/validate.utils", () => ({
  validateObjectId: vi.fn((id: string, res: Response) => {
    const valid = /^[a-f\d]{24}$/i.test(id);
    if (!valid) {
      (res.status as Mock)(400).json({ error: "Invalid ObjectId" });
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
  uploadDocument,
  deleteDocument,
} from "../controllers/clientFile.controller";

const VALID_ID = "507f1f77bcf86cd799439011";
const VALID_DOC_ID = "507f1f77bcf86cd799439022";

const mockDoc = {
  _id: { toString: () => VALID_DOC_ID },
  name: "devis.pdf",
  filename: "1234-devis.pdf",
  type: "devis",
};

const mockFile = {
  _id: VALID_ID,
  lastName: "DUPONT",
  firstName: "Jean",
  company: "TestCorp",
  equipment: { registerCount: 2, cashguardCount: 1 },
  notes: "",
  documents: [mockDoc],
  save: vi.fn(),
};

describe("ClientFile Controller", () => {
  let req: Partial<Request>;
  let res: Partial<Response>;

  beforeEach(() => {
    req = { params: {}, body: {}, query: {} };
    res = {
      locals: { user: { username: "admin" } },
      status: vi.fn().mockReturnThis() as unknown as Response["status"],
      json: vi.fn() as unknown as Response["json"],
    };
    vi.clearAllMocks();
    vi.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  // ─── getClientFiles ────────────────────────────────────
  describe("getClientFiles", () => {
    it("should return all client files with 200", async () => {
      const files = [mockFile];
      mockClientFileModel.find.mockReturnValue({
        sort: vi.fn().mockReturnValue({
          populate: vi.fn().mockReturnValue({
            lean: vi.fn().mockResolvedValue(files),
          }),
        }),
      });

      await getClientFiles(req as Request, res as Response);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(files);
    });

    it("should return 500 on error", async () => {
      mockClientFileModel.find.mockReturnValue({
        sort: vi.fn().mockReturnValue({
          populate: vi.fn().mockReturnValue({
            lean: vi.fn().mockRejectedValue(new Error("DB error")),
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
        populate: vi.fn().mockReturnValue({
          lean: vi.fn().mockResolvedValue(null),
        }),
      });

      await getClientFile(req as Request, res as Response);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        message: "Client file not found",
        code: "CLIENT_FILE_NOT_FOUND",
      });
    });

    it("should return the file with 200", async () => {
      req.params = { id: VALID_ID };
      mockClientFileModel.findById.mockReturnValue({
        populate: vi.fn().mockReturnValue({
          lean: vi.fn().mockResolvedValue(mockFile),
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
      req.body = { lastName: "DUPONT", firstName: "Jean" };
      mockClientFileModel.create.mockResolvedValue({
        ...mockFile,
        _id: { toString: () => VALID_ID },
      });

      await createClientFile(req as Request, res as Response);

      expect(mockClientFileModel.create).toHaveBeenCalledWith(
        expect.objectContaining({ lastName: "DUPONT", createdBy: "admin" }),
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
      req.body = { lastName: "MARTIN", city: "Paris" };

      const file = {
        ...mockFile,
        save: vi.fn().mockResolvedValue({ ...mockFile, lastName: "MARTIN" }),
      };
      mockClientFileModel.findById.mockResolvedValue(file);

      await updateClientFile(req as Request, res as Response);

      expect(file.save).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(200);
    });

    it("should update new planning and equipment fields", async () => {
      req.params = { id: VALID_ID };
      req.body = {
        equipment: { registerCount: 5, cashguardCount: 2 },
        notes: "Attention fragile",
        preInstallationVisit: true,
        carpentryPlanCutout: false,
      };

      const file = { ...mockFile, save: vi.fn().mockResolvedValue(mockFile) };
      mockClientFileModel.findById.mockResolvedValue(file);

      await updateClientFile(req as Request, res as Response);

      expect((file as Record<string, unknown>).equipment).toEqual({
        registerCount: 5,
        cashguardCount: 2,
      });
      expect((file as Record<string, unknown>).notes).toBe(
        "Attention fragile",
      );
      expect(file.save).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(200);
    });

    it("should return 400 on save error", async () => {
      req.params = { id: VALID_ID };
      req.body = { lastName: "ERR" };

      const file = {
        ...mockFile,
        save: vi.fn().mockRejectedValue(new Error("save failed")),
      };
      mockClientFileModel.findById.mockResolvedValue(file);

      await updateClientFile(req as Request, res as Response);

      expect(res.status).toHaveBeenCalledWith(400);
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
      expect(res.json).toHaveBeenCalledWith({
        message: "Client file deleted",
        code: "CLIENT_FILE_DELETED",
      });
    });
  });

  // ─── uploadDocument ────────────────────────────────────
  describe("uploadDocument", () => {
    it("should return 400 when ID is invalid", async () => {
      req.params = { id: "invalid" };
      await uploadDocument(req as Request, res as Response);
      expect(res.status).toHaveBeenCalledWith(400);
    });

    it("should return 400 when no file is provided", async () => {
      req.params = { id: VALID_ID };
      req.file = undefined;
      await uploadDocument(req as Request, res as Response);
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        message: "No file provided",
        code: "NO_FILE_PROVIDED",
      });
    });

    it("should return 404 when client file not found", async () => {
      req.params = { id: VALID_ID };
      req.file = {
        originalname: "test.pdf",
        filename: "123-test.pdf",
      } as Express.Multer.File;
      mockClientFileModel.findById.mockResolvedValue(null);

      await uploadDocument(req as Request, res as Response);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        message: "Client file not found",
        code: "CLIENT_FILE_NOT_FOUND",
      });
    });

    it("should add document and return 201", async () => {
      req.params = { id: VALID_ID };
      req.body = { type: "devis" };
      req.file = {
        originalname: "devis.pdf",
        filename: "999-devis.pdf",
      } as Express.Multer.File;

      const file = {
        ...mockFile,
        documents: { push: vi.fn() },
        save: vi.fn().mockResolvedValue(mockFile),
      };
      mockClientFileModel.findById.mockResolvedValue(file);

      await uploadDocument(req as Request, res as Response);

      expect(file.documents.push).toHaveBeenCalledWith(
        expect.objectContaining({ name: "devis.pdf", type: "devis" }),
      );
      expect(file.save).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(201);
    });

    it("should return 500 on unexpected error", async () => {
      req.params = { id: VALID_ID };
      req.file = {
        originalname: "x.pdf",
        filename: "x.pdf",
      } as Express.Multer.File;
      mockClientFileModel.findById.mockRejectedValue(new Error("DB crash"));

      await uploadDocument(req as Request, res as Response);

      expect(res.status).toHaveBeenCalledWith(500);
    });
  });

  // ─── deleteDocument ────────────────────────────────────
  describe("deleteDocument", () => {
    it("should return 400 when client file ID is invalid", async () => {
      req.params = { id: "invalid", docId: VALID_DOC_ID };
      await deleteDocument(req as Request, res as Response);
      expect(res.status).toHaveBeenCalledWith(400);
    });

    it("should return 400 when doc ID is invalid", async () => {
      req.params = { id: VALID_ID, docId: "notanid" };
      await deleteDocument(req as Request, res as Response);
      expect(res.status).toHaveBeenCalledWith(400);
    });

    it("should return 404 when client file not found", async () => {
      req.params = { id: VALID_ID, docId: VALID_DOC_ID };
      mockClientFileModel.findById.mockResolvedValue(null);

      await deleteDocument(req as Request, res as Response);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        message: "Client file not found",
        code: "CLIENT_FILE_NOT_FOUND",
      });
    });

    it("should return 404 when document not found in the file", async () => {
      req.params = { id: VALID_ID, docId: VALID_DOC_ID };
      const file = { ...mockFile, documents: [] }; // no documents
      mockClientFileModel.findById.mockResolvedValue(file);

      await deleteDocument(req as Request, res as Response);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        message: "Document not found",
        code: "DOCUMENT_NOT_FOUND",
      });
    });

    it("should delete document from file and return 200", async () => {
      req.params = { id: VALID_ID, docId: VALID_DOC_ID };

      const file = {
        ...mockFile,
        documents: [mockDoc],
        save: vi.fn().mockResolvedValue(mockFile),
      };
      mockClientFileModel.findById.mockResolvedValue(file);

      await deleteDocument(req as Request, res as Response);

      // document should be filtered out
      expect(file.documents).not.toContain(mockDoc);
      expect(file.save).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(200);
    });

    it("should return 500 on unexpected error", async () => {
      req.params = { id: VALID_ID, docId: VALID_DOC_ID };
      mockClientFileModel.findById.mockRejectedValue(new Error("crash"));

      await deleteDocument(req as Request, res as Response);

      expect(res.status).toHaveBeenCalledWith(500);
    });
  });
});
