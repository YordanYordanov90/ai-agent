import { LandingHero } from '@/components/landing/LandigHero';
import { LandingNavbar } from '@/components/landing/LandigNavbar';
import { LandingFaq } from '@/components/landing/LandigFaq';
import { Terminal, GitMerge, LineChart, TrendingUp, Zap, Cpu } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function Home() {
  return (
    <main className="bg-black min-h-screen selection:bg-emerald-500/30 selection:text-emerald-200">
      <LandingNavbar />
      <LandingHero />

      {/* Feature Grid - Brutalist/Minimalist */}
      <section id="features" className="py-32 relative border-t border-zinc-900 animate-fade-up [animation-delay:120ms]">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-16 gap-8">
            <h2 className="text-5xl md:text-6xl font-black font-heading text-white uppercase tracking-tighter leading-none">
              Capabilities<br />
              <span className="text-zinc-700">Index</span>
            </h2>
            <div className="font-mono text-emerald-500 text-sm tracking-widest uppercase">
              {'// 4 Core Modules'}
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-px bg-zinc-900 border border-zinc-900">
            {/* Card 1 */}
            <div className="bg-black p-10 lg:p-14 group relative hover:bg-zinc-950 transition-colors hover:-translate-y-1 duration-300">
              <div className="absolute top-0 right-0 p-6 font-mono text-zinc-800 text-xl font-bold group-hover:text-emerald-500/20 transition-colors">01</div>
              <Terminal className="h-10 w-10 text-emerald-500 mb-8" strokeWidth={1.5} />
              <h3 className="text-2xl font-bold text-white uppercase tracking-wide mb-4">Production Code</h3>
              <p className="text-zinc-400 font-mono text-sm leading-relaxed">
                Next.js 16, TypeScript, Tailwind v4. Clean architecture ready for production. Zero AI-slop, pure deterministic output.
              </p>
            </div>
            
            {/* Card 2 */}
            <div className="bg-black p-10 lg:p-14 group relative hover:bg-zinc-950 transition-colors hover:-translate-y-1 duration-300">
              <div className="absolute top-0 right-0 p-6 font-mono text-zinc-800 text-xl font-bold group-hover:text-emerald-500/20 transition-colors">02</div>
              <GitMerge className="h-10 w-10 text-emerald-500 mb-8" strokeWidth={1.5} />
              <h3 className="text-2xl font-bold text-white uppercase tracking-wide mb-4">Autonomous PRs</h3>
              <p className="text-zinc-400 font-mono text-sm leading-relaxed">
                Cody manages git branches automatically. Everything routes through Draft PRs, enforcing strict Human-in-the-Loop validation.
              </p>
            </div>

            {/* Card 3 */}
            <div className="bg-black p-10 lg:p-14 group relative hover:bg-zinc-950 transition-colors hover:-translate-y-1 duration-300">
              <div className="absolute top-0 right-0 p-6 font-mono text-zinc-800 text-xl font-bold group-hover:text-emerald-500/20 transition-colors">03</div>
              <LineChart className="h-10 w-10 text-emerald-500 mb-8" strokeWidth={1.5} />
              <h3 className="text-2xl font-bold text-white uppercase tracking-wide mb-4">Market Intel</h3>
              <p className="text-zinc-400 font-mono text-sm leading-relaxed">
                Real-time ingestion of crypto & stock APIs. Instantly query charts, analyze sentiment, and execute trading strategies.
              </p>
            </div>

            {/* Card 4 */}
            <div className="bg-black p-10 lg:p-14 group relative hover:bg-zinc-950 transition-colors hover:-translate-y-1 duration-300">
              <div className="absolute top-0 right-0 p-6 font-mono text-zinc-800 text-xl font-bold group-hover:text-emerald-500/20 transition-colors">04</div>
              <TrendingUp className="h-10 w-10 text-emerald-500 mb-8" strokeWidth={1.5} />
              <h3 className="text-2xl font-bold text-white uppercase tracking-wide mb-4">Marketing Engine</h3>
              <p className="text-zinc-400 font-mono text-sm leading-relaxed">
                Aggressive SEO analysis, competitor scraping, and LinkedIn post drafting directly linked to your product releases.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How it works - Staggered Grid */}
      <section id="workflow" className="py-32 bg-zinc-950 border-t border-zinc-900 overflow-hidden animate-fade-up [animation-delay:220ms]">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-24">
            <h2 className="text-3xl md:text-5xl font-black text-white uppercase tracking-tight font-heading">
              Protocol: <span className="text-transparent bg-clip-text bg-linear-to-r from-emerald-400 to-cyan-500">Execute</span>
            </h2>
            <div className="h-px w-32 bg-linear-to-r from-transparent via-emerald-500 to-transparent mx-auto mt-8"></div>
          </div>

          <div className="relative">
            <div className="absolute left-1/2 -ml-px top-0 bottom-0 w-px bg-zinc-800 hidden md:block"></div>
            
            <div className="space-y-24">
              {/* Step 1 */}
              <div className="relative grid md:grid-cols-2 gap-12 items-center">
                <div className="md:text-right md:pr-16">
                  <div className="text-emerald-500 font-mono font-bold text-6xl mb-4">/01</div>
                  <h4 className="text-2xl font-bold text-white uppercase mb-3">Initiate Context</h4>
                  <p className="text-zinc-400 font-mono text-sm">Mention @Cody inside your secure Discord channel. Feed it your raw idea, refactor request, or market query.</p>
                </div>
                <div className="hidden md:flex items-center justify-center relative">
                  <div className="w-4 h-4 bg-emerald-500 absolute left-[-8px] shadow-[0_0_10px_#10b981]"></div>
                  <div className="w-full max-w-sm border border-zinc-800 bg-black p-6 font-mono text-sm">
                    <span className="text-emerald-400">@Cody</span> I need a webhook handler for Stripe subscriptions.
                  </div>
                </div>
              </div>

              {/* Step 2 */}
              <div className="relative grid md:grid-cols-2 gap-12 items-center">
                <div className="hidden md:flex items-center justify-center relative order-1 md:order-0">
                  <div className="w-4 h-4 bg-zinc-800 absolute right-[-8px]"></div>
                  <div className="w-full max-w-sm border border-zinc-800 bg-black p-6 font-mono text-sm text-zinc-500">
                    <Zap className="h-5 w-5 mb-4 text-emerald-500" />
                    [PROCESSING VIA GROK-4.20]
                    <br />&gt; Building AST...
                    <br />&gt; Resolving Zod schemas...
                  </div>
                </div>
                <div className="md:pl-16 order-2 md:order-0">
                  <div className="text-zinc-700 font-mono font-bold text-6xl mb-4">/02</div>
                  <h4 className="text-2xl font-bold text-white uppercase mb-3">Agentic Synthesis</h4>
                  <p className="text-zinc-400 font-mono text-sm">Vercel AI SDK routes the request to Grok-4.20. Code is synthesized, typed, and validated securely in milliseconds.</p>
                </div>
              </div>

              {/* Step 3 */}
              <div className="relative grid md:grid-cols-2 gap-12 items-center">
                <div className="md:text-right md:pr-16">
                  <div className="text-white font-mono font-bold text-6xl mb-4">/03</div>
                  <h4 className="text-2xl font-bold text-white uppercase mb-3">Deploy & Merge</h4>
                  <p className="text-zinc-400 font-mono text-sm">Cody pushes directly to GitHub. You review the draft PR, run tests, and merge. Zero friction.</p>
                </div>
                <div className="hidden md:flex items-center justify-center relative">
                  <div className="w-4 h-4 bg-white absolute left-[-8px]"></div>
                  <div className="w-full max-w-sm border-2 border-emerald-500/30 bg-emerald-500/5 p-6 font-mono text-sm">
                    <Cpu className="h-5 w-5 mb-4 text-emerald-400" />
                    <span className="text-white">PR #102: Stripe Webhooks</span>
                    <br /><span className="text-emerald-400 mt-2 block">+ 142 lines, - 0 lines</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <LandingFaq />

      {/* Final CTA - Massive Block */}
      <section className="bg-emerald-500 border-t border-emerald-400 overflow-hidden relative">
        {/* Background Noise/Grid */}
        <div className="absolute inset-0 opacity-10 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0IiBoZWlnaHQ9IjQiPgo8cmVjdCB3aWR0aD0iNCIgaGVpZ2h0PSI0IiBmaWxsPSIjZmZmIi8+CjxyZWN0IHdpZHRoPSIxIiBoZWlnaHQ9IjEiIGZpbGw9IiMwMDAiLz4KPC9zdmc+')] animate-pulse-glow"></div>
        
        <div className="max-w-7xl mx-auto px-6 py-32 md:py-48 relative z-10 text-center animate-fade-up [animation-delay:320ms]">
          <h2 className="text-6xl md:text-8xl font-black text-black uppercase tracking-tighter mb-12">
            Compile<br />Your Ideas.
          </h2>
          
          <Button asChild size="lg" className="bg-black text-white hover:bg-zinc-900 border border-transparent shadow-[8px_8px_0px_rgba(0,0,0,0.5)] hover:shadow-[4px_4px_0px_rgba(0,0,0,0.5)]">
            <a
              href="https://discord.com/developers/applications"
              target="_blank"
            >
              Authenticate Bot
              <Terminal className="h-6 w-6 ml-4" />
            </a>
          </Button>

          <p className="mt-12 text-black/60 font-mono text-sm font-bold uppercase tracking-wider">
            Powered by Grok • Next.js 16 • Upstash Redis
          </p>
        </div>
      </section>
    </main>
  );
}