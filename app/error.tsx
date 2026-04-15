"use client";

import { useEffect } from "react";
import Link from "next/link";
import { RefreshCw, Terminal } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[App error]", error);
  }, [error]);

  return (
    <div className="min-h-screen bg-black text-zinc-300 flex flex-col items-center justify-center px-6">
      <div className="max-w-md w-full border border-zinc-800 bg-zinc-950 p-10 space-y-6">
        <div className="flex items-center gap-3 text-emerald-500">
          <Terminal className="h-8 w-8 shrink-0" aria-hidden />
          <span className="font-mono text-xs uppercase tracking-widest">Cody / fault</span>
        </div>
        <h1 className="text-2xl font-bold text-white font-heading uppercase tracking-tight">
          Something went wrong
        </h1>
        <p className="text-sm text-zinc-500 font-mono leading-relaxed">
          This segment failed to render. Retry the segment or return to the landing page.
        </p>
        {process.env.NODE_ENV === "development" ? (
          <pre className="text-xs text-red-400/90 whitespace-pre-wrap break-all max-h-40 overflow-auto rounded border border-zinc-800 p-3 bg-black/50">
            {error.message}
          </pre>
        ) : null}
        <div className="flex flex-wrap gap-3">
          <Button
            type="button"
            onClick={() => reset()}
            variant="outline"
            className="border-zinc-700 text-emerald-400 hover:bg-zinc-900"
          >
            <RefreshCw className="h-4 w-4 mr-2" aria-hidden />
            Try again
          </Button>
          <Button asChild variant="secondary" className="bg-zinc-800 text-white hover:bg-zinc-700">
            <Link href="/">Back home</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
