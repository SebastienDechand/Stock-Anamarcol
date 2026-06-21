import { describe, it, expect } from "vitest";
import {
  signUpErrors,
  signInErrors,
  uploadErrors,
  createItemErrors,
} from "../errors.utils";

describe("errors.utils", () => {
  // ─── signUpErrors ───────────────────────────────────────
  describe("signUpErrors", () => {
    it("should detect a pseudo error", () => {
      const err = { message: "pseudo validation failed", code: 0 } as Error & {
        code: number;
        keyValue?: Record<string, unknown>;
      };
      const result = signUpErrors(err);
      expect(result.pseudo).toBe("Pseudo incorrect ou déjà pris");
      expect(result.email).toBe("");
      expect(result.password).toBe("");
    });

    it("should detect an email error", () => {
      const err = { message: "email validation failed", code: 0 } as Error & {
        code: number;
        keyValue?: Record<string, unknown>;
      };
      const result = signUpErrors(err);
      expect(result.email).toBe("Email incorrect");
    });

    it("should detect a password error", () => {
      const err = { message: "password too short", code: 0 } as Error & {
        code: number;
        keyValue?: Record<string, unknown>;
      };
      const result = signUpErrors(err);
      expect(result.password).toBe(
        "Le mot de passe doit faire 6 caractères minimum",
      );
    });

    it("should detect a duplicate pseudo (code 11000)", () => {
      const err = {
        message: "duplicate key",
        code: 11000,
        keyValue: { pseudo: "test" },
      } as unknown as Error & {
        code: number;
        keyValue: Record<string, unknown>;
      };
      const result = signUpErrors(err);
      expect(result.pseudo).toBe("Ce pseudo est déjà pris");
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
      expect(result.email).toBe("Cet email est déjà enregistré");
    });
  });

  // ─── signInErrors ───────────────────────────────────────
  describe("signInErrors", () => {
    it("should detect an unknown email error", () => {
      const err = new Error("Incorrect email");
      const result = signInErrors(err);
      expect(result.email).toBe("Email inconnu");
      expect(result.password).toBe("");
    });

    it("should detect a password error", () => {
      const err = new Error("Incorrect password");
      const result = signInErrors(err);
      expect(result.password).toBe("Le mot de passe ne correspond pas");
      expect(result.email).toBe("");
    });
  });

  // ─── uploadErrors ──────────────────────────────────────
  describe("uploadErrors", () => {
    it("should detect an invalid file format", () => {
      const err = new Error("Invalid file format");
      const result = uploadErrors(err, "application/pdf", "test.pdf");
      expect(result.format).toContain("Format incompatible");
      expect(result.format).toContain("application/pdf");
    });

    it("should detect a file that is too large", () => {
      const err = new Error("Max size exceeded");
      const result = uploadErrors(err, null, "big.jpg");
      expect(result.maxSize).toBe(
        "Le fichier est trop volumineux, maximum 2.5Mo",
      );
    });

    it("should handle missing detected MIME type", () => {
      const err = new Error("Invalid file");
      const result = uploadErrors(err, null, "file.xyz");
      expect(result.format).toContain("Format incompatible");
      expect(result.format).not.toContain("Detected MIME type");
    });
  });

  // ─── createItemErrors ──────────────────────────────────
  describe("createItemErrors", () => {
    it("should detect a denomination error", () => {
      const err = new Error("denomination required");
      const result = createItemErrors(err);
      expect(result.denomination).toBe("Dénomination incorrect ou déjà prise");
    });

    it("should detect a supplier error", () => {
      const err = new Error("fournisseur required");
      const result = createItemErrors(err);
      expect(result.fournisseur).toBe("Nommez un fournisseur valide");
    });

    it("should detect a state error", () => {
      const err = new Error("etat required");
      const result = createItemErrors(err);
      expect(result.etat).toBe("L'état de la pièce doit être Neuf ou SAV");
    });

    it("should detect a quantity error", () => {
      const err = new Error("quantite invalid");
      const result = createItemErrors(err);
      expect(result.quantite).toBe("La quantité attendue est un nombre");
    });

    it("should return empty fields when no matching errors", () => {
      const err = new Error("unknown error");
      const result = createItemErrors(err);
      expect(result.denomination).toBe("");
      expect(result.fournisseur).toBe("");
      expect(result.etat).toBe("");
      expect(result.quantite).toBe("");
    });
  });
});
