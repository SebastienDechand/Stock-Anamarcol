import { describe, it, expect } from "vitest";
import { Role, ROLES } from "../../constants";

describe("Role enum (client)", () => {
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

  it("should reject unknown values", () => {
    expect(ROLES.includes("hacker" as Role)).toBe(false);
  });
});
