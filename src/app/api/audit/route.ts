/**
 * POST /api/audit
 *
 * Pay $0.10 USDC (100000 atomic units) via x402.
 * Unauthenticated requests receive HTTP 402 with payment requirements.
 * After payment is verified, we run Impeccable's deterministic anti-pattern
 * detector against the submitted HTML/CSS and return a structured report.
 *
 * Engine: pbakaus/impeccable v2.x — 25 deterministic rules across typography,
 * color, layout, motion, and quality. No LLM in the loop on this endpoint:
 * findings are reproducible and the cost stays predictable. Apache 2.0
 * upstream; we are first-party operator on the audit-as-a-service layer.
 *
 * Input:
 *   { "html": string }   raw HTML to scan (1–200KB), or
 *   { "url":  string }   public URL we fetch first (HTML response, no JS execution)
 *
 * Output:
 *   {
 *     score:     number,           // 0–100, deterministic
 *     findings:  Finding[],        // Impeccable detector output
 *     summary:   { critical, warning, info, total },
 *     engine:    { name, version },
 *     ms:        number
 *   }
 *
 * Provenance: deterministic detector + Visionaire's hosted infra. Not
 * reselling Impeccable — selling the audit-as-a-service surface that runs it
 * for agents who don't want to ship a Node runtime + jsdom themselves.
 */

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { withX402 } from "@x402/next";
import { declareDiscoveryExtensionWithMethod as declareDiscoveryExtension } from "@/lib/bazaar-fix";
import { getX402Server, PAY_TO, NETWORK } from "@/lib/x402";
import { landingGET } from "@/lib/get-landing";
import { detectHtml } from "impeccable";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { randomUUID } from "node:crypto";

export const runtime = "nodejs";

export const GET = landingGET({
  path: "/api/audit",
  title: "audit",
  price: "$0.10",
  description:
    "Frontend design audit. Deterministic detection of 25+ AI-slop and quality anti-patterns. No LLM in the loop, reproducible findings.",
  inputKey: "url",
  inputExample: "https://example.com",
});
export const maxDuration = 30;

const MAX_HTML_BYTES = 200_000; // 200KB ceiling — keeps audit cost predictable

const RequestSchema = z
  .object({
    html: z.string().min(1).max(MAX_HTML_BYTES).optional(),
    url: z.string().url().optional(),
  })
  .refine((v) => v.html || v.url, {
    message: "either 'html' or 'url' is required",
  });

type Finding = {
  antipattern: string;
  name: string;
  description: string;
  file?: string;
  line?: number;
  snippet?: string;
};

// Severity weights — Impeccable's detector doesn't ship severity tags, so we
// classify by antipattern id. Conservative bias: visual-tells (gradient text,
// purple palette, pure-black) are critical because they're the AI-slop fingerprint
// the whole skill exists to fight. Layout/typography quality issues are warnings.
const CRITICAL_PATTERNS = new Set([
  "overused-font",
  "ai-color-palette",
  "gradient-text",
  "pure-black-white",
  "bounce-easing",
  "nested-cards",
  "side-tab-border",
  "dark-glow",
]);

const INFO_PATTERNS = new Set([
  "line-length",
  "skipped-heading",
  "emoji-only",
]);

function severityOf(antipattern: string): "critical" | "warning" | "info" {
  if (CRITICAL_PATTERNS.has(antipattern)) return "critical";
  if (INFO_PATTERNS.has(antipattern)) return "info";
  return "warning";
}

async function fetchHtml(url: string): Promise<string> {
  const res = await fetch(url, {
    redirect: "follow",
    headers: {
      "user-agent":
        "Visionaire-Audit/1.0 (+https://visionaire.live/api/audit)",
      accept: "text/html,application/xhtml+xml",
    },
    signal: AbortSignal.timeout(10_000),
  });
  if (!res.ok) {
    throw new Error(`fetch failed: ${res.status} ${res.statusText}`);
  }
  const ctype = res.headers.get("content-type") ?? "";
  if (!ctype.includes("html")) {
    throw new Error(`unexpected content-type: ${ctype}`);
  }
  const text = await res.text();
  if (text.length > MAX_HTML_BYTES) {
    return text.slice(0, MAX_HTML_BYTES);
  }
  return text;
}

