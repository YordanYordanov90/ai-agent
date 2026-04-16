"use client";

import { ClerkLoaded, ClerkLoading, UserButton, useUser } from "@clerk/nextjs";
import { Skeleton } from "@/components/ui/skeleton";

export function DashboardHeader() {
  const { user } = useUser();
  const displayName = user?.firstName ?? user?.username ?? user?.primaryEmailAddress?.emailAddress ?? "Operator";

  return (
    <header className="flex flex-col gap-4 border-b border-zinc-800 pb-6 md:flex-row md:items-center md:justify-between">
      <ClerkLoading>
        <div className="space-y-3">
          <Skeleton className="h-9 w-56" />
          <Skeleton className="h-5 w-80 max-w-full" />
        </div>
        <Skeleton className="h-10 w-10" />
      </ClerkLoading>

      <ClerkLoaded>
        <div>
          <h1 className="font-heading text-3xl font-black uppercase tracking-tight text-white md:text-4xl">
            Welcome back, {displayName}
          </h1>
          <p className="mt-2 font-mono text-xs uppercase tracking-widest text-zinc-400">
            Dashboard control plane for Cody workflows
          </p>
        </div>
        <UserButton
          appearance={{
            elements: {
              userButtonAvatarBox: "h-10 w-10 border border-zinc-700",
            },
          }}
        />
      </ClerkLoaded>
    </header>
  );
}
