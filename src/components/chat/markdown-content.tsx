/**
 * markdown-content.tsx — Renders assistant message text as real Markdown
 * (headings, lists, tables, bold/italic) and turns inline citations like
 * "(Progressive Overload)" into integrated citation chips instead of plain
 * parenthetical text.
 * Author: Monesh Abinav <monesh.abinav@vigilnz.com>
 * Date: 2026-09-24
 */
import ReactMarkdown, { type Components } from "react-markdown";
import remarkGfm from "remark-gfm";
import { BookOpenCheck } from "lucide-react";

// Parenthetical, Title-Case-ish phrases (letters/spaces/&/-, no sentence
// punctuation) are treated as citations — matches how the system prompts
// instruct the model to cite: "(Progressive Overload)" / "(Source 1)".
const CITATION_PATTERN = /\(([A-Z][A-Za-z0-9&,'\-\s]{5,80})\)/g;
// A Private Use Area codepoint — unlike \u0000, it survives Postgres text
// columns, JSON, and HTML round-trips intact (NUL bytes get silently
// mangled by Postgres once persisted, breaking this marker).
const CITATION_MARKER = "CITE";

function markCitations(text: string): string {
  return text.replace(CITATION_PATTERN, (_match, title: string) => `\`${CITATION_MARKER}${title}\``);
}

function CitationChip({ title }: { title: string }) {
  return (
    <span className="mx-0.5 inline-flex items-center gap-1 rounded-full border border-brand/30 bg-brand/5 px-2 py-0.5 align-middle text-[11px] font-medium text-brand">
      <BookOpenCheck className="size-3" />
      {title}
    </span>
  );
}

const components: Components = {
  p: ({ children }) => <p className="leading-relaxed">{children}</p>,
  ul: ({ children }) => <ul className="ml-4 list-disc space-y-1">{children}</ul>,
  ol: ({ children }) => <ol className="ml-4 list-decimal space-y-1">{children}</ol>,
  li: ({ children }) => <li className="leading-relaxed">{children}</li>,
  h1: ({ children }) => <h3 className="mt-1 text-base font-semibold">{children}</h3>,
  h2: ({ children }) => <h3 className="mt-1 text-sm font-semibold">{children}</h3>,
  h3: ({ children }) => <h4 className="mt-1 text-sm font-semibold">{children}</h4>,
  strong: ({ children }) => <strong className="font-semibold text-foreground">{children}</strong>,
  a: ({ children, href }) => (
    <a href={href} target="_blank" rel="noreferrer" className="text-brand underline underline-offset-2">
      {children}
    </a>
  ),
  table: ({ children }) => (
    <div className="overflow-x-auto rounded-lg border border-border">
      <table className="w-full border-collapse text-xs">{children}</table>
    </div>
  ),
  thead: ({ children }) => <thead className="bg-muted/50">{children}</thead>,
  th: ({ children }) => (
    <th className="border-b border-border px-2.5 py-1.5 text-left font-medium">{children}</th>
  ),
  td: ({ children }) => <td className="border-b border-border px-2.5 py-1.5 align-top">{children}</td>,
  code: ({ children }) => {
    const text = String(children);
    if (text.startsWith(CITATION_MARKER)) {
      return <CitationChip title={text.slice(CITATION_MARKER.length)} />;
    }
    return <code className="rounded bg-muted px-1 py-0.5 font-mono text-[0.85em]">{children}</code>;
  },
};

export function MarkdownContent({ text }: { text: string }) {
  return (
    <div className="flex flex-col gap-2 text-sm">
      <ReactMarkdown remarkPlugins={[remarkGfm]} components={components}>
        {markCitations(text)}
      </ReactMarkdown>
    </div>
  );
}
