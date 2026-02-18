import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { useContext } from "react";
import { AuthProvider, UidContext } from "../AppContext";
import { Role } from "../../constants";
import type { AuthContextType } from "../../types";
import axios from "axios";

vi.mock("axios");
const mockedAxios = vi.mocked(axios, true);

// Helper component to read context values
function ContextReader() {
  const ctx = useContext(UidContext);
  return (
    <div>
      <span data-testid="uid">{ctx.uid ?? "null"}</span>
      <span data-testid="role">{ctx.role ?? "null"}</span>
      <span data-testid="isAdmin">{String(ctx.isAdmin)}</span>
      <span data-testid="isSuperadmin">{String(ctx.isSuperadmin)}</span>
      <span data-testid="isHotline">{String(ctx.isHotline)}</span>
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

  it("should set isAdmin=true for admin role", async () => {
    mockedAxios.get.mockResolvedValue({
      data: { _id: "user1", role: Role.ADMIN },
    });

    renderWithProvider();

    await waitFor(() => {
      expect(screen.getByTestId("isAuthLoading").textContent).toBe("false");
    });

    expect(screen.getByTestId("uid").textContent).toBe("user1");
    expect(screen.getByTestId("role").textContent).toBe(Role.ADMIN);
    expect(screen.getByTestId("isAdmin").textContent).toBe("true");
    expect(screen.getByTestId("isSuperadmin").textContent).toBe("false");
    expect(screen.getByTestId("isHotline").textContent).toBe("false");
  });

  it("should set isAdmin=true and isSuperadmin=true for superadmin role", async () => {
    mockedAxios.get.mockResolvedValue({
      data: { _id: "user2", role: Role.SUPERADMIN },
    });

    renderWithProvider();

    await waitFor(() => {
      expect(screen.getByTestId("isAuthLoading").textContent).toBe("false");
    });

    expect(screen.getByTestId("isAdmin").textContent).toBe("true");
    expect(screen.getByTestId("isSuperadmin").textContent).toBe("true");
    expect(screen.getByTestId("isHotline").textContent).toBe("false");
  });

  it("should set isHotline=true for hotline role", async () => {
    mockedAxios.get.mockResolvedValue({
      data: { _id: "user3", role: Role.HOTLINE },
    });

    renderWithProvider();

    await waitFor(() => {
      expect(screen.getByTestId("isAuthLoading").textContent).toBe("false");
    });

    expect(screen.getByTestId("isAdmin").textContent).toBe("false");
    expect(screen.getByTestId("isSuperadmin").textContent).toBe("false");
    expect(screen.getByTestId("isHotline").textContent).toBe("true");
  });

  it("should set all flags false for regular user role", async () => {
    mockedAxios.get.mockResolvedValue({
      data: { _id: "user4", role: Role.USER },
    });

    renderWithProvider();

    await waitFor(() => {
      expect(screen.getByTestId("isAuthLoading").textContent).toBe("false");
    });

    expect(screen.getByTestId("isAdmin").textContent).toBe("false");
    expect(screen.getByTestId("isSuperadmin").textContent).toBe("false");
    expect(screen.getByTestId("isHotline").textContent).toBe("false");
  });

  it("should default to Role.USER when API returns no role", async () => {
    mockedAxios.get.mockResolvedValue({
      data: { _id: "user5" },
    });

    renderWithProvider();

    await waitFor(() => {
      expect(screen.getByTestId("isAuthLoading").textContent).toBe("false");
    });

    expect(screen.getByTestId("role").textContent).toBe(Role.USER);
  });

  it("should set uid=null and role=null on API error", async () => {
    mockedAxios.get.mockRejectedValue(new Error("Network Error"));

    renderWithProvider();

    await waitFor(() => {
      expect(screen.getByTestId("isAuthLoading").textContent).toBe("false");
    });

    expect(screen.getByTestId("uid").textContent).toBe("null");
    expect(screen.getByTestId("role").textContent).toBe("null");
    expect(screen.getByTestId("isAdmin").textContent).toBe("false");
  });

  it("should provide default context values before auth resolves", () => {
    // Never-resolving promise to keep loading state
    mockedAxios.get.mockReturnValue(new Promise(() => {}));

    renderWithProvider();

    expect(screen.getByTestId("isAuthLoading").textContent).toBe("true");
    expect(screen.getByTestId("uid").textContent).toBe("null");
    expect(screen.getByTestId("role").textContent).toBe("null");
  });
});
