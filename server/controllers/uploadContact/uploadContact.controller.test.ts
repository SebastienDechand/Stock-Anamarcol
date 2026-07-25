import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { Request, Response } from "express";

const mockContactModel = vi.hoisted(() => ({
  findByIdAndUpdate: vi.fn(),
}));

vi.mock("../../models/contact.model", () => ({
  __esModule: true,
  default: mockContactModel,
}));

vi.mock("../../utils/upload/upload.utils", () => ({
  validateUploadedFile: vi.fn(),
  uploadToImgBB: vi.fn(),
}));

vi.mock("../../utils/audit/audit.utils", () => ({
  logEvent: vi.fn().mockResolvedValue(undefined),
}));

import { uploadContact } from "./uploadContact.controller";
import { validateUploadedFile, uploadToImgBB } from "../../utils/upload/upload.utils";
import { logEvent } from "../../utils/audit/audit.utils";

describe("UploadContact Controller", () => {
  let req: Partial<Request>;
  let res: Partial<Response>;

  beforeEach(() => {
    req = {
      body: { name: "contact1", contactId: "c1" },
      file: { buffer: Buffer.from("fake") } as Express.Multer.File,
    };
    res = {
      locals: { user: { username: "admin" } },
      status: vi.fn().mockReturnThis() as unknown as Response["status"],
      json: vi.fn() as unknown as Response["json"],
    };
    vi.clearAllMocks();
    vi.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => vi.restoreAllMocks());

  it("should stop early when the file is invalid", async () => {
    (validateUploadedFile as ReturnType<typeof vi.fn>).mockReturnValue(false);

    await uploadContact(req as Request, res as Response);

    expect(uploadToImgBB).not.toHaveBeenCalled();
  });

  it("should upload the picture, update the contact, log the event and return it", async () => {
    (validateUploadedFile as ReturnType<typeof vi.fn>).mockReturnValue(true);
    (uploadToImgBB as ReturnType<typeof vi.fn>).mockResolvedValue("https://img/contact.jpg");
    const updatedContact = { _id: "c1", picture: "https://img/contact.jpg" };
    mockContactModel.findByIdAndUpdate.mockResolvedValue(updatedContact);

    await uploadContact(req as Request, res as Response);

    expect(uploadToImgBB).toHaveBeenCalledWith(req.file!.buffer, "contact1.jpg");
    expect(mockContactModel.findByIdAndUpdate).toHaveBeenCalledWith(
      "c1",
      { $set: { picture: "https://img/contact.jpg" } },
      { new: true, upsert: true, setDefaultsOnInsert: true },
    );
    expect(logEvent).toHaveBeenCalledWith(
      "upload",
      "contact",
      "c1",
      "admin",
      { pictureUrl: "https://img/contact.jpg" },
    );
    expect(res.json).toHaveBeenCalledWith(updatedContact);
  });

  it("should still respond even if the audit log fails", async () => {
    (validateUploadedFile as ReturnType<typeof vi.fn>).mockReturnValue(true);
    (uploadToImgBB as ReturnType<typeof vi.fn>).mockResolvedValue("https://img/contact.jpg");
    mockContactModel.findByIdAndUpdate.mockResolvedValue({ _id: "c1" });
    (logEvent as ReturnType<typeof vi.fn>).mockRejectedValue(new Error("audit down"));

    await uploadContact(req as Request, res as Response);

    expect(res.json).toHaveBeenCalledWith({ _id: "c1" });
  });

  it("should return 500 on unexpected error", async () => {
    (validateUploadedFile as ReturnType<typeof vi.fn>).mockReturnValue(true);
    (uploadToImgBB as ReturnType<typeof vi.fn>).mockRejectedValue(new Error("ImgBB down"));

    await uploadContact(req as Request, res as Response);

    expect(res.status).toHaveBeenCalledWith(500);
  });
});
