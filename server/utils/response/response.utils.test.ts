import { describe, it, expect, vi, beforeEach } from "vitest";
import { Response } from "express";
import { handleError } from "./response.utils";
import { ErrorCode } from "../../constants/errorCodes";

describe("handleError", () => {
  let res: Partial<Response>;

  beforeEach(() => {
    res = {
      status: vi.fn().mockReturnThis() as unknown as Response["status"],
      json: vi.fn() as unknown as Response["json"],
    };
    vi.spyOn(console, "error").mockImplementation(() => {});
  });

  it("should log the error and default to a 500 internal server error", () => {
    const err = new Error("boom");
    handleError(res as Response, err, "Error doing thing:");

    expect(console.error).toHaveBeenCalledWith("Error doing thing:", err);
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({
      message: "Internal server error",
      code: ErrorCode.INTERNAL_ERROR,
    });
  });

  it("should allow a custom response message and error code", () => {
    const err = new Error("boom");
    handleError(
      res as Response,
      err,
      "Error creating vehicle:",
      "Error creating vehicle",
      ErrorCode.VEHICLE_CREATE_ERROR,
    );

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({
      message: "Error creating vehicle",
      code: ErrorCode.VEHICLE_CREATE_ERROR,
    });
  });
});
