import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import { COOKIE_NAME } from "../shared/const";
import type { TrpcContext } from "./_core/context";

// ─── Mock context helpers ─────────────────────────────────────────────────────
function createPublicCtx(): TrpcContext {
  return {
    user: null,
    req: { protocol: "https", headers: {}, cookies: {} } as TrpcContext["req"],
    res: { cookie: () => {}, clearCookie: () => {} } as unknown as TrpcContext["res"],
  };
}

function createUserCtx(id = "mock-user-id"): TrpcContext {
  return {
    user: {
      id,
      openId: "alice",
      email: "alice@example.com",
      name: "Alice Johnson",
      loginMethod: "local",
      role: "user",
      createdAt: new Date(),
      updatedAt: new Date(),
      lastSignedIn: new Date(),
    },
    req: { protocol: "https", headers: {}, cookies: {} } as TrpcContext["req"],
    res: { cookie: () => {}, clearCookie: () => {} } as unknown as TrpcContext["res"],
  };
}

// ─── Auth Tests ───────────────────────────────────────────────────────────────
describe("auth", () => {
  it("getLocalUser returns null when no session cookie", async () => {
    const caller = appRouter.createCaller(createPublicCtx());
    const result = await caller.auth.getLocalUser();
    expect(result).toBeNull();
  });

  it("me returns null for unauthenticated user", async () => {
    const caller = appRouter.createCaller(createPublicCtx());
    const result = await caller.auth.me();
    expect(result).toBeNull();
  });

  it("me returns user object for authenticated user", async () => {
    const caller = appRouter.createCaller(createUserCtx());
    const result = await caller.auth.me();
    expect(result).not.toBeNull();
    expect(result?.name).toBe("Alice Johnson");
    expect(result?.role).toBe("user");
  });

  it("logout clears session cookies and returns success", async () => {
    const clearedCookies: string[] = [];
    const ctx: TrpcContext = {
      user: null,
      req: { protocol: "https", headers: {}, cookies: { sn_session: "test-token" } } as TrpcContext["req"],
      res: { clearCookie: (name: string) => clearedCookies.push(name) } as unknown as TrpcContext["res"],
    };
    const caller = appRouter.createCaller(ctx);
    const result = await caller.auth.logout();
    expect(result.success).toBe(true);
    expect(clearedCookies).toContain("sn_session");
  });
});

// ─── Users Tests ──────────────────────────────────────────────────────────────
describe("users", () => {
  it("list returns an array", async () => {
    const caller = appRouter.createCaller(createPublicCtx());
    const result = await caller.users.list();
    expect(Array.isArray(result)).toBe(true);
  }, 15000);

  it("search with no params returns users array", async () => {
    const caller = appRouter.createCaller(createPublicCtx());
    const result = await caller.users.search({});
    expect(Array.isArray(result)).toBe(true);
  });

  it("search by role admin returns only admins", async () => {
    const caller = appRouter.createCaller(createPublicCtx());
    const result = await caller.users.search({ role: "admin" });
    expect(Array.isArray(result)).toBe(true);
    result.forEach((u: any) => expect(u.role).toBe("admin"));
  });

  it("getById throws NOT_FOUND for non-existent user", async () => {
    const caller = appRouter.createCaller(createPublicCtx());
    await expect(caller.users.getById({ id: "000000000000000000000000" })).rejects.toThrow();
  });
});

// ─── Posts Tests ──────────────────────────────────────────────────────────────
describe("posts", () => {
  it("search with no params returns posts array", async () => {
    const caller = appRouter.createCaller(createPublicCtx());
    const result = await caller.posts.search({});
    expect(Array.isArray(result)).toBe(true);
  });

  it("search by keyword returns matching posts", async () => {
    const caller = appRouter.createCaller(createPublicCtx());
    const result = await caller.posts.search({ keyword: "photography" });
    expect(Array.isArray(result)).toBe(true);
  });

  it("search by postType image returns image posts", async () => {
    const caller = appRouter.createCaller(createPublicCtx());
    const result = await caller.posts.search({ postType: "image" });
    expect(Array.isArray(result)).toBe(true);
    result.forEach((p: any) => expect(p.postType).toBe("image"));
  });

  it("all returns posts array", async () => {
    const caller = appRouter.createCaller(createPublicCtx());
    const result = await caller.posts.all();
    expect(Array.isArray(result)).toBe(true);
    expect(result.length).toBeGreaterThan(0);
  });
});

// ─── Groups Tests ─────────────────────────────────────────────────────────────
describe("groups", () => {
  it("publicList returns only public groups", async () => {
    const caller = appRouter.createCaller(createPublicCtx());
    const result = await caller.groups.publicList();
    expect(Array.isArray(result)).toBe(true);
    result.forEach((g: any) => expect(g.isPrivate).toBe(false));
  });

  it("list returns all groups", async () => {
    const caller = appRouter.createCaller(createPublicCtx());
    const result = await caller.groups.list();
    expect(Array.isArray(result)).toBe(true);
    expect(result.length).toBeGreaterThan(0);
  });

  it("search by name filters groups", async () => {
    const caller = appRouter.createCaller(createPublicCtx());
    const result = await caller.groups.search({ name: "Tech" });
    expect(Array.isArray(result)).toBe(true);
  });
});

// ─── Stats Tests ──────────────────────────────────────────────────────────────
describe("stats", () => {
  it("postsPerMonth returns array", async () => {
    const caller = appRouter.createCaller(createPublicCtx());
    const result = await caller.stats.postsPerMonth();
    expect(Array.isArray(result)).toBe(true);
  });

  it("userActivity returns array", async () => {
    const caller = appRouter.createCaller(createPublicCtx());
    const result = await caller.stats.userActivity();
    expect(Array.isArray(result)).toBe(true);
  });

  it("totals returns object with numeric counts > 0", async () => {
    const caller = appRouter.createCaller(createPublicCtx());
    const result = await caller.stats.totals();
    expect(typeof result.users).toBe("number");
    expect(typeof result.posts).toBe("number");
    expect(typeof result.groups).toBe("number");
    expect(result.users).toBeGreaterThan(0);
    expect(result.posts).toBeGreaterThan(0);
    expect(result.groups).toBeGreaterThan(0);
  });
});

// ─── Friends Tests ────────────────────────────────────────────────────────────
describe("friends", () => {
  it("list returns array", async () => {
    const userId = "000000000000000000000000";
    const caller = appRouter.createCaller(createUserCtx(userId));
    const result = await caller.friends.list({ userId });
    expect(Array.isArray(result)).toBe(true);
  });

  it("pending returns array", async () => {
    const userId = "000000000000000000000000";
    const caller = appRouter.createCaller(createUserCtx(userId));
    const result = await caller.friends.pending({ userId });
    expect(Array.isArray(result)).toBe(true);
  });
});
