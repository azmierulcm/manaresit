"use client";

import { useAuth } from "@/components/auth/auth-provider";

export function useAuthUser() {
  const { user, isLoading } = useAuth();
  return { user, isLoading, isSignedIn: Boolean(user) };
}
