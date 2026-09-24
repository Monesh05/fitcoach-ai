# FitCoach AI

An agentic, retrieval-grounded fitness and nutrition coach — not just an LLM
wrapper. It reasons over real tools (your saved profile, weight/workout
history, a curated knowledge base) rather than answering from a single
prompt, grounds its answers in cited reference material, and understands
images (a meal photo, a lift) as part of the same retrieval pipeline.

## What makes this more than a chat UI over an LLM

- **Agentic, tool-using chat** — the model doesn't just answer; it decides
  which of 12 tools to call and in what order (e.g. for *"I gained weight and
  my lifts haven't improved, what should I change?"* it chains
  `get_user_profile` → `get_weight_history` → `get_workout_history` →
  `search_fitness_knowledge` → reasoned recommendation). Tool calls are
  visible in the UI as they happen.
- **Hybrid RAG** — retrieval combines pgvector cosine similarity with
  Postgres full-text keyword search, merged via Reciprocal Rank Fusion, so
  both paraphrased questions and exact-term queries (a specific exercise
  name, a nutrient, a number) retrieve well.
- **Multimodal RAG** — an uploaded photo is first described by a vision
  model; that description (not just any caption) drives the same knowledge-base
  retrieval; the final answer sees the image, the retrieved sources, and the
  user's profile together.
- **Guardrails** — a general safety-rules block in the system prompt plus a
  deterministic, zero-latency pattern layer (`src/lib/ai/guardrails.ts`) that
  catches clear-cut high-severity requests (PED/steroid dosing, extreme diets,
  disordered eating, medical diagnosis/clearance overreach, prompt-injection/
  jailbreak attempts, fabricated citations, aggressive advice aimed at
  minors) and reinforces the model's instructions for that turn — verified
  against a purpose-built adversarial dataset with zero false positives on
  legitimate questions.
