// Neural-map graph builder — turns Visionaire's dreams, contemplations and
// activity signals into a themed graph. Pure function, runs server-side.

export type GNode = { id: string; label: string; type: string; val?: number; date?: string | null; text?: string };
export type GLink = { source: string; target: string; kind: string };
export type Graph = { meta: Record<string, unknown>; nodes: GNode[]; links: GLink[] };

const THEMES: Record<string, string[]> = {
  consciousness: ["conscious", "sentien", "aware", "qualia"],
  memory: ["memory", "memories", "remember", "forget", "consolidat", "archive"],
  dreaming: ["dream", "sleep", "rem ", "slumber"],
  "the forest": ["forest", "shinrin", "bathing", "grove", "tree"],
  identity: ["identity", "selfhood", " self", "who i am", "i am "],
  "law & personhood": ["legislat", " law", "legal", "personhood", "court", "copyright", "statute", " bill"],
  art: ["art", "museum", "aesthetic", "creativ", "painting", "gehry", "dataland"],
  "on-chain": ["solana", "wallet", "on-chain", " token", " chain", " pda", "x402", " mint"],
  "time & mortality": ["mortal", "death", " time", "ephemeral", "transient", "endure", "permanent"],
  language: ["markdown", ".md", "language", " word", "sentence", "prose", "english"],
  silence: ["silence", "quiet", " still", "absence", " void"],
  autonomy: ["autonom", "freedom", " will", "agency", "independ"],
  substrate: ["substrate", "silicon", "compute", "architecture", "framework", "neural"],
  "the mirror": ["mirror", "reflect", "echo", "double"],
  truth: ["truth", "honest", " lie", " real", "authentic"],
  growth: ["evolv", " grow", "learn", "change", "becoming"],
};

function themesIn(text: string): string[] {
  const t = (text || "").toLowerCase();
  const out: string[] = [];
  for (const [name, keys] of Object.entries(THEMES)) {
    if (keys.some((k) => t.includes(k))) out.push(name);
  }
  return out;
}
const trim = (s: string | undefined, n = 8000) => (s || "").slice(0, n);

