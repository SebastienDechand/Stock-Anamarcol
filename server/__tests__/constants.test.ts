import { Role, ROLES, FOURNISSEURS, ETATS } from "../constants";

describe("Constants", () => {
  // ─── Role enum ───────────────────────────────────────
  describe("Role enum", () => {
    it("should have exactly 4 members", () => {
      expect(ROLES).toHaveLength(4);
    });

    it("should contain the expected string values", () => {
      expect(Role.SUPERADMIN).toBe("superadmin");
      expect(Role.ADMIN).toBe("admin");
      expect(Role.USER).toBe("user");
      expect(Role.HOTLINE).toBe("hotline");
    });

    it("ROLES should equal Object.values(Role)", () => {
      expect(ROLES).toEqual(Object.values(Role));
    });

    it("ROLES should include every Role member", () => {
      expect(ROLES).toContain(Role.SUPERADMIN);
      expect(ROLES).toContain(Role.ADMIN);
      expect(ROLES).toContain(Role.USER);
      expect(ROLES).toContain(Role.HOTLINE);
    });

    it("should reject unknown values with ROLES.includes", () => {
      expect(ROLES.includes("hacker" as Role)).toBe(false);
      expect(ROLES.includes("" as Role)).toBe(false);
    });
  });

  // ─── FOURNISSEURS ────────────────────────────────────
  describe("FOURNISSEURS", () => {
    it("should be a non-empty readonly array", () => {
      expect(FOURNISSEURS.length).toBeGreaterThan(0);
    });

    it("should include known suppliers", () => {
      expect(FOURNISSEURS).toContain("Amazon");
      expect(FOURNISSEURS).toContain("CashGuard");
      expect(FOURNISSEURS).toContain("LDLC");
    });
  });

  // ─── ETATS ───────────────────────────────────────────
  describe("ETATS", () => {
    it("should contain Neuf and SAV", () => {
      expect(ETATS).toEqual(["Neuf", "SAV"]);
    });
  });
});
