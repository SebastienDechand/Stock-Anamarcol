import { describe, it, expect } from "vitest";
import { Role, ROLES } from "../../constants";

describe("Role enum (client)", () => {
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

  it("should reject unknown values", () => {
    expect(ROLES.includes("hacker" as Role)).toBe(false);
    expect(ROLES.includes("" as Role)).toBe(false);
  });
});
