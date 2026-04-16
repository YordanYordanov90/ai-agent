import type { Metadata } from "next";
import Link from "next/link";
import { BarChart3, KeyRound, LayoutDashboard, MessageSquare, Puzzle, Server } from "lucide-react";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

export const metadata: Metadata = {
  title: "Dashboard | Cody",
};

const navItems = [
  { label: "Dashboard", icon: LayoutDashboard, active: true },
  { label: "Connected Servers", icon: Server, active: false },
  { label: "Personalities", icon: Puzzle, active: false },
  { label: "Usage", icon: BarChart3, active: false },
  { label: "API Keys", icon: KeyRound, active: false },
] as const;

const statCards = [
  { label: "Connected Discord servers", value: "0", helper: "Awaiting first server connection" },
  { label: "Draft PRs created", value: "0", helper: "Generated through Cody actions" },
  { label: "Messages sent", value: "0", helper: "Total interactions processed" },
] as const;

const personalities = ["General", "Crypto Trader", "Next.js Coder", "Marketing Expert"] as const;

export default function DashboardPage() {
  return (
    <main className="min-h-screen bg-black text-zinc-100">
      <div className="mx-auto grid w-full max-w-7xl gap-6 px-4 py-8 md:px-6 lg:grid-cols-[260px_1fr]">
        <aside className="border border-zinc-800 bg-zinc-950/60 p-4">
          <div className="mb-6 flex items-center justify-between">
            <p className="font-heading text-2xl font-black uppercase tracking-widest text-white">Cody</p>
            <Badge variant="secondary">Beta</Badge>
          </div>

          <nav className="space-y-2">
            {navItems.map(({ label, icon: Icon, active }) => (
              <button
                key={label}
                type="button"
                className={`flex w-full items-center gap-3 border px-3 py-2 text-left font-mono text-xs font-bold uppercase tracking-widest transition-colors ${
                  active
                    ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-300"
                    : "border-zinc-800 bg-black text-zinc-300 hover:border-zinc-700 hover:text-white"
                }`}
              >
                <Icon className="h-4 w-4" />
                {label}
              </button>
            ))}
          </nav>

          <Separator className="my-6" />

          <p className="font-mono text-[11px] uppercase tracking-widest text-zinc-500">
            Modules align with roadmap phases from PRD_.
          </p>
        </aside>

        <section className="space-y-6 border border-zinc-800 bg-zinc-950/40 p-5 md:p-6">
          <DashboardHeader />

          <div className="grid gap-4 md:grid-cols-3">
            {statCards.map((card) => (
              <Card key={card.label}>
                <CardHeader>
                  <CardTitle>{card.label}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-1">
                  <p className="font-heading text-4xl font-black text-white">{card.value}</p>
                  <CardDescription className="font-mono text-xs uppercase tracking-wider">{card.helper}</CardDescription>
                </CardContent>
              </Card>
            ))}
          </div>

          <Card>
            <CardHeader>
              <div className="flex items-center justify-between gap-3">
                <CardTitle>My Cody Personalities</CardTitle>
                <Badge>Future feature</Badge>
              </div>
              <CardDescription>
                Choose specialized behavior presets for upcoming automation flows.
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-3 sm:grid-cols-2">
              {personalities.map((name) => (
                <Button key={name} variant="outline" className="h-14 justify-start px-4">
                  <MessageSquare className="mr-3 h-4 w-4 text-emerald-400" />
                  {name}
                </Button>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
              <CardDescription>Latest account actions and workflow events will appear here.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="border border-dashed border-zinc-700 p-6 text-center">
                <p className="font-mono text-xs uppercase tracking-widest text-zinc-400">No activity yet</p>
                <p className="mt-2 text-sm text-zinc-500">
                  Connect Cody to your Discord server to start tracking authenticated workflow events.
                </p>
                <Button asChild className="mt-4">
                  <Link href="/">Go back to landing</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </section>
      </div>
    </main>
  );
}
