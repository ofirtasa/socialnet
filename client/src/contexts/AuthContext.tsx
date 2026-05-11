import React, { createContext, useContext } from "react";
import { trpc } from "@/lib/trpc";

export type LocalUser = {
  id: string;
  username: string | null;
  name: string | null;
  role: "user" | "admin";
  avatarUrl: string | null;
  bio: string | null;
  email: string | null;
  createdAt: Date;
};

type AuthContextType = {
  user: LocalUser | null;
  loading: boolean;
  refetch: () => void;
};

const AuthContext = createContext<AuthContextType>({ user: null, loading: true, refetch: () => {} });

export function LocalAuthProvider({ children }: { children: React.ReactNode }) {
  const { data, isLoading, refetch } = trpc.auth.getLocalUser.useQuery(undefined, {
    retry: false,
    staleTime: 30_000,
  });

  // Ensure id is always a string
  const user = data ? { ...data, id: String(data.id) } : null;

  return (
    <AuthContext.Provider value={{ user, loading: isLoading, refetch }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useLocalAuth() {
  return useContext(AuthContext);
}
