import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { api, clearToken, getToken, setToken, UnauthorizedError } from "@/lib/api";

describe("token helpers", () => {
  beforeEach(() => localStorage.clear());

  it("returns null when no token is stored", () => {
    expect(getToken()).toBeNull();
  });

  it("stores, reads, and clears the token", () => {
    setToken("abc123");
    expect(getToken()).toBe("abc123");
    clearToken();
    expect(getToken()).toBeNull();
  });
});

describe("api.login", () => {
  afterEach(() => vi.restoreAllMocks());

  it("returns the access token on success", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ access_token: "tok-xyz" }),
      }),
    );
    await expect(api.login("user", "pass")).resolves.toBe("tok-xyz");
  });

  it("throws on invalid credentials", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: false }));
    await expect(api.login("user", "bad")).rejects.toThrow(/invalid/i);
  });
});

describe("authed requests", () => {
  afterEach(() => vi.restoreAllMocks());

  it("throws UnauthorizedError on HTTP 401", async () => {
    setToken("expired");
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ status: 401, ok: false }));
    await expect(api.me()).rejects.toBeInstanceOf(UnauthorizedError);
  });

  it("attaches the bearer token to requests", async () => {
    setToken("my-token");
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ username: "me", is_admin: false }),
    });
    vi.stubGlobal("fetch", fetchMock);

    const profile = await api.me();
    expect(profile).toEqual({ username: "me", is_admin: false });

    const [, options] = fetchMock.mock.calls[0];
    expect(options.headers.Authorization).toBe("Bearer my-token");
  });
});
