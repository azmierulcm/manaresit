"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { WalletCards } from "lucide-react";
import { signInWithGoogle } from "@/lib/firebase/auth";
import { useAuth } from "@/components/auth/auth-provider";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";

export default function LoginPage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const [signingIn, setSigningIn] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isLoading && user) {
      router.replace("/");
    }
  }, [user, isLoading, router]);

  async function handleGoogleSignIn() {
    setError(null);
    setSigningIn(true);
    try {
      await signInWithGoogle();
    } catch {
      setError("Sign-in failed. Please try again.");
      setSigningIn(false);
    }
  }

  if (isLoading || user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-50">
        <Spinner className="h-8 w-8" />
      </div>
    );
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-zinc-50 px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-rose-500 text-white shadow-sm">
            <WalletCards className="h-8 w-8" />
          </div>
          <h1 className="mt-5 text-2xl font-semibold text-zinc-950">Manaresit</h1>
          <p className="mt-2 text-sm text-zinc-500">
            Receipt-first finance tracker for Malaysia
          </p>
        </div>

        <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
          <p className="mb-5 text-sm font-medium text-zinc-700">Sign in to continue</p>

          {error && (
            <p className="mb-4 rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700">
              {error}
            </p>
          )}

          <Button
            onClick={handleGoogleSignIn}
            disabled={signingIn}
            className="w-full"
          >
            {signingIn ? (
              <Spinner className="h-4 w-4 border-white border-t-zinc-400" />
            ) : (
              <svg className="h-4 w-4" viewBox="0 0 24 24" aria-hidden>
                <path
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  fill="#4285F4"
                />
                <path
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  fill="#34A853"
                />
                <path
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"
                  fill="#FBBC05"
                />
                <path
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  fill="#EA4335"
                />
              </svg>
            )}
            Continue with Google
          </Button>
        </div>

        <p className="mt-6 text-center text-xs text-zinc-400">
          Your receipts are private by default and stored securely in your vault.
        </p>
      </div>
    </main>
  );
}
