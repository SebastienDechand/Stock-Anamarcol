import { describe, it, expect } from "vitest";
import {
  signUpErrors,
  signInErrors,
  uploadErrors,
  createItemErrors,
} from "./errors.utils";

describe("errors.utils", () => {
  // #region signUpErrors
  describe("signUpErrors", () => {
    it("should detect a username error", () => {
      const err = { message: "username validation failed", code: 0 } as Error & {
        code: number;
        keyValue?: Record<string, unknown>;
      };
      const result = signUpErrors(err);
      expect(result.username).toBe("Invalid or already taken username");
      expect(result.email).toBe("");
      expect(result.password).toBe("");
    });

    it("should detect an email error", () => {
      const err = { message: "email validation failed", code: 0 } as Error & {
        code: number;
        keyValue?: Record<string, unknown>;
      };
      const result = signUpErrors(err);
      expect(result.email).toBe("Invalid email");
    });

    it("should detect a password error", () => {
      const err = { message: "password too short", code: 0 } as Error & {
        code: number;
        keyValue?: Record<string, unknown>;
      };
      const result = signUpErrors(err);
      expect(result.password).toBe(
        "Password must be at least 6 characters",
      );
    });

    it("should detect a duplicate username (code 11000)", () => {
      const err = {
        message: "duplicate key",
        code: 11000,
        keyValue: { username: "test" },
      } as unknown as Error & {
        code: number;
        keyValue: Record<string, unknown>;
      };
      const result = signUpErrors(err);
      expect(result.username).toBe("This username is already taken");
    });

    it("should detect a duplicate email (code 11000)", () => {
      const err = {
        message: "duplicate key",
        code: 11000,
        keyValue: { email: "test@test.com" },
      } as unknown as Error & {
        code: number;
        keyValue: Record<string, unknown>;
      };
      const result = signUpErrors(err);
      expect(result.email).toBe("This email is already registered");
    });
  });
  // #endregion

  // #region signInErrors
  describe("signInErrors", () => {
    it("returns the same generic message for an unknown email", () => {
      const err = new Error("Incorrect email");
      const result = signInErrors(err);
      expect(result.email).toBe("Email ou mot de passe incorrect");
      expect(result.password).toBe("Email ou mot de passe incorrect");
    });

    it("returns the same generic message for a wrong password", () => {
      const err = new Error("Incorrect password");
      const result = signInErrors(err);
      expect(result.email).toBe("Email ou mot de passe incorrect");
      expect(result.password).toBe("Email ou mot de passe incorrect");
    });
  });
  // #endregion

  // #region uploadErrors
  describe("uploadErrors", () => {
    it("should detect an invalid file format", () => {
      const err = new Error("Invalid file format");
      const result = uploadErrors(err, "application/pdf", "test.pdf");
      expect(result.format).toContain("Unsupported file format");
      expect(result.format).toContain("application/pdf");
    });

    it("should detect a file that is too large", () => {
      const err = new Error("Max size exceeded");
      const result = uploadErrors(err, null, "big.jpg");
      expect(result.maxSize).toBe(
        "File is too large, maximum 2.5MB",
      );
    });

    it("should handle missing detected MIME type", () => {
      const err = new Error("Invalid file");
      const result = uploadErrors(err, null, "file.xyz");
      expect(result.format).toContain("Unsupported file format");
      expect(result.format).not.toContain("Detected MIME type");
    });
  });
  // #endregion

  // #region createItemErrors
  describe("createItemErrors", () => {
    it("should detect a name error", () => {
      const err = new Error("name required");
      const result = createItemErrors(err);
      expect(result.name).toBe("Invalid or already taken name");
    });

    it("should detect a supplier error", () => {
      const err = new Error("supplier required");
      const result = createItemErrors(err);
      expect(result.supplier).toBe("Enter a valid supplier");
    });

    it("should detect a status error", () => {
      const err = new Error("status required");
      const result = createItemErrors(err);
      expect(result.status).toBe("Status must be NEW or RMA");
    });

    it("should detect a quantity error", () => {
      const err = new Error("quantity invalid");
      const result = createItemErrors(err);
      expect(result.quantity).toBe("Quantity must be a number");
    });

    it("should return empty fields when no matching errors", () => {
      const err = new Error("unknown error");
      const result = createItemErrors(err);
      expect(result.name).toBe("");
      expect(result.supplier).toBe("");
      expect(result.status).toBe("");
      expect(result.quantity).toBe("");
    });
  });
  // #endregion
});
