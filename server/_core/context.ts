import type { CreateExpressContextOptions } from "@trpc/server/adapters/express";
import { sdk } from "./sdk";
import { getSessionByToken, getUserById } from "../db";

// Compatible user type for both MySQL (legacy) and MongoDB
export type User = {
  id: string;
  openId?: string;
  username: string | null;
  name: string | null;
  email: string | null;
  bio?: string | null;
  avatarUrl?: string | null;
  role: "user" | "admin";
  loginMethod: string | null;
  passwordHash?: string | null;
  createdAt: Date;
  updatedAt: Date;
  lastSignedIn: Date;
};

export type TrpcContext = {
  req: CreateExpressContextOptions["req"];
  res: CreateExpressContextOptions["res"];
  user: User | null;
};

export async function createContext(
  opts: CreateExpressContextOptions
): Promise<TrpcContext> {
  let user: User | null = null;

  try {
    user = await sdk.authenticateRequest(opts.req) as User;
  } catch {
    user = null;
  }

  // Fallback for local username/password auth flow using sn_session cookie.
  if (!user) {
    const token = opts.req.cookies?.sn_session;

    if (token) {
      try {
        const session = await getSessionByToken(token);
        if (session && session.expiresAt > new Date()) {
          const localUser = await getUserById(session.userId);
          if (localUser) {
            user = {
              id: localUser.id,
              openId: localUser.openId ?? undefined,
              username: localUser.username ?? null,
              name: localUser.name ?? null,
              email: localUser.email ?? null,
              bio: localUser.bio ?? null,
              avatarUrl: localUser.avatarUrl ?? null,
              role: localUser.role,
              loginMethod: localUser.loginMethod ?? null,
              createdAt: localUser.createdAt,
              updatedAt: localUser.updatedAt,
              lastSignedIn: localUser.lastSignedIn,
            };
          }
        }
      } catch {
        user = null;
      }
    }
  }

  return {
    req: opts.req,
    res: opts.res,
    user,
  };
}
