import { describe, it, expect, vi, beforeEach } from "vitest";
import { Response } from "express";
import { validateObjectId } from "./validate.utils";

describe("validateObjectId", () => {
  let res: Partial<Response>;

  beforeEach(() => {
    res = {
      status: vi.fn().mockReturnThis() as unknown as Response["status"],
      json: vi.fn() as unknown as Response["json"],
    };
  });

  it("should return true for a valid 24-char ObjectId", () => {
    const result = validateObjectId(
      "507f1f77bcf86cd799439011",
      res as Response,
    );
    expect(result).toBe(true);
    expect(res.status).not.toHaveBeenCalled();
  });

  it("should return false and send 400 for an invalid ID", () => {
    const result = validateObjectId("invalid", res as Response);
    expect(result).toBe(false);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      message: "Invalid ID",
      code: "INVALID_ID",
    });
  });

  it("should return false for an empty string", () => {
    const result = validateObjectId("", res as Response);
    expect(result).toBe(false);
    expect(res.status).toHaveBeenCalledWith(400);
  });

  it("should return true for a numeric 12-byte hex string", () => {
    // 24 hex chars is valid for ObjectId
    const result = validateObjectId(
      "aaaaaaaaaaaaaaaaaaaaaaaa",
      res as Response,
    );
    expect(result).toBe(true);
  });
});
