import { describe, it, expect } from "vitest";
import { Role, ROLES, SUPPLIERS, STATUSES } from "../constants";

describe("Constants", () => {
  // #region Role enum
  describe("Role enum", () => {
    it("should have exactly 5 members", () => {
      expect(ROLES).toHaveLength(5);
    });

    it("should contain the expected string values", () => {
      expect(Role.SUPERADMIN).toBe("superadmin");
      expect(Role.ADMIN).toBe("admin");
      expect(Role.USER).toBe("user");
      expect(Role.HOTLINE).toBe("hotline");
      expect(Role.MONTEUR).toBe("monteur");
    });

    it("ROLES should equal Object.values(Role)", () => {
      expect(ROLES).toEqual(Object.values(Role));
    });

    it("ROLES should include every Role member", () => {
      expect(ROLES).toContain(Role.SUPERADMIN);
      expect(ROLES).toContain(Role.ADMIN);
      expect(ROLES).toContain(Role.USER);
      expect(ROLES).toContain(Role.HOTLINE);
      expect(ROLES).toContain(Role.MONTEUR);
    });

    it("should reject unknown values with ROLES.includes", () => {
      expect(ROLES.includes("hacker" as Role)).toBe(false);
      expect(ROLES.includes("" as Role)).toBe(false);
    });
  });
  // #endregion

  // #region SUPPLIERS
  describe("SUPPLIERS", () => {
    it("should be a non-empty readonly array", () => {
      expect(SUPPLIERS.length).toBeGreaterThan(0);
    });

    it("should include known suppliers", () => {
      expect(SUPPLIERS).toContain("Amazon");
      expect(SUPPLIERS).toContain("CashGuard");
      expect(SUPPLIERS).toContain("LDLC");
    });
  });
  // #endregion

  // #region STATUSES
  describe("STATUSES", () => {
    it("should contain NEW and RMA", () => {
      expect(STATUSES).toEqual(["NEW", "RMA"]);
    });
  });
  // #endregion
});
