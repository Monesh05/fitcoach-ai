# generate_pptx.py - Builds the FitCoach AI project explainer deck.
# Author: Monesh Abinav <monesh.abinav@vigilnz.com>
# Date: 2026-09-25
from pptx import Presentation
from pptx.util import Inches, Pt, Emu
from pptx.dml.color import RGBColor
from pptx.enum.text import PP_ALIGN, MSO_ANCHOR
from pptx.enum.shapes import MSO_SHAPE
from pptx.oxml.ns import qn

INK = RGBColor(0x18, 0x1B, 0x1A)
PAPER = RGBColor(0xFA, 0xFA, 0xF8)
MUTED = RGBColor(0x6B, 0x70, 0x6E)
BORDER = RGBColor(0xE2, 0xE4, 0xE1)
BRAND = RGBColor(0x1F, 0x8A, 0x5F)
BRAND_SOFT = RGBColor(0xE6, 0xF3, 0xEC)
CARD = RGBColor(0xFF, 0xFF, 0xFF)

SLIDE_W = Inches(13.333)
SLIDE_H = Inches(7.5)

prs = Presentation()
prs.slide_width = SLIDE_W
prs.slide_height = SLIDE_H
BLANK = prs.slide_layouts[6]


def add_slide():
    slide = prs.slides.add_slide(BLANK)
    bg = slide.shapes.add_shape(MSO_SHAPE.RECTANGLE, 0, 0, SLIDE_W, SLIDE_H)
    bg.fill.solid()
    bg.fill.fore_color.rgb = PAPER
    bg.line.fill.background()
    bg.shadow.inherit = False
    slide.shapes._spTree.remove(bg._element)
    slide.shapes._spTree.insert(2, bg._element)
    return slide


def set_no_autofit(tf):
    el = tf._txBody.find(qn('a:bodyPr'))
    for tag in ('a:normAutofit', 'a:spAutoFit'):
        e = el.find(qn(tag))
        if e is not None:
            el.remove(e)
    el.append(el.makeelement(qn('a:noAutofit'), {}))


def textbox(slide, l, t, w, h, text, size=18, color=INK, bold=False, align=PP_ALIGN.LEFT,
            font="Georgia", anchor=MSO_ANCHOR.TOP, line_spacing=1.0, italic=False):
    box = slide.shapes.add_textbox(l, t, w, h)
    tf = box.text_frame
    tf.word_wrap = True
    set_no_autofit(tf)
    tf.vertical_anchor = anchor
    p = tf.paragraphs[0]
    p.alignment = align
    if line_spacing != 1.0:
        p.line_spacing = line_spacing
    run = p.add_run()
    run.text = text
    run.font.size = Pt(size)
    run.font.color.rgb = color
    run.font.bold = bold
    run.font.italic = italic
    run.font.name = font
    return box


def bullet_list(slide, l, t, w, h, items, size=14, color=INK, font="Calibri",
                 gap=6, marker="—", marker_color=None, bold_lead=True):
    box = slide.shapes.add_textbox(l, t, w, h)
    tf = box.text_frame
    tf.word_wrap = True
    set_no_autofit(tf)
    marker_color = marker_color or BRAND
    for i, item in enumerate(items):
        p = tf.paragraphs[0] if i == 0 else tf.add_paragraph()
        p.space_after = Pt(gap)
        p.line_spacing = 1.12
        r0 = p.add_run()
        r0.text = f"{marker}  "
        r0.font.size = Pt(size)
        r0.font.color.rgb = marker_color
        r0.font.bold = True
        r0.font.name = font
        if isinstance(item, tuple):
            lead, rest = item
            r1 = p.add_run()
            r1.text = lead
            r1.font.size = Pt(size)
            r1.font.color.rgb = color
            r1.font.bold = bold_lead
            r1.font.name = font
            if rest:
                r2 = p.add_run()
                r2.text = rest
                r2.font.size = Pt(size)
                r2.font.color.rgb = MUTED
                r2.font.name = font
        else:
            r1 = p.add_run()
            r1.text = item
            r1.font.size = Pt(size)
            r1.font.color.rgb = color
            r1.font.name = font
    return box


def rounded_card(slide, l, t, w, h, fill=CARD, line=BORDER, radius=0.06, shadow=False):
    shape = slide.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, l, t, w, h)
    try:
        shape.adjustments[0] = radius
    except Exception:
        pass
    shape.fill.solid()
    shape.fill.fore_color.rgb = fill
    shape.line.color.rgb = line
    shape.line.width = Pt(0.75)
    shape.shadow.inherit = False
    return shape


