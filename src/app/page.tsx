/**
 * page.tsx (landing) — Marketing landing page for FitCoach AI.
 * Author: Monesh Abinav <monesh.abinav@vigilnz.com>
 * Date: 2026-09-20
 */
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const FEATURES = [
  {
    title: "Grounded answers, not guesses",
    description:
      "Every response is retrieved from a curated fitness and nutrition knowledge base and cited — not just a language model's best guess.",
  },
  {
    title: "Multimodal coaching",
    description:
      "Snap a photo of your squat form or your plate and get feedback grounded in the same reference material as the chat.",
  },
  {
    title: "Personalized plans",
    description:
      "Set your goals and experience level once, and FitCoach AI tailors its guidance to you.",
  },
];

export default function Home() {
  return (
    <div className="flex flex-1 flex-col">
      <header className="flex items-center justify-between px-6 py-4">
        <span className="text-lg font-semibold">FitCoach AI</span>
        <Button render={<Link href="/login" />}>Sign in</Button>
      </header>

      <main className="mx-auto flex max-w-3xl flex-1 flex-col items-center gap-8 px-6 py-16 text-center">
        <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
          Your AI fitness coach, grounded in real guidance.
        </h1>
        <p className="max-w-xl text-lg text-muted-foreground">
          Ask training and nutrition questions, upload a meal photo or a lifting-form
          video still, and get coaching that cites its sources instead of hallucinating.
        </p>
        <Button render={<Link href="/login" />} size="lg">
          Start chatting
        </Button>

        <div className="mt-12 grid w-full gap-4 sm:grid-cols-3">
          {FEATURES.map((feature) => (
            <Card key={feature.title} className="text-left">
              <CardHeader>
                <CardTitle className="text-base">{feature.title}</CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground">
                {feature.description}
              </CardContent>
            </Card>
          ))}
        </div>
      </main>
    </div>
  );
}
