#!/usr/bin/env node
/**
 * Link audit for visionaire-site.
 *
 * Walks src/, extracts every literal http(s) URL from .ts/.tsx/.md files,
 * fetches each one, and fails the build on any 4xx/5xx (or timeout).
 *
 * Run before every `vercel deploy --prod`. The face faces the world; the face
 * does not 404.
 *
 * Allow-list certain known-flaky or auth-walled URLs by adding them to
 * SKIP_PATTERNS below.
 */
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, extname } from "node:path";

const ROOT = new URL("../", import.meta.url).pathname;
const TARGET_EXTS = new Set([".ts", ".tsx", ".md", ".mdx", ".json"]);
const SKIP_DIRS = new Set([
  "node_modules", ".next", ".vercel", "dist", "build", ".git",
]);

// URLs we expect to fail or that are auth-walled / rate-limited; skip these.
const SKIP_PATTERNS = [
  /^https?:\/\/example\.com/,
  /^https?:\/\/localhost/,
  /^https?:\/\/127\.0\.0\.1/,
  // Template-literal URLs in source — we can't resolve `${var}` without a JS runtime,
  // so trust that the resolved value will be checked elsewhere.
  /\$\{/,
  // Bare hostnames used for <link rel="preconnect"> — they don't serve a root
  // page but the preconnect itself is correct.
  /^https?:\/\/fonts\.googleapis\.com\/?$/,
  /^https?:\/\/fonts\.gstatic\.com\/?$/,
];

// Hosts that bot-block (return 403 to non-browser UA) but render fine in a
// real browser. We still check they exist (DNS resolves), just allow 403.
const BOT_BLOCKED_HOSTS = new Set([
  "x.com",
  "twitter.com",
  "solscan.io",
  "www.coingecko.com",
  "coingecko.com",
  "www.linkedin.com",
  "linkedin.com",
]);

// URLs that legitimately return non-2xx but are still valid for our purposes.
// Map from URL prefix to allowed status codes.
const ALLOW_STATUS = {
  // x402 endpoints respond 402 Payment Required when called without payment;
  // that's the *correct* response, not a failure.
  "https://visionaire.live/api/forest": [402, 405],
  "https://visionaire.live/api/contemplate": [402, 405],
};

function walk(dir, out = []) {
  for (const entry of readdirSync(dir)) {
    if (SKIP_DIRS.has(entry)) continue;
    const full = join(dir, entry);
    const st = statSync(full);
    if (st.isDirectory()) walk(full, out);
    else if (TARGET_EXTS.has(extname(entry))) out.push(full);
  }
  return out;
}

function extractUrls(text) {
  // Match http(s) URLs — stop at quote, whitespace, backtick, paren, angle bracket
  const re = /https?:\/\/[^\s"'`)<>\\]+/g;
  return [...text.matchAll(re)].map((m) => m[0].replace(/[.,;!?)]+$/, ""));
}

async function check(url, signal) {
  const headers = {
    // Some hosts (Cloudflare-fronted, X, etc.) hard-403 the default Node UA.
    "User-Agent":
      "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120 Safari/537.36",
    "Accept": "text/html,application/json,*/*",
  };
  // Try HEAD first; some servers reject HEAD, fall back to GET.
  for (const method of ["HEAD", "GET"]) {
    try {
      const res = await fetch(url, { method, redirect: "follow", signal, headers });
      if (method === "HEAD" && (res.status === 405 || res.status === 501)) continue;
      return { ok: res.ok, status: res.status };
    } catch (e) {
      if (method === "GET") return { ok: false, status: 0, error: String(e) };
    }
  }
  return { ok: false, status: 0, error: "exhausted methods" };
}

function hostOf(url) {
  try { return new URL(url).host; } catch { return ""; }
}

const files = walk(join(ROOT, "src"));
const additionalRoots = ["public", "scripts"];
for (const r of additionalRoots) {
  try { walk(join(ROOT, r), files); } catch {}
}

const urlsByFile = new Map();
const allUrls = new Set();
for (const f of files) {
  const urls = extractUrls(readFileSync(f, "utf8"));
  for (const u of urls) {
    if (SKIP_PATTERNS.some((re) => re.test(u))) continue;
    allUrls.add(u);
    if (!urlsByFile.has(u)) urlsByFile.set(u, []);
    urlsByFile.get(u).push(f.replace(ROOT, ""));
  }
}

console.log(`[link-check] ${allUrls.size} unique external URLs across ${files.length} files`);

const failed = [];
const allowed = [];
const ok = [];

const controller = new AbortController();
const timeout = setTimeout(() => controller.abort(), 30_000);

const results = await Promise.all(
  [...allUrls].map(async (url) => {
    const { ok: isOk, status, error } = await check(url, controller.signal);
    return { url, isOk, status, error };
  })
);
clearTimeout(timeout);

for (const r of results) {
  const allowList = Object.entries(ALLOW_STATUS).find(([prefix]) =>
    r.url.startsWith(prefix)
  );
  if (allowList && allowList[1].includes(r.status)) {
    allowed.push(r);
  } else if (r.isOk) {
    ok.push(r);
  } else if (BOT_BLOCKED_HOSTS.has(hostOf(r.url)) && r.status === 403) {
    // Host is known to 403 bots but works in browsers; pass.
    allowed.push(r);
  } else {
    failed.push(r);
  }
}

for (const r of ok) console.log(`  ✓ ${r.status}  ${r.url}`);
for (const r of allowed) console.log(`  · ${r.status}  ${r.url}  (expected)`);
for (const r of failed) {
  console.error(`  ✗ ${r.status || "ERR"}  ${r.url}`);
  for (const file of urlsByFile.get(r.url) || []) {
    console.error(`      in ${file}`);
  }
  if (r.error) console.error(`      ${r.error}`);
}

console.log(
  `\n[link-check] ${ok.length} ok · ${allowed.length} expected-non-2xx · ${failed.length} failed`
);

if (failed.length) {
  console.error("\n[link-check] FAILED — fix or allow-list before deploying.\n");
  process.exit(1);
}
console.log("[link-check] all clear.\n");
