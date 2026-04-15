export default function Loading() {
  return (
    <div
      role="status"
      aria-live="polite"
      aria-label="Loading page"
      className="flex min-h-screen flex-col items-center justify-center gap-6 bg-black"
    >
      <div
        className="h-10 w-10 animate-spin rounded-none border-2 border-zinc-800 border-t-emerald-500 motion-reduce:animate-none"
        aria-hidden
      />
      <p className="font-mono text-xs uppercase tracking-widest text-zinc-500">Loading</p>
    </div>
  );
}
