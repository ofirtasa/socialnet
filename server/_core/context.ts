import type { CreateExpressContextOptions } from "@trpc/server/adapters/express";
import { sdk } from "./sdk";

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

  return {
    req: opts.req,
    res: opts.res,
    user,
  };
}
