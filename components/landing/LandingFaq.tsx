import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

const faqs = [
  {
    question: "What is Cody?",
    answer:
      "Cody is your personal AI coding and business action agent that lives inside your Discord server. You simply @mention it and it writes production-ready Next.js code, creates GitHub Pull Requests, analyzes stocks & crypto in real-time, and helps with marketing & business tasks.",
  },
  {
    question: "How do I add Cody to my Discord server?",
    answer:
      "Create a bot in the Discord Developer Portal, set the Interactions Endpoint URL to your Vercel app (https://your-app.vercel.app/api/discord), invite it to your server, and start chatting with @Cody.",
  },
  {
    question: "Is Cody free to use?",
    answer:
      "Yes for personal use. It runs on Vercel Hobby plan at no cost. You only pay for Grok API usage (usually just a few dollars per month) and optional Upstash Redis.",
  },
  {
    question: "What exactly can Cody do?",
    answer: (
      <ul className="list-inside space-y-2 mt-2">
        <li className="flex items-start gap-x-2">
          <span className="text-emerald-500">{"->"}</span> Generate clean Next.js / TypeScript / Tailwind code
        </li>
        <li className="flex items-start gap-x-2">
          <span className="text-emerald-500">{"->"}</span> Automatically create GitHub branches + Draft PRs
        </li>
        <li className="flex items-start gap-x-2">
          <span className="text-emerald-500">{"->"}</span> Give real-time stocks & crypto analysis
        </li>
        <li className="flex items-start gap-x-2">
          <span className="text-emerald-500">{"->"}</span> Draft marketing content, LinkedIn posts, competitor research,
          SEO ideas
        </li>
        <li className="flex items-start gap-x-2">
          <span className="text-emerald-500">{"->"}</span> Review code and suggest improvements
        </li>
      </ul>
    ),
  },
  {
    question: "Does Cody really create GitHub Pull Requests?",
    answer:
      "Yes. It can create a new branch and open a Draft PR with the generated code. It never pushes directly to main and always asks for your confirmation first.",
  },
  {
    question: "Is it safe to connect my GitHub account?",
    answer:
      "Very safe. Cody only uses a Personal Access Token with limited scopes. All write actions are Draft PRs only and require your explicit approval.",
  },
  {
    question: "Can Cody analyze real-time market data?",
    answer:
      "Yes. It fetches live prices, 24h changes, volume, and market sentiment from reliable sources (CoinGecko for crypto and Polygon.io for stocks).",
  },
  {
    question: "Can I use Cody for marketing and business tasks?",
    answer:
      "Absolutely. Ask it to write social media threads, campaign ideas, competitor analysis, email copy, SEO suggestions — anything business-related.",
  },
  {
    question: "Are my conversations private?",
    answer:
      "Yes. Everything you discuss with Cody stays between you and the bot in your private Discord server. No data is used for training.",
  },
  {
    question: "What AI model powers Cody?",
    answer:
      "Production Cody uses xAI grok-4-1-fast-reasoning via the Vercel AI SDK (fast, tool-capable). You can change the model id in lib/agent.ts if your stack uses another tier.",
  },
  {
    question: "Can Cody understand my existing codebase?",
    answer:
      "Right now it works best when you give clear instructions. Future updates will add full repository context (RAG) so it knows your whole project.",
  },
  {
    question: "Does it only work with Next.js?",
    answer:
      "No. While it’s optimized for Next.js 16 + TypeScript, you can ask it to generate code in React, Node.js, Python, or any other language/framework.",
  },
];

export function LandingFaq() {
  return (
    <section id="faq" className="py-32 bg-black border-t border-zinc-900 relative">
      {/* Decorative corners */}
      <div className="absolute top-0 left-0 w-8 h-8 border-t-2 border-l-2 border-emerald-500/30"></div>
      <div className="absolute top-0 right-0 w-8 h-8 border-t-2 border-r-2 border-emerald-500/30"></div>

      <div className="max-w-4xl mx-auto px-6">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-16 gap-8 animate-fade-up [animation-delay:120ms]">
          <h2 className="text-4xl md:text-5xl font-black font-heading text-white uppercase tracking-tighter leading-none">
            FAQ <span className="text-zinc-700">Index</span>
          </h2>
          <div className="font-mono text-emerald-500 text-sm tracking-widest uppercase">
            {/* // FAQ.Data */}
          </div>
        </div>

        <div className="bg-zinc-950 border border-zinc-900 p-8 md:p-12 shadow-2xl animate-fade-up [animation-delay:220ms]">
          <Accordion type="single" collapsible className="w-full">
            {faqs.map((faq, i) => (
              <AccordionItem key={i} value={`item-${i}`}>
                <AccordionTrigger>{faq.question}</AccordionTrigger>
                <AccordionContent>{faq.answer}</AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </div>
    </section>
  );
}