def kicker(slide, text, l=Inches(0.6), t=Inches(0.45)):
    textbox(slide, l, t, Inches(6), Inches(0.35), text.upper(), size=12.5, color=BRAND,
            bold=True, font="Calibri")


def footer(slide, n):
    textbox(slide, Inches(0.6), Inches(7.08), Inches(4), Inches(0.3), "FitCoach AI", size=9,
            color=MUTED, font="Calibri")
    textbox(slide, Inches(12.1), Inches(7.08), Inches(0.6), Inches(0.3), str(n), size=9,
            color=MUTED, font="Calibri", align=PP_ALIGN.RIGHT)


def divider(slide, l, t, w, color=BORDER, weight=0.75):
    ln = slide.shapes.add_connector(1, l, t, l + w, t)
    ln.line.color.rgb = color
    ln.line.width = Pt(weight)


def pill(slide, l, t, w, h, text, fill=BRAND_SOFT, text_color=BRAND, size=11.5):
    shape = slide.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, l, t, w, h)
    shape.adjustments[0] = 0.5
    shape.fill.solid()
    shape.fill.fore_color.rgb = fill
    shape.line.fill.background()
    shape.shadow.inherit = False
    tf = shape.text_frame
    tf.word_wrap = False
    tf.margin_left = Emu(0)
    tf.margin_right = Emu(0)
    tf.vertical_anchor = MSO_ANCHOR.MIDDLE
    p = tf.paragraphs[0]
    p.alignment = PP_ALIGN.CENTER
    r = p.add_run()
    r.text = text
    r.font.size = Pt(size)
    r.font.bold = True
    r.font.color.rgb = text_color
    r.font.name = "Calibri"
    return shape


# ---------------------------------------------------------------- Slide 1
s = add_slide()
accent = s.shapes.add_shape(MSO_SHAPE.RECTANGLE, 0, 0, Inches(0.18), SLIDE_H)
accent.fill.solid()
accent.fill.fore_color.rgb = BRAND
accent.line.fill.background()
accent.shadow.inherit = False

textbox(s, Inches(0.9), Inches(2.55), Inches(9), Inches(0.4), "PORTFOLIO PROJECT",
        size=13, color=BRAND, bold=True, font="Calibri")
textbox(s, Inches(0.85), Inches(2.95), Inches(11.5), Inches(1.5), "FitCoach AI",
        size=60, color=INK, bold=True, font="Georgia")
textbox(s, Inches(0.9), Inches(3.95), Inches(10.5), Inches(0.9),
        "An agentic, multimodal RAG fitness coach — grounded answers, real plans,\nbuilt and shipped end-to-end.",
        size=18, color=MUTED, font="Calibri", line_spacing=1.2)

divider(s, Inches(0.9), Inches(5.05), Inches(4.2), color=BORDER)
textbox(s, Inches(0.9), Inches(5.3), Inches(5.5), Inches(0.4), "fitcoach-ai-beta.vercel.app",
        size=13, color=INK, font="Calibri", bold=True)
textbox(s, Inches(0.9), Inches(5.68), Inches(5.5), Inches(0.4), "github.com/Monesh05/fitcoach-ai",
        size=13, color=MUTED, font="Calibri")

# ---------------------------------------------------------------- Slide 2 — What it is
s = add_slide()
kicker(s, "The Problem")
textbox(s, Inches(0.6), Inches(0.8), Inches(11.9), Inches(1.15),
        "Generic chatbots guess. Fitness advice should be grounded.", size=28, bold=True, font="Georgia")
textbox(s, Inches(0.6), Inches(2.05), Inches(11.5), Inches(0.55),
        "Ask ChatGPT for a workout plan and it improvises from training data with no way to check its work. "
        "FitCoach AI answers from a real, curated knowledge base — and can see.",
        size=15, color=MUTED, font="Calibri", line_spacing=1.2)

