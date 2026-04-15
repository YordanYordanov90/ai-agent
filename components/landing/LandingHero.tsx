"use client";

import { useState } from "react";
import { Terminal, Activity, GitPullRequest } from "lucide-react";
import { Button } from "@/components/ui/button";
import { WebDemoModal } from "@/components/landing/WebDemoModal";

export function LandingHero() {
  const [isDemoOpen, setIsDemoOpen] = useState(false);
  const discordAppId = process.env.NEXT_PUBLIC_DISCORD_APPLICATION_ID;
  const discordInstallUrl = discordAppId
    ? `https://discord.com/oauth2/authorize?client_id=${encodeURIComponent(
        discordAppId
      )}&permissions=84992&integration_type=0&scope=bot+applications.commands`
    : "https://discord.com/developers/applications";

  return (
    <>
      <section className="pt-40 pb-32 bg-black relative overflow-hidden flex items-center min-h-[90vh]">
        {/* Background Grid Pattern */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-size-[4rem_4rem]">
          <div className="absolute inset-0 bg-black/50 mask-[radial-gradient(ellipse_60%_60%_at_50%_50%,#000_10%,transparent_100%)]"></div>
        </div>

        {/* Cyberpunk Decorative Frame */}
        <div className="absolute top-0 left-0 w-32 h-32 border-l-2 border-t-2 border-emerald-500/30 -translate-x-10 -translate-y-10 animate-float-y"></div>
        <div className="absolute bottom-0 right-0 w-32 h-32 border-r-2 border-b-2 border-emerald-500/30 translate-x-10 translate-y-10 animate-float-y"></div>

        <div className="max-w-7xl mx-auto px-6 relative z-10 w-full">
          <div className="grid lg:grid-cols-12 gap-12 items-center">
            <div className="lg:col-span-7 space-y-8 animate-fade-up">
              <div className="inline-flex items-center gap-x-3 bg-zinc-900 border border-emerald-500/20 px-3 py-1.5 rounded-none group cursor-default">
                <span className="w-2 h-2 bg-emerald-500 rounded-none animate-pulse"></span>
                <span className="text-emerald-400 font-mono text-xs uppercase tracking-widest group-hover:text-emerald-300 transition-colors">
                  SYS.INIT // grok-4-1-fast-reasoning
                </span>
              </div>

              <div className="space-y-4">
                <h1 className="font-heading text-6xl sm:text-7xl lg:text-8xl tracking-tighter text-white leading-[0.9] uppercase font-black">
                  Execute<br />
                  <span className="text-emerald-500 relative inline-block animate-pulse-glow">Code</span>
                  <br />
                  In Discord
                </h1>
                <div className="h-1 w-24 bg-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.5)]"></div>
              </div>

              <p className="text-xl text-zinc-400 max-w-lg font-mono leading-relaxed">
                &gt; Cody is a command-line interface wrapped in a Discord bot. Ship Next.js PRs, fetch market data,
                execute strategy.
              </p>

              <div className="flex flex-wrap items-center gap-6 pt-4">
                <Button asChild size="lg" className="bg-emerald-500 hover:bg-emerald-400 text-black border-none">
                  <a href={discordInstallUrl} target="_blank" rel="noopener noreferrer">
                    Connect to Server
                    <Terminal className="h-5 w-5 ml-3" />
                  </a>
                </Button>
                <Button variant="outline" size="lg" onClick={() => setIsDemoOpen(true)}>
                  Init Web Demo
                </Button>
              </div>

              {/* Metrics Ticker */}
              <div className="pt-12 flex items-center gap-8 border-t border-zinc-800/50 mt-12">
                <div className="flex flex-col">
                  <span className="text-zinc-600 font-mono text-xs uppercase">Github</span>
                  <div className="flex items-center gap-x-2 text-zinc-300 font-mono text-sm mt-1">
                    <GitPullRequest className="h-4 w-4 text-emerald-500" />
                    Draft PRs
                  </div>
                </div>
                <div className="flex flex-col">
                  <span className="text-zinc-600 font-mono text-xs uppercase">Market</span>
                  <div className="flex items-center gap-x-2 text-zinc-300 font-mono text-sm mt-1">
                    <Activity className="h-4 w-4 text-emerald-500" />
                    Live Data
                  </div>
                </div>
                <div className="flex flex-col">
                  <span className="text-zinc-600 font-mono text-xs uppercase">Runtime</span>
                  <div className="flex items-center gap-x-2 text-zinc-300 font-mono text-sm mt-1">
                    <div className="w-4 h-4 border border-emerald-500 flex items-center justify-center">
                      <div className="w-1.5 h-1.5 bg-emerald-500 animate-pulse"></div>
                    </div>
                    Upstash Redis
                  </div>
                </div>
              </div>
            </div>

            {/* Decorative Terminal Visual */}
            <div className="hidden lg:block lg:col-span-5 relative animate-fade-up [animation-delay:220ms]">
              <div className="absolute -inset-4 bg-emerald-500/10 blur-3xl rounded-full animate-pulse-glow"></div>
              <div className="relative bg-black border border-zinc-800 shadow-2xl p-1 animate-float-y">
                <div className="bg-zinc-950 p-6 font-mono text-xs md:text-sm text-emerald-400/80 leading-relaxed overflow-hidden h-[400px]">
                  <div className="flex items-center gap-x-2 border-b border-zinc-800 pb-4 mb-4">
                    <div className="w-3 h-3 bg-zinc-700 rounded-none"></div>
                    <div className="w-3 h-3 bg-zinc-700 rounded-none"></div>
                    <div className="w-3 h-3 bg-zinc-700 rounded-none"></div>
                    <span className="ml-4 text-zinc-500 uppercase tracking-wider">cody_terminal.exe</span>
                  </div>
                  <div className="space-y-3 opacity-80">
                    <p>
                      <span className="text-zinc-500">01</span> $ ssh cody@discord -p 443
                    </p>
                    <p>
                      <span className="text-zinc-500">02</span> Authenticating with xAI Core...
                    </p>
                    <p>
                      <span className="text-zinc-500">03</span> <span className="text-blue-400">SUCCESS</span> Models
                      synchronized.
                    </p>
                    <p className="pt-2">
                      <span className="text-zinc-500">04</span> $ cody create-auth --stack nextjs
                    </p>
                    <p>
                      <span className="text-zinc-500">05</span> Analyzing repository structure...
                    </p>
                    <p>
                      <span className="text-zinc-500">06</span> Scaffolding Zod schemas & Server Actions.
                    </p>
                    <p>
                      <span className="text-zinc-500">07</span> Pushing branch{" "}
                      <span className="text-purple-400">feature/auth-v2</span>
                    </p>
                    <p className="pt-2">
                      <span className="text-zinc-500">08</span>{" "}
                      <span className="text-emerald-500">PR #42 OPENED</span> Waiting for Human-in-the-Loop
                    </p>
                    <p className="pt-4 flex">
                      <span className="text-zinc-500 mr-2">09</span> $
                      <span className="w-2 h-4 bg-emerald-500 ml-1 animate-pulse inline-block"></span>
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
      <WebDemoModal isOpen={isDemoOpen} onClose={() => setIsDemoOpen(false)} />
    </>
  );
}
