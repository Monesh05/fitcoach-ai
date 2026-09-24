/**
 * page.tsx (landing) — Marketing landing page for FitCoach AI.
 * Author: Monesh Abinav <monesh.abinav@vigilnz.com>
 * Date: 2026-09-24
 */
import Link from "next/link";
import {
  ArrowRight,
  BookOpenCheck,
  Camera,
  Dumbbell,
  LineChart,
  MessageCircle,
  Sparkles,
  Target,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { LandingNav } from "@/components/landing/landing-nav";
import { ChatPreviewMockup } from "@/components/landing/chat-preview-mockup";
import { MultimodalPreviewMockup } from "@/components/landing/multimodal-preview-mockup";
import { PersonalizationPreviewMockup } from "@/components/landing/personalization-preview-mockup";
import { ProgressPreviewMockup } from "@/components/landing/progress-preview-mockup";

const VALUE_STRIP = [
  { label: "Grounded answers", icon: BookOpenCheck },
  { label: "Multimodal coaching", icon: Camera },
  { label: "Personalized guidance", icon: Target },
  { label: "Progress tracking", icon: LineChart },
];

const FEATURES = [
  {
    icon: MessageCircle,
    title: "AI Fitness Coach",
    description:
      "Ask anything about training, nutrition, recovery, or programming and get a considered answer — not a canned response.",
  },
  {
    icon: BookOpenCheck,
    title: "Grounded Responses",
    description:
      "Every answer is retrieved from a curated fitness knowledge base and cited, so you can see exactly what it's based on.",
  },
  {
    icon: Camera,
    title: "Multimodal Coaching",
    description:
      "Upload a photo of your meal for a macro breakdown, or your lifting form for technique feedback grounded in the same material.",
  },
  {
    icon: Target,
    title: "Personalized Plans",
    description:
      "Set your goals, experience level, equipment, and diet once — every plan and answer is tailored around them.",
  },
  {
    icon: LineChart,
    title: "Progress Tracking",
    description:
      "Log weight and workouts, upload progress photos, and see your trend and adherence over time in one place.",
  },
  {
    icon: Sparkles,
    title: "Agentic Reasoning",
    description:
      "The coach can check your history and knowledge base on its own — chaining lookups together before it answers.",
  },
];

const STEPS = [
  {
    number: "01",
    title: "Tell FitCoach about yourself",
    description: "Goals, experience level, equipment, diet, and targets — set once, used everywhere.",
  },
  {
    number: "02",
    title: "Ask questions or upload your data",
    description: "Chat about training and nutrition, or upload a meal photo or a lift to review.",
  },
  {
    number: "03",
    title: "Get personalized, grounded guidance",
    description: "Answers cite real sources and account for your equipment, diet, and goals.",
  },
  {
    number: "04",
    title: "Track progress and improve",
    description: "Log weight and workouts, and let the coach adjust its guidance as you go.",
  },
];

export default function Home() {
  return (
    <div className="flex flex-1 flex-col">
      <LandingNav />

      {/* Hero */}
      <section className="mx-auto grid w-full max-w-6xl gap-12 px-4 py-20 sm:px-6 sm:py-28 lg:grid-cols-2 lg:items-center lg:gap-8">
        <div className="flex flex-col items-start gap-6">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-muted/50 px-3 py-1 text-xs font-medium text-muted-foreground">
            <Sparkles className="size-3.5 text-brand" />
            Evidence-grounded AI coaching
          </span>
          <h1 className="text-4xl leading-[1.08] font-semibold tracking-tight sm:text-5xl lg:text-6xl">
            Your AI fitness coach,
            <br />
            built around you.
          </h1>
          <p className="max-w-lg text-lg text-muted-foreground">
            Ask training and nutrition questions, upload a meal photo or your lifting form, and get
            guidance that cites its sources and adapts to your goals — not generic advice.
          </p>
          <div className="flex flex-col gap-3 sm:flex-row">
            <Button size="lg" render={<Link href="/login" />}>
              Start coaching
              <ArrowRight className="size-4" />
            </Button>
            <Button size="lg" variant="outline" render={<a href="#how-it-works" />}>
              See how it works
            </Button>
          </div>
        </div>

        <div className="flex justify-center lg:justify-end">
          <ChatPreviewMockup />
        </div>
      </section>

      {/* Value strip */}
      <section className="border-y border-border bg-muted/30">
        <div className="mx-auto grid max-w-6xl grid-cols-2 gap-px bg-border px-0 sm:grid-cols-4">
          {VALUE_STRIP.map((item) => (
            <div
              key={item.label}
              className="flex flex-col items-center gap-2 bg-background px-4 py-8 text-center sm:flex-row sm:justify-center sm:gap-3"
            >
              <item.icon className="size-4 text-brand" />
              <span className="text-sm font-medium">{item.label}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section id="features" className="mx-auto w-full max-w-6xl px-4 py-24 sm:px-6">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">
            Everything a real coach would check
          </h2>
          <p className="mt-4 text-muted-foreground">
            Not a single-purpose chatbot — a coach that reasons over your data, a knowledge base,
            and what you show it.
          </p>
        </div>

        <div className="mt-14 grid gap-px overflow-hidden rounded-2xl border border-border bg-border sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((feature) => (
            <div key={feature.title} className="flex flex-col gap-3 bg-background p-6">
              <div className="flex size-9 items-center justify-center rounded-lg bg-brand/10">
                <feature.icon className="size-4.5 text-brand" />
              </div>
              <h3 className="font-medium">{feature.title}</h3>
              <p className="text-sm leading-relaxed text-muted-foreground">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section id="how-it-works" className="border-t border-border bg-muted/30">
        <div className="mx-auto w-full max-w-6xl px-4 py-24 sm:px-6">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">How it works</h2>
            <p className="mt-4 text-muted-foreground">
              From a five-minute setup to a coach that actually knows your context.
            </p>
          </div>

          <div className="mt-14 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {STEPS.map((step, index) => (
              <div key={step.number} className="relative flex flex-col gap-3">
                <span className="font-mono text-sm text-brand">{step.number}</span>
                <h3 className="font-medium">{step.title}</h3>
                <p className="text-sm leading-relaxed text-muted-foreground">
                  {step.description}
                </p>
                {index < STEPS.length - 1 && (
                  <div className="absolute top-2.5 left-[calc(100%+1rem)] hidden h-px w-8 bg-border lg:block" />
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Multimodal */}
      <section className="mx-auto grid w-full max-w-6xl gap-12 px-4 py-24 sm:px-6 lg:grid-cols-2 lg:items-center">
        <div className="flex flex-col gap-4">
          <span className="text-xs font-medium tracking-wide text-brand uppercase">
            Multimodal coaching
          </span>
          <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">
            It's not just a text chatbot.
          </h2>
          <p className="text-muted-foreground">
            Snap a photo of your plate and get a real macro estimate, or a photo of your lift and
            get technique feedback — both grounded in the same reference material as your chat.
          </p>
        </div>
        <MultimodalPreviewMockup />
      </section>

      {/* Personalization */}
      <section id="personalization" className="border-t border-border bg-muted/30">
        <div className="mx-auto grid w-full max-w-6xl gap-12 px-4 py-24 sm:px-6 lg:grid-cols-2 lg:items-center">
          <div className="order-2 flex justify-center lg:order-1 lg:justify-start">
            <PersonalizationPreviewMockup />
          </div>
          <div className="order-1 flex flex-col gap-4 lg:order-2">
            <span className="text-xs font-medium tracking-wide text-brand uppercase">
              Personalized plans
            </span>
            <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">
              Set it once. Used everywhere.
            </h2>
            <p className="text-muted-foreground">
              Your goal, experience, equipment, diet, and targets shape every plan and every chat
              answer — no re-explaining yourself each time.
            </p>
          </div>
        </div>
      </section>

      {/* Progress */}
      <section id="progress" className="mx-auto w-full max-w-6xl px-4 py-24 sm:px-6">
        <div className="grid gap-12 lg:grid-cols-2 lg:items-center">
          <div className="flex flex-col gap-4">
            <span className="text-xs font-medium tracking-wide text-brand uppercase">
              Progress tracking
            </span>
            <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">
              See what's actually working.
            </h2>
            <p className="text-muted-foreground">
              Log your weight and workouts as you go, and the coach can reference your real trend
              — not just what you tell it — when it recommends a change.
            </p>
          </div>
          <div className="flex justify-center lg:justify-end">
            <ProgressPreviewMockup />
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="border-t border-border">
        <div className="mx-auto flex w-full max-w-4xl flex-col items-center gap-6 px-4 py-24 text-center sm:px-6">
          <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">
            Train smarter.
            <br />
            Eat better. Keep progressing.
          </h2>
          <Button size="lg" render={<Link href="/login" />}>
            Start your coaching journey
            <ArrowRight className="size-4" />
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border">
        <div className="mx-auto flex w-full max-w-6xl flex-col items-center justify-between gap-6 px-4 py-10 sm:flex-row sm:px-6">
          <Link href="/" className="flex items-center gap-2 text-sm font-semibold">
            <div className="flex size-6 items-center justify-center rounded-md bg-foreground text-background">
              <Dumbbell className="size-3.5" />
            </div>
            FitCoach AI
          </Link>
          <nav className="flex flex-wrap items-center justify-center gap-6 text-sm text-muted-foreground">
            <a href="#features" className="hover:text-foreground">
              Features
            </a>
            <span className="cursor-default">Privacy</span>
            <span className="cursor-default">Terms</span>
            <span className="cursor-default">Contact</span>
          </nav>
        </div>
      </footer>
    </div>
  );
}