cards = [
    ("Personalized plans", "Onboarding captures goals, experience, equipment, and diet — the app auto-generates a "
                            "structured weekly training + nutrition plan from it."),
    ("Grounded Q&A", "Every fitness/nutrition answer is retrieved from a real reference corpus and cited, "
                      "not just generated from the model's memory."),
    ("Multimodal input", "Upload a meal photo for a macro estimate, or a lifting-form photo for a technique check "
                          "— the model actually looks at the image."),
    ("Tracks real progress", "Logs workouts, body weight, and progress photos over time, and can reason about "
                              "your trend when you ask questions."),
]
cw, ch, gap = Inches(5.55), Inches(1.65), Inches(0.25)
x0, y0 = Inches(0.6), Inches(2.75)
for i, (title, body) in enumerate(cards):
    col, row = i % 2, i // 2
    x = x0 + col * (cw + gap)
    y = y0 + row * (ch + gap)
    rounded_card(s, x, y, cw, ch)
    textbox(s, x + Inches(0.3), y + Inches(0.22), cw - Inches(0.6), Inches(0.4), title,
            size=16, bold=True, font="Georgia")
    textbox(s, x + Inches(0.3), y + Inches(0.68), cw - Inches(0.6), Inches(0.95), body,
            size=12.5, color=MUTED, font="Calibri", line_spacing=1.15)
footer(s, 2)

# ---------------------------------------------------------------- Slide 3 — Architecture overview
s = add_slide()
kicker(s, "How It's Built")
textbox(s, Inches(0.6), Inches(0.82), Inches(11.5), Inches(0.8), "End-to-end architecture",
        size=30, bold=True, font="Georgia")

stages = [
    ("User", "Chat UI + image upload\n(Next.js / Vercel AI SDK)"),
    ("Retrieve", "Hybrid RAG: pgvector\n+ full-text, fused (RRF)"),
    ("Reason", "12-tool agentic loop\n(OpenRouter LLMs)"),
    ("Respond", "Streamed, cited answer\n+ persisted history"),
]
bw, bh = Inches(2.65), Inches(1.55)
gap = Inches(0.42)
total_w = 4 * bw + 3 * gap
x = (SLIDE_W - total_w) / 2
y = Inches(2.15)
for i, (title, body) in enumerate(stages):
    bx = x + i * (bw + gap)
    card = rounded_card(s, bx, y, bw, bh, fill=BRAND_SOFT if i in (1, 2) else CARD)
    textbox(s, bx + Inches(0.22), y + Inches(0.18), bw - Inches(0.44), Inches(0.35), title,
            size=15, bold=True, color=BRAND if i in (1, 2) else INK, font="Georgia")
    textbox(s, bx + Inches(0.22), y + Inches(0.58), bw - Inches(0.44), Inches(0.9), body,
            size=11.5, color=MUTED, font="Calibri", line_spacing=1.15)
    if i < 3:
        arrow = s.shapes.add_shape(MSO_SHAPE.CHEVRON, bx + bw + Inches(0.06), y + bh / 2 - Inches(0.11),
                                    Inches(0.3), Inches(0.22))
        arrow.fill.solid()
        arrow.fill.fore_color.rgb = MUTED
        arrow.line.fill.background()
        arrow.shadow.inherit = False

textbox(s, Inches(0.6), Inches(4.15), Inches(11.5), Inches(0.4), "Storage & infra",
        size=15, bold=True, font="Georgia")
bullet_list(s, Inches(0.6), Inches(4.6), Inches(11.6), Inches(2.2), [
    ("Supabase (Postgres + pgvector) ", "— documents/chunks, chat history, profiles, generated plans, "
     "workout/weight/photo logs, all behind Row-Level Security so users only ever see their own data."),
    ("Supabase Auth ", "— email/password and Google OAuth; session cookies verified on every request via middleware."),
    ("Supabase Storage ", "— private buckets for uploaded images and progress photos, served through short-lived signed URLs."),
    ("OpenRouter ", "— LLM gateway so the app runs on free-tier models (text + vision), with a fallback chain per task."),
    ("Vercel ", "— hosting + CI/CD; every push to main redeploys the production app automatically."),
], size=13)
footer(s, 3)

# ---------------------------------------------------------------- Slide 4 — Hybrid + Multimodal RAG
s = add_slide()
kicker(s, "The Retrieval Layer")
textbox(s, Inches(0.6), Inches(0.82), Inches(11.5), Inches(0.8), "Hybrid RAG, not a single vector search",
        size=30, bold=True, font="Georgia")

lw = Inches(5.6)
rounded_card(s, Inches(0.6), Inches(1.8), lw, Inches(4.6))
textbox(s, Inches(0.9), Inches(2.05), lw - Inches(0.6), Inches(0.4), "Text retrieval", size=16, bold=True, font="Georgia")
bullet_list(s, Inches(0.9), Inches(2.55), lw - Inches(0.6), Inches(3.7), [
    ("Vector search ", "— pgvector cosine similarity over embedded document chunks (Gemini embeddings)."),
    ("Full-text search ", "— Postgres tsvector/GIN, catching exact-term matches vector search can miss."),
    ("Reciprocal Rank Fusion ", "— both ranked lists are merged into one, more robust than either alone."),
    ("Result: ", "answers cite real source chunks instead of the model's raw memory."),
], size=13)

