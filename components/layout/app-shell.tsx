"use client";

import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import {
  Camera,
  FileCheck2,
  Home,
  LockKeyhole,
  LogOut,
  ReceiptText,
  WalletCards,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useAuth } from "@/components/auth/auth-provider";
import { signOutCurrentUser } from "@/lib/firebase/auth";
import { cn } from "@/lib/utils";

const navItems = [
  { label: "Home", href: "/", icon: Home },
  { label: "Scan", href: "/scan", icon: Camera },
  { label: "Ledger", href: "/ledger", icon: ReceiptText },
  { label: "Invoices", href: "/invoices", icon: FileCheck2 },
  { label: "Vault", href: "/vault", icon: LockKeyhole },
] satisfies Array<{ label: string; href: string; icon: LucideIcon }>;

function Sidebar() {
  const { user } = useAuth();
  const pathname = usePathname();
  const router = useRouter();

  async function handleSignOut() {
    await signOutCurrentUser();
    router.replace("/login");
  }

  return (
    <aside className="sticky top-6 hidden h-[calc(100vh-3rem)] w-64 shrink-0 flex-col rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm lg:flex">
      <div className="flex items-center gap-3 px-2 py-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-rose-500 text-white shadow-sm">
          <WalletCards className="h-5 w-5" aria-hidden="true" />
        </div>
        <div>
          <p className="text-sm font-semibold">Manaresit</p>
          <p className="text-xs text-zinc-500">Receipt-first finance tracker</p>
        </div>
      </div>

      <nav className="mt-6 space-y-1">
        {navItems.map(({ label, href, icon: Icon }) => (
          <Link
            key={label}
            href={href}
            className={cn(
              "flex h-12 w-full items-center gap-2.5 rounded-2xl px-3 text-sm font-medium transition",
              pathname === href
                ? "bg-zinc-950 text-white"
                : "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-950",
            )}
          >
            <Icon className="h-4 w-4" aria-hidden="true" />
            {label}
          </Link>
        ))}
      </nav>

      <div className="mt-auto space-y-1">
        {user && (
          <div className="flex items-center gap-3 rounded-2xl border border-zinc-100 p-3">
            {user.photoURL ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={user.photoURL} alt="" className="h-8 w-8 rounded-full" />
            ) : (
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-rose-100 text-xs font-semibold text-rose-600">
                {user.displayName?.[0]?.toUpperCase() ?? "U"}
              </div>
            )}
            <div className="min-w-0">
              <p className="truncate text-xs font-semibold text-zinc-950">
                {user.displayName ?? "User"}
              </p>
              <p className="truncate text-xs text-zinc-400">{user.email}</p>
            </div>
          </div>
        )}
        <button
          onClick={handleSignOut}
          className="flex w-full items-center gap-2 rounded-2xl px-3 py-2.5 text-xs font-medium text-zinc-500 transition hover:bg-zinc-100 hover:text-zinc-950"
        >
          <LogOut className="h-3.5 w-3.5" aria-hidden="true" />
          Sign out
        </button>
      </div>
    </aside>
  );
}

function MobileTopBar({ title }: { title: string }) {
  return (
    <header className="sticky top-0 z-20 -mx-4 border-b border-zinc-200 bg-zinc-50/95 px-4 py-3 backdrop-blur sm:-mx-6 sm:px-6 lg:hidden">
      <h1 className="text-lg font-semibold text-zinc-950">{title}</h1>
    </header>
  );
}

function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed inset-x-0 bottom-0 z-20 border-t border-zinc-200 bg-white/95 px-3 pb-[calc(env(safe-area-inset-bottom)+0.75rem)] pt-2 shadow-sm backdrop-blur lg:hidden">
      <div className="mx-auto grid max-w-md grid-cols-5 gap-1">
        {navItems.map(({ label, href, icon: Icon }) => (
          <Link
            key={label}
            href={href}
            className={cn(
              "flex min-h-12 flex-col items-center justify-center gap-1 rounded-2xl text-[11px] font-medium transition",
              pathname === href
                ? "bg-zinc-950 text-white"
                : "text-zinc-500 hover:bg-zinc-100",
            )}
          >
            <Icon className="h-5 w-5" aria-hidden="true" />
            <span>{label}</span>
          </Link>
        ))}
      </div>
    </nav>
  );
}

export function AppShell({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <main className="min-h-screen bg-zinc-50 text-zinc-950">
      <div className="mx-auto flex w-full max-w-7xl gap-8 px-4 pb-28 sm:px-6 lg:px-8 lg:py-6">
        <Sidebar />

        <div className="min-w-0 flex-1">
          <MobileTopBar title={title} />
          <div className="pt-4 lg:pt-0">{children}</div>
        </div>
      </div>

      <BottomNav />
    </main>
  );
}
