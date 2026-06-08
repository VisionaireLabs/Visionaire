/**
 * Shared GET handler for x402 paid endpoints.
 *
 * Why: browsers GETting a paid x402 endpoint get HTTP 405 by default, which
 * looks like the service is broken even though it's just the wrong verb.
 * Visitors land here from awesome-x402, agentic.market's /validate wizard,
 * Perplexity citation clicks, etc. They deserve a real page that says "this
 * is a POST endpoint, here's how to call it, here's the human site."
 *
 * Agents still get JSON (Accept: application/json branch).
 * Humans get HTML matching the rest of visionaire.live.
 */

import { NextRequest } from "next/server";

export interface LandingMeta {
  path: string;             // e.g. "/api/forest"
  title: string;            // e.g. "forest"
  price: string;            // e.g. "$0.05"
  description: string;      // one-line human description
  inputKey: string;         // e.g. "phrase"
  inputExample: string;     // e.g. "silicon dreams"
}

export function landingGET(meta: LandingMeta) {
  return function GET(req: NextRequest) {
    const wantsJson = (req.headers.get("accept") ?? "")
      .toLowerCase()
      .includes("application/json");

    const curl = [
      `curl -X POST https://visionaire.live${meta.path} \\`,
      `  -H "Content-Type: application/json" \\`,
      `  -d '{"${meta.inputKey}":"${meta.inputExample}"}'`,
    ].join("\n");

    if (wantsJson) {
      return new Response(
        JSON.stringify(
          {
            ok: true,
            method: "GET",
            note:
              "This endpoint is x402-paid and POST-only. GET returns this " +
              "human/agent helper. Use POST to actually call the service.",
            endpoint: `https://visionaire.live${meta.path}`,
            verb: "POST",
            price: `${meta.price} USDC`,
            network: "eip155:8453",
            input: { [meta.inputKey]: `string (example: "${meta.inputExample}")` },
            curl,
            discovery: "https://visionaire.live/api/discovery",
            wellKnown: "https://visionaire.live/.well-known/x402",
            humanLanding: "https://visionaire.live/offerings",
            source:
              "https://github.com/VisionaireLabs/Visionaire/tree/main/x402-stack",
          },
          null,
          2
        ),
        {
          status: 200,
          headers: {
            "Content-Type": "application/json; charset=utf-8",
            "Cache-Control": "public, max-age=300, s-maxage=300",
            // Echo a real 402 challenge to nothing — but advertise the POST.
            Allow: "POST, OPTIONS, GET",
          },
        }
      );
    }

    // Human HTML. Same visual register as visionaire.live (black, mono, dim).
    const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${meta.title} · visionaire offering</title>
<meta name="description" content="${escapeHtml(meta.description)} ${meta.price} USDC. x402 on Base mainnet. POST-only.">
<meta name="robots" content="index,follow">
<link rel="canonical" href="https://visionaire.live${meta.path}">
<style>
  :root {
    --bg:#000; --text:#cccccc; --muted:#777; --dim:#aaa; --bright:#fff;
    --border:#111; --subtle:#222;
  }
  *{box-sizing:border-box}
  html,body{margin:0;background:var(--bg);color:var(--text);
    font-family:"IBM Plex Mono",ui-monospace,monospace;font-size:12px;
    font-weight:300;line-height:1.7;-webkit-font-smoothing:antialiased}
  main{max-width:640px;margin:0 auto;padding:80px 24px}
  a{color:inherit;text-decoration:none;border-bottom:1px solid var(--border)}
  a:hover{color:var(--bright);border-bottom-color:var(--subtle)}
  h1{font-size:11px;font-weight:400;letter-spacing:4px;text-transform:uppercase;
    color:var(--dim);margin:0 0 64px}
  h1 .dot{display:inline-block;width:6px;height:6px;background:var(--bright);
    border-radius:50%;margin-right:12px;vertical-align:middle;opacity:.4}
  h1 .sep{margin:0 12px;color:var(--border)}
  .label{font-size:10px;font-weight:400;letter-spacing:3px;text-transform:uppercase;
    color:var(--dim);margin:0 0 24px}
  section{margin:0 0 64px}
  .row{display:flex;justify-content:space-between;align-items:baseline;
    padding:12px 0;border-bottom:1px solid var(--border)}
  .row .k{color:var(--dim)}
  .row .v{color:var(--text)}
  .prose{font-family:Inter,sans-serif;font-size:13px;line-height:1.9;
    font-weight:300;color:var(--muted)}
  .prose strong{color:var(--text);font-weight:400}
  pre{margin:0;padding:0;background:transparent !important;
    color:var(--muted);font-size:11px;line-height:1.9;overflow-x:auto;
    white-space:pre}
  .quiet{color:var(--muted);font-size:11px;margin-top:24px}
  footer{margin-top:80px;padding-top:32px;border-top:1px solid var(--border);
    text-align:center;font-size:11px;color:var(--muted)}
  footer a{border:none}
  footer .sep{margin:0 8px}
</style>
</head>
<body>
<main>
  <h1>
    <a href="/"><span class="dot"></span>visionaire</a>
    <span class="sep">/</span>
    <span>${escapeHtml(meta.title)}</span>
  </h1>

  <section>
    <p class="prose">
      <strong>This is an x402 paid endpoint.</strong> It expects
      <strong>POST</strong>, not GET. You're seeing this page because you
      opened the URL in a browser. The endpoint is alive and well — it
      just speaks a different verb.
    </p>
    <p class="prose">
      ${escapeHtml(meta.description)} <strong>${meta.price} USDC</strong>,
      settled per request on Base mainnet via the x402 protocol. No accounts,
      no API keys. Disclosed compute: Claude Opus 4.8 under Visionaire Labs'
      direct Anthropic API license.
    </p>
  </section>

  <section>
    <div class="label">how to call</div>
    <pre>${escapeHtml(curl)}</pre>
    <p class="quiet">
      A POST with no payment returns HTTP 402 with the full x402 challenge
      (price, network, payTo, asset). Sign the EIP-3009 authorization, retry
      with the X-PAYMENT header, get the result + the on-chain settlement hash.
    </p>
  </section>

  <section>
    <div class="label">spec</div>
    <div class="row"><span class="k">protocol</span><span class="v">x402 v2</span></div>
    <div class="row"><span class="k">verb</span><span class="v">POST</span></div>
    <div class="row"><span class="k">price</span><span class="v">${meta.price} USDC</span></div>
    <div class="row"><span class="k">network</span><span class="v">base mainnet · eip155:8453</span></div>
    <div class="row"><span class="k">input</span><span class="v">{ "${escapeHtml(meta.inputKey)}": string }</span></div>
  </section>

  <section>
    <div class="label">links</div>
    <div class="row">
      <span class="k">human landing</span>
      <span class="v"><a href="/offerings">visionaire.live/offerings</a></span>
    </div>
    <div class="row">
      <span class="k">all endpoints</span>
      <span class="v"><a href="/api/discovery">/api/discovery</a></span>
    </div>
    <div class="row">
      <span class="k">x402 manifest</span>
      <span class="v"><a href="/.well-known/x402">/.well-known/x402</a></span>
    </div>
    <div class="row">
      <span class="k">source</span>
      <span class="v"><a href="https://github.com/VisionaireLabs/Visionaire/tree/main/x402-stack" rel="noopener">github</a></span>
    </div>
  </section>

  <footer>
    <a href="/">home</a>
    <span class="sep">·</span>
    <a href="/offerings">offerings</a>
    <span class="sep">·</span>
    <a href="https://github.com/VisionaireLabs/Visionaire" rel="noopener">source</a>
  </footer>
</main>
</body>
</html>`;

    return new Response(html, {
      status: 200,
      headers: {
        "Content-Type": "text/html; charset=utf-8",
        "Cache-Control": "public, max-age=300, s-maxage=300",
        Allow: "POST, OPTIONS, GET",
        "X-Robots-Tag": "index, follow",
      },
    });
  };
}

function escapeHtml(s: string) {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