rx = Inches(6.6)
rounded_card(s, rx, Inches(1.8), lw, Inches(4.6))
textbox(s, rx + Inches(0.3), Inches(2.05), lw - Inches(0.6), Inches(0.4), "Multimodal retrieval", size=16, bold=True, font="Georgia")
bullet_list(s, rx + Inches(0.3), Inches(2.55), lw - Inches(0.6), Inches(3.7), [
    ("Step 1 ", "— an uploaded image (meal, lift, form-check) is sent to a vision model for a text description."),
    ("Step 2 ", "— that description is used as the retrieval query into the same hybrid RAG pipeline."),
    ("Step 3 ", "— a second model call answers using the image analysis + retrieved reference material together."),
    ("Result: ", "\"critique my squat\" gets checked against real form-coaching content, not guessed."),
], size=13)
footer(s, 4)

# ---------------------------------------------------------------- Slide 5 — Agentic chat
s = add_slide()
kicker(s, "The Reasoning Layer")
textbox(s, Inches(0.6), Inches(0.82), Inches(11.5), Inches(0.8), "An agent with 12 tools, not one big prompt",
        size=30, bold=True, font="Georgia")
textbox(s, Inches(0.6), Inches(1.65), Inches(11.5), Inches(0.6),
        "The model decides what to do — retrieve documents, look up the user's plan, log a workout, pull recent "
        "progress — via a tool-calling loop (Vercel AI SDK), rather than following one fixed script.",
        size=15, color=MUTED, font="Calibri", line_spacing=1.2)

groups = [
    ("Knowledge", ["Search fitness/nutrition docs", "Multimodal image analysis"]),
    ("User context", ["Read profile & goals", "Read active plan"]),
    ("Progress", ["Log workout", "Log body weight", "Log progress photo", "Read recent logs"]),
    ("Planning", ["Generate a new plan", "Update targets"]),
    ("Safety", ["Guardrail / refusal checks", "Rate-limit awareness"]),
]
gw = Inches(2.2)
gap = Inches(0.19)
x0 = Inches(0.6)
y0 = Inches(2.55)
gh = Inches(3.85)
for i, (title, items) in enumerate(groups):
    x = x0 + i * (gw + gap)
    rounded_card(s, x, y0, gw, gh, fill=BRAND_SOFT)
    textbox(s, x + Inches(0.18), y0 + Inches(0.2), gw - Inches(0.36), Inches(0.4), title,
            size=13.5, bold=True, color=BRAND, font="Georgia")
    bullet_list(s, x + Inches(0.18), y0 + Inches(0.68), gw - Inches(0.36), gh - Inches(0.9), items,
                size=10.8, color=INK, marker="›", gap=5)
footer(s, 5)

# ---------------------------------------------------------------- Slide 6 — Product surface
s = add_slide()
kicker(s, "The Product")
textbox(s, Inches(0.6), Inches(0.82), Inches(11.5), Inches(0.8), "What the user actually sees",
        size=30, bold=True, font="Georgia")

feats = [
    ("Onboarding", "Goals, experience, equipment, diet — captured once, refined anytime from Profile."),
    ("Chat", "Streaming, markdown-formatted answers with citation chips, image attach, and drag-and-drop."),
    ("My Plans", "Auto-generated weekly training + nutrition plans, saved and browsable."),
    ("Progress", "Weight trend, workout log, and progress photos in one dashboard."),
]
cw = Inches(2.72)
gap = Inches(0.19)
x0 = Inches(0.6)
y0 = Inches(1.85)
ch = Inches(2.5)
for i, (title, body) in enumerate(feats):
    x = x0 + i * (cw + gap)
    rounded_card(s, x, y0, cw, ch)
    dot = s.shapes.add_shape(MSO_SHAPE.OVAL, x + Inches(0.22), y0 + Inches(0.22), Inches(0.16), Inches(0.16))
    dot.fill.solid()
    dot.fill.fore_color.rgb = BRAND
    dot.line.fill.background()
    dot.shadow.inherit = False
    textbox(s, x + Inches(0.22), y0 + Inches(0.5), cw - Inches(0.44), Inches(0.4), title,
            size=14.5, bold=True, font="Georgia")
    textbox(s, x + Inches(0.22), y0 + Inches(0.92), cw - Inches(0.44), ch - Inches(1.1), body,
            size=11.5, color=MUTED, font="Calibri", line_spacing=1.15)

