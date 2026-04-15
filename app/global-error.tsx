"use client";

import "./globals.css";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full bg-black text-zinc-300 flex items-center justify-center px-6">
        <div className="max-w-md w-full border border-zinc-800 bg-zinc-950 p-10 space-y-4 text-center">
          <h1 className="text-xl font-bold text-white font-heading uppercase tracking-tight">
            Cody — critical error
          </h1>
          <p className="text-sm text-zinc-500 font-mono">
            The root layout failed. Refresh or retry after a moment.
          </p>
          {process.env.NODE_ENV === "development" ? (
            <p className="text-xs text-red-400/90 font-mono break-all">{error.message}</p>
          ) : null}
          <button
            type="button"
            onClick={() => reset()}
            className="mt-2 inline-flex items-center justify-center px-4 py-2 text-xs font-mono uppercase tracking-widest border border-emerald-600 text-emerald-400 hover:bg-emerald-950 transition-colors"
          >
            Retry
          </button>
        </div>
      </body>
    </html>
  );
}
