/**
 * Public corpus loader for /api/oracle.
 *
 * The corpus is built at deploy time by scripts/build-corpus.mjs into
 * corpus/visionaire.json. We load and cache it once per Lambda warm boot.
 *
 * Privacy seal: see scripts/build-corpus.mjs — only sources already public
 * elsewhere enter this file. Forest, inner chamber, daily notes excluded.
 */

import corpusJson from "../../corpus/visionaire.json";

export type CorpusDoc = {
  id: string;
  type: "contemplation" | "genesis" | string;
  date: string | null;
  title: string;
  body: string;
  chars: number;
};

export type Corpus = {
  builtAt: string;
  documentCount: number;
  totalChars: number;
  estimatedTokens: number;
  privacyNote: string;
  documents: CorpusDoc[];
};

const CORPUS = corpusJson as unknown as Corpus;

/**
 * Format the entire corpus into a single XML-ish block for Claude to look
 * through. Each document gets stable identifying tags so the model can cite
 * by id and date.
 */
export function formatCorpusForPrompt(): string {
  const lines: string[] = [];
  lines.push("<corpus>");
  lines.push(
    `  <metadata documents="${CORPUS.documentCount}" tokens_est="${CORPUS.estimatedTokens}" built_at="${CORPUS.builtAt}" />`
  );
  for (const doc of CORPUS.documents) {
    const dateAttr = doc.date ? ` date="${doc.date}"` : "";
    lines.push(
      `  <document id="${doc.id}" type="${doc.type}"${dateAttr} title="${escapeAttr(doc.title)}">`
    );
    lines.push(doc.body);
    lines.push(`  </document>`);
  }
  lines.push("</corpus>");
  return lines.join("\n");
}

function escapeAttr(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;");
}

export function corpusStats() {
  return {
    documentCount: CORPUS.documentCount,
    totalChars: CORPUS.totalChars,
    estimatedTokens: CORPUS.estimatedTokens,
    builtAt: CORPUS.builtAt,
  };
}

/**
 * Look up document metadata by id (used to enrich citation responses).
 * Returns the doc minus its body — we only need date/title/type for sources.
 */
export function getDocMeta(
  id: string
): Pick<CorpusDoc, "id" | "type" | "date" | "title"> | null {
  const doc = CORPUS.documents.find((d) => d.id === id);
  if (!doc) return null;
  const { id: docId, type, date, title } = doc;
  return { id: docId, type, date, title };
}