textbox(s, Inches(0.6), Inches(4.65), Inches(11.5), Inches(0.4), "Design system", size=15, bold=True, font="Georgia")
textbox(s, Inches(0.6), Inches(5.1), Inches(11.6), Inches(1.5),
        "A single unified app shell (sidebar + mobile nav) shared across every authenticated page, built on a "
        "restrained near-black / off-white palette with one green accent reserved for primary actions and "
        "progress — deliberately not another neon \"AI startup\" template.",
        size=13.5, color=MUTED, font="Calibri", line_spacing=1.25)
footer(s, 6)

# ---------------------------------------------------------------- Slide 7 — Quality & safety
s = add_slide()
kicker(s, "Quality & Safety")
textbox(s, Inches(0.6), Inches(0.82), Inches(11.5), Inches(0.8), "Evaluated, not just vibe-checked",
        size=30, bold=True, font="Georgia")

lw = Inches(5.6)
rounded_card(s, Inches(0.6), Inches(1.8), lw, Inches(4.6))
textbox(s, Inches(0.9), Inches(2.05), lw - Inches(0.6), Inches(0.4), "Eval suite", size=16, bold=True, font="Georgia")
bullet_list(s, Inches(0.9), Inches(2.55), lw - Inches(0.6), Inches(3.7), [
    ("89 / 89 ", "hand-verified test items passing across retrieval and generation."),
    ("LLM-as-judge ", "scoring for faithfulness (is the answer grounded?) and safety."),
    ("Recall@K / MRR ", "measured for the retrieval layer specifically, not just end-to-end vibes."),
    ("Resumable runs ", "— checkpointed so a multi-day eval survives free-tier rate limits."),
], size=13)

rx = Inches(6.6)
rounded_card(s, rx, Inches(1.8), lw, Inches(4.6))
textbox(s, rx + Inches(0.3), Inches(2.05), lw - Inches(0.6), Inches(0.4), "Guardrails", size=16, bold=True, font="Georgia")
bullet_list(s, rx + Inches(0.3), Inches(2.55), lw - Inches(0.6), Inches(3.7), [
    ("Prompt-level ", "instructions constrain scope and tone (no medical diagnoses, no unsafe programming)."),
    ("Deterministic pattern layer ", "catches unsafe requests the prompt alone might miss."),
    ("Per-user rate limiting ", "protects shared free-tier API keys from abuse."),
    ("Row-Level Security ", "at the database layer as the real access-control boundary, not just app logic."),
], size=13)
footer(s, 7)

# ---------------------------------------------------------------- Slide 8 — Closing / stack recap
s = add_slide()
kicker(s, "Wrap-Up")
textbox(s, Inches(0.6), Inches(0.82), Inches(11.5), Inches(0.8), "Built solo, shipped live",
        size=30, bold=True, font="Georgia")
textbox(s, Inches(0.6), Inches(1.65), Inches(11.5), Inches(0.55),
        "Next.js, Vercel AI SDK, Supabase (Postgres + pgvector + Auth + Storage), OpenRouter — running "
        "entirely on free-tier infrastructure so it stays live for demos at no ongoing cost.",
        size=14.5, color=MUTED, font="Calibri", line_spacing=1.2)

why = [
    "Real retrieval architecture — hybrid search + RRF, not a single embeddings call",
    "Genuine multimodal grounding, not just an image captioned into a text prompt",
    "An agentic tool-use loop the model actually drives, not a scripted flow",
    "Production concerns handled: auth, RLS, rate limits, eval-driven bug fixes, live deploy",
]
bullet_list(s, Inches(0.6), Inches(2.55), Inches(11.6), Inches(2.6), why, size=15, gap=10)

divider(s, Inches(0.6), Inches(5.3), Inches(4.6))
textbox(s, Inches(0.6), Inches(5.55), Inches(6), Inches(0.4), "fitcoach-ai-beta.vercel.app", size=14, bold=True)
textbox(s, Inches(0.6), Inches(5.95), Inches(6), Inches(0.4), "github.com/Monesh05/fitcoach-ai", size=13, color=MUTED)
footer(s, 8)

prs.save("FitCoach_AI_Project_Overview.pptx")
print("done")
