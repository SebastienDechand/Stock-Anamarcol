import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { useContext } from "react";
import { AuthProvider, UidContext } from "../AppContext";
import { Role } from "../../constants";
import axios from "axios";

vi.mock("axios");
const mockedAxios = vi.mocked(axios, true);

// Helper component to read all context values
function ContextReader() {
  const ctx = useContext(UidContext);
  return (
    <div>
      <span data-testid="uid">{ctx.uid ?? "null"}</span>
      <span data-testid="role">{ctx.roles[0] ?? "null"}</span>
      <span data-testid="isAdmin">{String(ctx.isAdmin)}</span>
      <span data-testid="isSuperadmin">{String(ctx.isSuperadmin)}</span>
      <span data-testid="isHotline">{String(ctx.isHotline)}</span>
      <span data-testid="isMonteur">{String(ctx.isMonteur)}</span>
      <span data-testid="isAuthLoading">{String(ctx.isAuthLoading)}</span>
    </div>
  );
}

function renderWithProvider() {
  return render(
    <AuthProvider>
      <ContextReader />
    </AuthProvider>,
  );
}

describe("AppContext / AuthProvider", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ─── Admin role ──────────────────────────────────────────
  it("should set isAdmin=true for admin roles array", async () => {
    mockedAxios.get.mockResolvedValue({
      data: { _id: "user1", roles: [Role.ADMIN, Role.USER] },
    });

    renderWithProvider();

    await waitFor(() => {
      expect(screen.getByTestId("isAuthLoading").textContent).toBe("false");
    });

    expect(screen.getByTestId("uid").textContent).toBe("user1");
    expect(screen.getByTestId("role").textContent).toBe(Role.ADMIN);
    expect(screen.getByTestId("isAdmin").textContent).toBe("true");
    expect(screen.getByTestId("isSuperadmin").textContent).toBe("false");
    expect(screen.getByTestId("isHotline").textContent).toBe("true"); // admin also passes hotline
    expect(screen.getByTestId("isMonteur").textContent).toBe("true"); // admin also passes monteur
  });

  // ─── Superadmin role ─────────────────────────────────────
  it("should set isAdmin=true and isSuperadmin=true for superadmin roles array", async () => {
    mockedAxios.get.mockResolvedValue({
      data: { _id: "user2", roles: [Role.SUPERADMIN, Role.ADMIN, Role.USER] },
    });

    renderWithProvider();

    await waitFor(() => {
      expect(screen.getByTestId("isAuthLoading").textContent).toBe("false");
    });

    expect(screen.getByTestId("isAdmin").textContent).toBe("true");
    expect(screen.getByTestId("isSuperadmin").textContent).toBe("true");
    expect(screen.getByTestId("isHotline").textContent).toBe("true");
    expect(screen.getByTestId("isMonteur").textContent).toBe("true");
  });

  // ─── Hotline role ────────────────────────────────────────
  it("should set isHotline=true and isMonteur=false for hotline roles array", async () => {
    mockedAxios.get.mockResolvedValue({
      data: { _id: "user3", roles: [Role.USER, Role.HOTLINE] },
    });

    renderWithProvider();

    await waitFor(() => {
      expect(screen.getByTestId("isAuthLoading").textContent).toBe("false");
    });

    expect(screen.getByTestId("isAdmin").textContent).toBe("false");
    expect(screen.getByTestId("isSuperadmin").textContent).toBe("false");
    expect(screen.getByTestId("isHotline").textContent).toBe("true");
    expect(screen.getByTestId("isMonteur").textContent).toBe("false");
  });

  // ─── Monteur role ────────────────────────────────────────
  it("should set isMonteur=true and isHotline=false for monteur roles array", async () => {
    mockedAxios.get.mockResolvedValue({
      data: { _id: "user6", roles: [Role.USER, Role.MONTEUR] },
    });

    renderWithProvider();

    await waitFor(() => {
      expect(screen.getByTestId("isAuthLoading").textContent).toBe("false");
    });

    expect(screen.getByTestId("isAdmin").textContent).toBe("false");
    expect(screen.getByTestId("isSuperadmin").textContent).toBe("false");
    expect(screen.getByTestId("isHotline").textContent).toBe("false");
    expect(screen.getByTestId("isMonteur").textContent).toBe("true");
  });

  // ─── Plain user role ─────────────────────────────────────
  it("should set all flags false for plain user roles array", async () => {
    mockedAxios.get.mockResolvedValue({
      data: { _id: "user4", roles: [Role.USER] },
    });

    renderWithProvider();

    await waitFor(() => {
      expect(screen.getByTestId("isAuthLoading").textContent).toBe("false");
    });

    expect(screen.getByTestId("isAdmin").textContent).toBe("false");
    expect(screen.getByTestId("isSuperadmin").textContent).toBe("false");
    expect(screen.getByTestId("isHotline").textContent).toBe("false");
    expect(screen.getByTestId("isMonteur").textContent).toBe("false");
  });

  // ─── Fallback: no roles in response ──────────────────────
  it("should default to [Role.USER] when API returns empty roles", async () => {
    mockedAxios.get.mockResolvedValue({
      data: { _id: "user5", roles: [] },
    });

    renderWithProvider();

    await waitFor(() => {
      expect(screen.getByTestId("isAuthLoading").textContent).toBe("false");
    });

    expect(screen.getByTestId("role").textContent).toBe(Role.USER);
    expect(screen.getByTestId("isAdmin").textContent).toBe("false");
  });

  it("should default to [Role.USER] when API returns no roles field", async () => {
    mockedAxios.get.mockResolvedValue({
      data: { _id: "user5b" },
    });

    renderWithProvider();

    await waitFor(() => {
      expect(screen.getByTestId("isAuthLoading").textContent).toBe("false");
    });

    expect(screen.getByTestId("role").textContent).toBe(Role.USER);
  });

  // ─── API error ───────────────────────────────────────────
  it("should set uid=null and empty roles on API error", async () => {
    mockedAxios.get.mockRejectedValue(new Error("Network Error"));

    renderWithProvider();

    await waitFor(() => {
      expect(screen.getByTestId("isAuthLoading").textContent).toBe("false");
    });

    expect(screen.getByTestId("uid").textContent).toBe("null");
    expect(screen.getByTestId("role").textContent).toBe("null");
    expect(screen.getByTestId("isAdmin").textContent).toBe("false");
    expect(screen.getByTestId("isMonteur").textContent).toBe("false");
  });

  // ─── Loading state ───────────────────────────────────────
  it("should expose isAuthLoading=true before API resolves", () => {
    mockedAxios.get.mockReturnValue(new Promise(() => {}));

    renderWithProvider();

    expect(screen.getByTestId("isAuthLoading").textContent).toBe("true");
    expect(screen.getByTestId("uid").textContent).toBe("null");
    expect(screen.getByTestId("role").textContent).toBe("null");
  });
});