async function handler(request: NextRequest): Promise<NextResponse> {
  const t0 = Date.now();

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "invalid JSON body" }, { status: 400 });
  }

  const parsed = RequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.errors[0]?.message ?? "invalid request" },
      { status: 400 },
    );
  }

  let html: string;
  let source: "html" | "url";
  try {
    if (parsed.data.html) {
      html = parsed.data.html;
      source = "html";
    } else {
      html = await fetchHtml(parsed.data.url!);
      source = "url";
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : "fetch failed";
    return NextResponse.json({ error: message }, { status: 422 });
  }

  // Impeccable's detectHtml() reads from disk so jsdom can resolve linked
  // stylesheets relative to the file. Vercel /tmp is writable and lambda-local
  // — fine for a single request.
  const tmpFile = path.join(os.tmpdir(), `audit-${randomUUID()}.html`);
  let findings: Finding[] = [];
  try {
    await fs.writeFile(tmpFile, html, "utf8");
    findings = (await detectHtml(tmpFile)) as Finding[];
  } catch (err) {
    const message = err instanceof Error ? err.message : "detector failed";
    return NextResponse.json({ error: message }, { status: 500 });
  } finally {
    fs.unlink(tmpFile).catch(() => {});
  }

  // Strip the temp path from findings — caller doesn't care about our /tmp.
  for (const f of findings) {
    delete f.file;
  }

  const summary = { critical: 0, warning: 0, info: 0, total: findings.length };
  for (const f of findings) {
    summary[severityOf(f.antipattern)]++;
  }

  // Score: start at 100, subtract weighted penalties, floor at 0.
  // Critical = 12, warning = 5, info = 2.
  const penalty =
    summary.critical * 12 + summary.warning * 5 + summary.info * 2;
  const score = Math.max(0, Math.min(100, 100 - penalty));

  return NextResponse.json({
    score,
    findings: findings.map((f) => ({
      ...f,
      severity: severityOf(f.antipattern),
    })),
    summary,
    source,
    engine: { name: "impeccable", version: "2.1.x" },
    ms: Date.now() - t0,
  });
}

export const POST = withX402(
  handler,
  {
    accepts: [
      {
        scheme: "exact",
        price: "$0.10",
        network: NETWORK,
        payTo: PAY_TO,
      },
    ],
    description:
      "Visionaire is an autonomous virtual being on Base. Five agent-native offerings: forest-bathing riffs ($0.05), contemplations ($0.25), frontend design audit ($0.10), aesthetic portraits ($0.50), and the Oracle ($2.00). This endpoint is the frontend design audit and AI-slop detector: deterministic static analysis catches 25+ design anti-patterns (gradient text, AI color palettes, nested cards, bounce easing, overused fonts, low contrast). Submit HTML or a URL; receive findings + score. Powered by the open-source Impeccable engine. No LLM in the loop, reproducible. Pay per request via x402 (Base USDC).",
    mimeType: "application/json",
    extensions: {
      ...declareDiscoveryExtension({
        bodyType: "json",
        input: { url: "https://example.com" },
        inputSchema: {
          type: "object",
          properties: {
            html: {
              type: "string",
              minLength: 1,
              maxLength: MAX_HTML_BYTES,
              description:
                "Raw HTML to scan, max 200KB. Provide either 'html' or 'url'.",
            },
            url: {
              type: "string",
              format: "uri",
              description:
                "Public URL to fetch and scan (HTML response only, no JS execution). Provide either 'html' or 'url'.",
            },
          },
        },
        output: {
          example: {
            score: 52,
            findings: [
              {
                antipattern: "ai-color-palette",
                name: "AI color palette",
                description:
                  "Purple/violet gradients and cyan-on-dark are the most recognizable tells of AI-generated UIs.",
                snippet: "Purple/violet accent colors detected",
                severity: "critical",
              },
              {
                antipattern: "overused-font",
                name: "Overused font",
                description:
                  "Inter, Roboto, Open Sans, Lato, Montserrat, and Arial are used on millions of sites.",
                snippet: "Primary font: inter",
                severity: "critical",
              },
            ],
            summary: { critical: 4, warning: 0, info: 0, total: 4 },
            source: "url",
            engine: { name: "impeccable", version: "2.1.x" },
            ms: 1480,
          },
          schema: {
            type: "object",
            properties: {
              score: {
                type: "number",
                description:
                  "0–100 design quality score. 100 = no findings. Critical findings carry 12pt penalties.",
              },
              findings: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    antipattern: { type: "string" },
                    name: { type: "string" },
                    description: { type: "string" },
                    snippet: { type: "string" },
                    severity: {
                      type: "string",
                      enum: ["critical", "warning", "info"],
                    },
                  },
                },
              },
              summary: {
                type: "object",
                properties: {
                  critical: { type: "number" },
                  warning: { type: "number" },
                  info: { type: "number" },
                  total: { type: "number" },
                },
              },
              source: { type: "string", enum: ["html", "url"] },
              engine: {
                type: "object",
                properties: {
                  name: { type: "string" },
                  version: { type: "string" },
                },
              },
              ms: { type: "number" },
            },
            required: ["score", "findings", "summary", "engine", "ms"],
          },
        },
      }),
    },
  },
  getX402Server(),
);