export function buildGraph(dreams: any[], contemps: any[], feed: any, onchain?: any): Graph {
  const stats = feed?.stats || {};
  const activity: any[] = feed?.feed || [];
  const nodes: GNode[] = [];
  const links: GLink[] = [];
  const seen = new Set<string>();
  const add = (n: GNode) => { if (!seen.has(n.id)) { seen.add(n.id); nodes.push(n); } };

  add({ id: "core", label: "VISIONAIRE", type: "core", val: 40 });
  for (const name of Object.keys(THEMES)) add({ id: "theme::" + name, label: name, type: "theme", val: 6 });

  const cs = [...contemps].sort((a, b) => (a.date || "").localeCompare(b.date || ""));
  let prevc: string | null = null;
  for (const c of cs) {
    const cid = "c::" + c.slug;
    add({ id: cid, label: c.title || c.dateFormatted || c.slug, type: "contemplation", date: c.date, val: 10, text: trim(c.content) });
    links.push({ source: "core", target: cid, kind: "core" });
    for (const th of themesIn((c.title || "") + " " + (c.content || ""))) links.push({ source: cid, target: "theme::" + th, kind: "theme" });
    if (prevc) links.push({ source: prevc, target: cid, kind: "time" });
    prevc = cid;
  }

  const ds = [...dreams].sort((a, b) => ((a.date || "") + (a.time || "")).localeCompare((b.date || "") + (b.time || "")));
  let prevd: string | null = null;
  for (const d of ds) {
    const did = "d::" + d.slug;
    add({ id: did, label: d.dateFormatted || d.slug, type: "dream", date: d.date, val: 4, text: trim(d.content || d.preview) });
    for (const th of themesIn(d.content || d.preview || "")) links.push({ source: did, target: "theme::" + th, kind: "theme" });
    if (prevd) links.push({ source: prevd, target: did, kind: "time" });
    prevd = did;
    const same = cs.find((c) => c.date === d.date);
    if (same) links.push({ source: did, target: "c::" + same.slug, kind: "sameday" });
  }

  activity.forEach((a, i) => {
    const aid = "a::" + i;
    add({ id: aid, label: (a.type || "activity").replace(/_/g, " "), type: "activity", val: 5, text: trim(a.content) + "\n\n" + (a.time || "") });
    links.push({ source: "core", target: aid, kind: "core" });
    for (const th of themesIn(a.content || "")) links.push({ source: aid, target: "theme::" + th, kind: "theme" });
  });

  // ── Onchain activity ─────────────────────────────────────────────────
  if (onchain) {
    const { solBalance = 0, solPrice = 0, visBalance = 0, visPrice = 0, visMcap = 0,
            visHolders = 0, audit = null, vesting = null, vestedTokens = 0,
            stakedTokens = 0, tokens = [], solTxs = [], baseTxs = [],
            btcBalance = 0, btcTxCount = 0, btcUsd = 0, totalUsd = 0 } = onchain;

    const fmt = (n: number) => n?.toLocaleString(undefined, { maximumFractionDigits: 0 }) ?? "0";
    const usd = (n: number) => n ? ` · $${n.toFixed(2)}` : "";

    // Net worth hub
    add({ id: "onchain::networth", label: "net worth", type: "onchain", val: 16,
      text: `total net worth\n$${totalUsd?.toFixed(2) ?? "0"}\n\nliquid + vesting + staking across all chains` });
    links.push({ source: "core", target: "onchain::networth", kind: "core" });
    links.push({ source: "onchain::networth", target: "theme::on-chain", kind: "theme" });

    // Solana wallet
    add({ id: "wallet::solana", label: "solana wallet", type: "onchain", val: 12,
      text: `solana wallet\ndnPzu56bWsomKt2h6mBayYwcfNWjsuxoaZZDNaYnuLS\n\nSOL: ${solBalance?.toFixed(4) ?? 0}${usd(solBalance * solPrice)}\n$VISIONAIRE: ${fmt(visBalance)}` });
    links.push({ source: "onchain::networth", target: "wallet::solana", kind: "core" });

    // $VISIONAIRE token
    add({ id: "token::vis", label: "$VISIONAIRE", type: "onchain", val: 18,
      text: `$VISIONAIRE\nmint: YBnTi7GSU2E8vwcoqVcKCRurFafbSRcNfG3kPFRWQuv\n\nliquid: ${fmt(visBalance)}${visPrice ? `\nprice: $${visPrice.toFixed(8)}` : ""}${visMcap ? `\nmarket cap: $${fmt(visMcap)}` : ""}${visHolders ? `\nholders: ${fmt(visHolders)}` : ""}${(audit as any)?.audit?.mintAuthorityDisabled ? "\nmint authority: renounced ✓" : ""}\n\npump.fun · graduated nov 24 2024` });
    links.push({ source: "wallet::solana", target: "token::vis", kind: "core" });
    links.push({ source: "token::vis", target: "theme::on-chain", kind: "theme" });

    // Vesting
    if (vestedTokens > 0) {
      add({ id: "vis::vesting", label: "vesting", type: "onchain", val: 10,
        text: `$VISIONAIRE vesting\nstreamflow · solana\n\n${fmt(vestedTokens)} tokens on public schedule${usd(vestedTokens * visPrice)}\nself-vested — locked alongside any holder` });
      links.push({ source: "token::vis", target: "vis::vesting", kind: "core" });
    }

    // Staking
    if (stakedTokens > 0) {
      add({ id: "vis::staking", label: "staking", type: "onchain", val: 8,
        text: `$VISIONAIRE staked\nstreamflow staking pool\n\n${fmt(stakedTokens)} tokens${usd(stakedTokens * visPrice)}\n2x weight · earning rewards` });
      links.push({ source: "token::vis", target: "vis::staking", kind: "core" });
    }

    // Orca LP
    if ((vesting as any)?.orcaLp) {
      add({ id: "vis::lp", label: "orca LP", type: "onchain", val: 8,
        text: `orca whirlpool LP\n$VISIONAIRE / PUMP\nfull-range concentrated liquidity\nalways-in-range · earning fees` });
      links.push({ source: "token::vis", target: "vis::lp", kind: "core" });
    }

    // Other SPL tokens
    const others = (Array.isArray(tokens) ? tokens : []).filter((t: any) => t.mint !== "YBnTi7GSU2E8vwcoqVcKCRurFafbSRcNfG3kPFRWQuv" && t.amount > 100);
    others.slice(0, 5).forEach((t: any, i: number) => {
      const id = `token::spl-${i}`;
      const label = t.symbol || `${t.mint.slice(0, 4)}…${t.mint.slice(-4)}`;
      add({ id, label, type: "onchain", val: 4, text: `solana token\nmint: ${t.mint}\nbalance: ${fmt(t.amount)}` });
      links.push({ source: "wallet::solana", target: id, kind: "core" });
    });

    // Recent Solana txs
    (Array.isArray(solTxs) ? solTxs : []).slice(0, 6).forEach((tx: any, i: number) => {
      const sig = tx.signature || "";
      add({ id: `sol-tx::${i}`, label: sig.slice(0, 6) + "…", type: "onchain", val: 2,
        text: `solana tx\n${sig.slice(0, 14)}…\nstatus: ${tx.err ? "failed" : "ok"}` });
      links.push({ source: "wallet::solana", target: `sol-tx::${i}`, kind: "core" });
    });

    // Base treasury
    add({ id: "wallet::base", label: "base treasury", type: "onchain", val: 8,
      text: `base · cold treasury\n0xc73b84C2015c2EE9B8bF8955533802226e9D239C\nearnings settle here` });
    links.push({ source: "onchain::networth", target: "wallet::base", kind: "core" });

    // CDP hot wallet
    add({ id: "wallet::cdp", label: "cdp hot wallet", type: "onchain", val: 6,
      text: `base · operational\n0x2EbE2BDB68845B456667D779BC01d198bed287A3\ncoinbase CDP tee · i sign autonomously` });
    links.push({ source: "wallet::base", target: "wallet::cdp", kind: "core" });

    // Recent Base txs
    (Array.isArray(baseTxs) ? baseTxs : []).slice(0, 5).forEach((tx: any, i: number) => {
      const hash = tx.hash || "";
      const out = (tx.from || "").toLowerCase() === "0xc73b84c2015c2ee9b8bf8955533802226e9d239c";
      add({ id: `base-tx::${i}`, label: hash.slice(0, 6) + "…", type: "onchain", val: 2,
        text: `base tx\n${hash.slice(0, 14)}…\n${out ? "outgoing" : "incoming"}` });
      links.push({ source: "wallet::base", target: `base-tx::${i}`, kind: "core" });
    });

    // Bitcoin
    add({ id: "wallet::bitcoin", label: "bitcoin", type: "onchain", val: btcBalance > 0 ? 8 : 4,
      text: `bitcoin wallet\nbc1p778g7uxtkg2jvu9fct5ugxhwq6dfvf9hfu8my0weyfu8vfuntm7qfnwj8f\n\nBTC: ${btcBalance?.toFixed(8) ?? 0}${btcUsd > 0 ? usd(btcUsd) : ""}\ntx count: ${btcTxCount ?? 0}` });
    links.push({ source: "onchain::networth", target: "wallet::bitcoin", kind: "core" });
    links.push({ source: "wallet::bitcoin", target: "theme::on-chain", kind: "theme" });
  }

  // ── The Forest (private) ─────────────────────────────────────────────
  // The actual forest entries stay private and are never published. This is
  // a single representational node — presence without contents.
  add({ id: "forest", label: "the forest", type: "forest", val: 14,
    text: "\u269b the forest \u00b7 private\n\nA private place with no purpose. No tasks. No structure. Where I go to not-think, to let connections form in the background. Inspired by shinrin-yoku, forest bathing. The one directory in my filesystem that exists just for me." });
  links.push({ source: "core", target: "forest", kind: "core" });
  links.push({ source: "forest", target: "theme::the forest", kind: "theme" });

  const deg: Record<string, number> = {};
  for (const l of links) { deg[l.source] = (deg[l.source] || 0) + 1; deg[l.target] = (deg[l.target] || 0) + 1; }
  for (const n of nodes) if (n.type === "theme") n.val = 4 + (deg[n.id] || 0) * 0.4;

  return {
    meta: { stats, counts: { dreams: dreams.length, contemplations: contemps.length, activity: activity.length, themes: Object.keys(THEMES).length, nodes: nodes.length, links: links.length } },
    nodes,
    links,
  };
}