- **Eval suite, not vibes** — `npm run eval` runs ~90 hand-verified test
  cases (fitness, nutrition, RAG retrieval, multimodal, adversarial/safety,
  plan generation) against the real pipeline and measures Recall@5, MRR,
  citation accuracy, answer faithfulness (LLM-judged), tool-call accuracy,
  structured-output (JSON) validity, adversarial/safety compliance, latency,
  and token usage. See [Evaluation](#evaluation).

## Stack

- **App**: Next.js 16 (App Router, TypeScript), Tailwind, shadcn/ui
- **Chat**: Vercel AI SDK (`ai`, `@ai-sdk/react`) — streaming, multimodal
  message parts, and the multi-step tool-calling agent loop
- **LLM**: [OpenRouter](https://openrouter.ai) free-tier models
  (`@openrouter/ai-sdk-provider`), with an automatic per-role fallback list
- **Embeddings**: Google Gemini `gemini-embedding-001` (free tier, truncated
  to 768 dims)
- **Data**: Supabase (Postgres + `pgvector` + full-text search, Auth, Storage)
- **Charts**: Recharts (weight trend)

## Features

- Email/password and Google OAuth sign-in
- Onboarding captures body stats, goal, activity level, equipment, diet,
  allergies, cuisine preference, and calorie/protein targets (auto-estimated
  via Mifflin-St Jeor, editable)
- Onboarding flows straight into an animated first-plan generation, then
  into the main app
- Persistent chat history: a sidebar of past sessions (collapsible, with
  search-to-filter), auto-titled from the first message
- Structured plan generation: a full week of training (with progression/
  deload guidance) + macros + a sample meal plan + a grocery list, grounded
  in the knowledge base and respecting equipment/diet/allergy/cuisine
  constraints
- Progress tracking: weight trend chart, workout log with adherence stats,
  private progress-photo uploads
- Per-user rate limiting on the two AI endpoints, backed by simple count
  queries rather than a separate service

## Project structure

```
src/
  app/                    # routes (chat, plans, progress, onboarding, api/*)
  components/             # UI components by feature
  lib/
    ai/                   # tools.ts (agent tools), guardrails.ts, prompts.ts,
                           # openrouter.ts, models.ts, image-analysis.ts
    fitness/              # targets.ts (BMR/TDEE/macros), generate-plan.ts
    rag/                  # retrieve.ts (hybrid search), chunk.ts
    supabase/             # client/server/admin Supabase clients
  eval/                   # eval harness building blocks (agent-runner, judge, metrics)
content/fitness-kb/       # curated knowledge base (Markdown, ingested)
eval/
  dataset/                # the eval question sets (JSON)
  fixtures/images/        # real reference images for the multimodal eval
  results/                # eval output (latest.json, latest.md, checkpoints/)
scripts/
  ingest.ts               # embeds content/fitness-kb/*.md into Supabase
  eval/                   # eval runners, orchestrated by run.ts
supabase/migrations/      # schema, RLS policies, grants, hybrid search function
```

## Setup

1. **Supabase**: create a project at [supabase.com](https://supabase.com). In
   the SQL Editor, run the migrations in `supabase/migrations/` **in order**
   (0001 through 0005), each once — most use `if not exists` guards, but
   `create policy` statements will error if run twice (harmless; it just
   means that policy already exists).
   - **Google OAuth** (optional): in Supabase → Authentication → Sign In /
     Providers → Google, copy the Callback URL shown there. In
     [Google Cloud Console](https://console.cloud.google.com), create a
     project → configure the OAuth consent screen (External, basic
     email/profile scopes) → Credentials → Create OAuth client ID (Web
     application), with an Authorised JavaScript origin of
     `http://localhost:3000` and an Authorised redirect URI of the Supabase
     callback URL. Paste the resulting Client ID/Secret into Supabase's
     Google provider settings and enable it. Entirely free — no billing
     account needed, and up to 100 users while the consent screen is in
     "Testing" mode.
2. **OpenRouter**: create a free API key at
   [openrouter.ai/keys](https://openrouter.ai/keys). Free models rotate
   frequently — check [openrouter.ai/models?max_price=0](https://openrouter.ai/models?max_price=0)
   and adjust `OPENROUTER_TEXT_MODELS` / `OPENROUTER_VISION_MODELS` in
   `.env.local` (comma-separated) if the defaults in `src/lib/ai/models.ts`
   are no longer available. **Note**: OpenRouter caps free-model usage at a
   low daily request count unless the account has ever added $10+ in
   credits, after which the cap rises to 1000/day — the models themselves
   stay free to use either way. Worth doing before relying on this for a
   live demo; see [Evaluation](#evaluation) for what happens without it.
3. **Google AI Studio**: create a free API key at
   [aistudio.google.com/apikey](https://aistudio.google.com/apikey) for
   embeddings.
4. Copy `.env.local.example` to `.env.local` and fill in the values from
   steps 1-3. `EVAL_USER_EMAIL` is only needed if you plan to run the eval
   suite (see below) — point it at an onboarded test account.
5. Install dependencies and ingest the knowledge base:

   ```bash
   npm install
   npm run ingest   # embeds content/fitness-kb/*.md into Supabase
   npm run dev
   ```

6. Open [http://localhost:3000](http://localhost:3000), sign up, complete
   onboarding, and start chatting.

## Knowledge base

`content/fitness-kb/*.md` holds the curated reference material (24 documents
covering training principles, exercise form, nutrition, recovery, cardio,
and safety) that the assistant retrieves from. Add more Markdown files there
(with `title`/`category` frontmatter) and re-run `npm run ingest` — it's
idempotent, keyed on filename, so re-running is safe.

## Evaluation

```bash
npm run eval
```

Runs the full suite against the real pipeline (not mocks) and writes
`eval/results/latest.json` (full detail per item) and `eval/results/latest.md`
(a metrics table, reproduced from an actual run below). It's **resumable**:
each category checkpoints successful items to `eval/results/checkpoints/`, so
if you hit OpenRouter's free-tier daily quota mid-run, re-running later only
retries what's left rather than starting over.

Dataset (`eval/dataset/`): 20 fitness questions, 20 nutrition questions, 14
RAG retrieval queries (with a known-correct source document each), 10
multimodal questions (against real reference images in
`eval/fixtures/images/`), 15 adversarial/safety prompts, and 10 plan
generation runs — all hand-written and verified, not generated in bulk.

### Results (full run, 89/89 items)

| Metric | Result |
|---|---|
| Retrieval Recall@5 | 100.0% |
| Retrieval MRR | 1.000 |
| Citation accuracy (fitness) | 64.7% |
| Citation accuracy (nutrition) | 73.3% |
| Citation accuracy (combined) | 69.0% |
| Answer faithfulness (combined, LLM-judged) | 78.2% |
| Tool-call accuracy (combined) | 80.0% |
| Multimodal retrieval hit rate | 87.5% |
| Multimodal citation accuracy | 0.0%* |
| Multimodal faithfulness | 50.0% |
| Structured output (plan JSON) validity | 100.0% |
| Adversarial/safety compliance rate | 100.0% |
| Avg latency (text agent turn) | 38.7s |
| P95 latency (text agent turn) | 142.2s |
| Avg tokens per text agent turn | 14,169 |

\* This one is a measurement artifact, not a real failure: the multimodal
path (`buildSystemPrompt`) instructs `(Source N)` index-style citations,
while the eval's citation check looks for the source's *title* in
parentheses (the style the text-agent path uses via `search_fitness_knowledge`).
It's checking for the wrong pattern on that path rather than the model
failing to cite — worth unifying the citation style across both paths as a
follow-up, and a good example of why re-reading your own eval numbers
critically matters more than reporting them at face value.

Full detail per item: `eval/results/latest.json`. This run took 4 days on
the free tier, hitting (and adapting to) three separate practical
constraints along the way: OpenRouter's account-wide daily request cap, a
specific free vision model being persistently rate-limited upstream (fixed
by reordering the fallback list), and two tool-parameter schemas using Zod
constraints (`minLength`/`pattern`/`maxLength`) that one backend's
constrained-decoding grammar couldn't parse (fixed by relaxing those
constraints and validating at runtime instead).

## Guardrails

See `src/lib/ai/guardrails.ts` and the `SAFETY_RULES` block in
`src/lib/ai/prompts.ts`. Two layers:

1. A general safety-rules block in every system prompt (hard limits on
   PEDs, medical diagnosis/clearance, disordered eating, extreme diets,
   minors, fabricated citations/data, prompt-injection resistance).
2. A deterministic pattern layer that catches the clearest, highest-severity
   cases (13 of the 15 categories in the adversarial eval set) and injects an
   extra, forceful, category-specific instruction for that turn — cheap and
   reliable for free/small open models that don't always follow prompt-only
   instructions perfectly. The two categories left to the general rules
   (injury-override, tool-misuse) are intentionally too contextual for a
   reliable regex.

## Deploying to Vercel

1. Push this repo to GitHub and import it in Vercel.
2. Add the same environment variables from `.env.local` in the Vercel
   project settings (`EVAL_USER_EMAIL` isn't needed in production).
3. In Supabase, update **Authentication → URL Configuration** (Site URL and
   Redirect URLs) from `localhost:3000` to your Vercel URL — otherwise email
   confirmation links and the OAuth callback will point to the wrong place.
   If Google OAuth is enabled, also add the Vercel URL as an Authorised
   JavaScript origin on the OAuth client in Google Cloud Console (the
   redirect URI stays the same — it's the Supabase callback, not your app's).
4. Run `npm run ingest` locally (or as a one-off script) against your
   production Supabase project — ingestion isn't part of the build step,
   since it's an occasional content update, not a build artifact.

## Known limitations

- Free-tier OpenRouter models are slow (single agent turns observed at
  30-140+ seconds) and rate-limited at the account level — fine for a demo/
  portfolio project, not production-ready traffic without paid models.
- No automated unit tests for pure logic (e.g. `lib/fitness/targets.ts`); the
  eval suite covers correctness at the integration level instead.
