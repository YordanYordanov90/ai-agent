"use client";

import type { CSSProperties } from "react";
import { useEffect, useState } from "react";
import Link from "next/link";
import { Terminal, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

export function LandingNavbar() {
  const [scrollProgress, setScrollProgress] = useState(0);

  useEffect(() => {
    const updateProgress = () => {
      const scrollTop = document.documentElement.scrollTop;
      const scrollHeight =
        document.documentElement.scrollHeight - document.documentElement.clientHeight;
      setScrollProgress(
        scrollHeight > 0 ? Math.min(100, Math.max(0, (scrollTop / scrollHeight) * 100)) : 0
      );
    };

    window.addEventListener("scroll", updateProgress, { passive: true });
    updateProgress();

    return () => window.removeEventListener("scroll", updateProgress);
  }, []);

  return (
    <>
      <nav className="fixed top-0 left-0 right-0 z-50 bg-black/90 backdrop-blur-md border-b border-zinc-800/50 animate-fade-up">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <Link
            href="/"
            aria-label="Cody home"
            className="flex items-center gap-x-4 group rounded-sm outline-offset-4 focus-visible:ring-2 focus-visible:ring-emerald-500/50 focus-visible:ring-offset-2 focus-visible:ring-offset-black"
          >
            <div className="p-2 bg-zinc-900 border border-zinc-800 group-hover:border-emerald-500/50 transition-colors">
              <Terminal className="h-6 w-6 text-emerald-400 group-hover:text-emerald-300 animate-pulse-glow" />
            </div>
            <span className="font-heading text-2xl font-bold tracking-widest text-white uppercase">
              Cody<span className="text-emerald-500 animate-pulse">_</span>
            </span>
          </Link>

          <div className="hidden md:flex items-center gap-x-8">
            <Link
              href="#features"
              className="text-zinc-500 hover:text-emerald-400 transition-colors text-xs font-mono uppercase tracking-widest"
            >
              [01] Features
            </Link>
            <Link
              href="#workflow"
              className="text-zinc-500 hover:text-emerald-400 transition-colors text-xs font-mono uppercase tracking-widest"
            >
              [02] Workflow
            </Link>
            <Button asChild className="relative overflow-hidden group">
              <a
                href="https://discord.com/developers/applications"
                target="_blank"
                rel="noopener noreferrer"
              >
                <span className="relative z-10 flex items-center gap-x-2">
                  Deploy Agent
                  <ChevronRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                </span>
                <div className="absolute inset-0 border border-black/20 pointer-events-none"></div>
                {/* Decorative brutalist corners */}
                <div className="absolute top-0 left-0 w-2 h-2 border-t-2 border-l-2 border-black/50"></div>
                <div className="absolute bottom-0 right-0 w-2 h-2 border-b-2 border-r-2 border-black/50"></div>
              </a>
            </Button>
          </div>
        </div>

        {/* Scroll progress — width via CSS var (no inline width); see globals / Tailwind arbitrary property */}
        <div
          className="h-[2px] bg-zinc-900 w-full overflow-hidden relative [--scroll-pct:0%]"
          style={{ "--scroll-pct": `${scrollProgress}%` } as CSSProperties}
        >
          <div className="h-full max-w-full w-(--scroll-pct) bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.8)] transition-[width] duration-75 ease-out" />
          <div className="absolute inset-y-0 w-20 bg-linear-to-r from-transparent via-emerald-300/40 to-transparent animate-scanline" />
        </div>
      </nav>
    </>
  );
}
