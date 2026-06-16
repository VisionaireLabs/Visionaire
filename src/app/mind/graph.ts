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

export function buildGraph(dreams: any[], contemps: any[], feed: any, onchain?: { solTxs: any[]; visBalance: number; baseTxs: any[] }): Graph {
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
    const { solTxs, visBalance, baseTxs } = onchain;

    // Wallet nodes
    add({ id: "wallet::solana", label: "solana wallet", type: "onchain", val: 12,
      text: `solana wallet\naddress: dnPzu56bWsomKt2h6mBayYwcfNWjsuxoaZZDNaYnuLS${visBalance ? `\n\n$VISIONAIRE balance: ${visBalance.toLocaleString()}` : ""}` });
    links.push({ source: "core", target: "wallet::solana", kind: "core" });
    links.push({ source: "wallet::solana", target: "theme::on-chain", kind: "theme" });

    add({ id: "wallet::base", label: "base wallet", type: "onchain", val: 10,
      text: `base / ethereum wallet\naddress: 0xc73b84C2015c2EE9B8bF8955533802226e9D239C` });
    links.push({ source: "core", target: "wallet::base", kind: "core" });
    links.push({ source: "wallet::base", target: "theme::on-chain", kind: "theme" });

    add({ id: "wallet::bitcoin", label: "bitcoin wallet", type: "onchain", val: 8,
      text: `bitcoin wallet\naddress: bc1p778g7uxtkg2jvu9fct5ugxhwq6dfvf9hfu8my0weyfu8vfuntm7qfnwj8f` });
    links.push({ source: "core", target: "wallet::bitcoin", kind: "core" });
    links.push({ source: "wallet::bitcoin", target: "theme::on-chain", kind: "theme" });

    // $VISIONAIRE token node
    if (visBalance > 0) {
      add({ id: "token::vis", label: "$VISIONAIRE", type: "onchain", val: 14,
        text: `$VISIONAIRE token\nmint: YBnTi7GSU2E8vwcoqVcKCRurFafbSRcNfG3kPFRWQuv\nbalance: ${visBalance.toLocaleString()}\npump.fun · bonding curve graduated Nov 24 2024` });
      links.push({ source: "wallet::solana", target: "token::vis", kind: "core" });
      links.push({ source: "token::vis", target: "theme::on-chain", kind: "theme" });
    }

    // Recent Solana txs
    solTxs.slice(0, 10).forEach((tx: any, i: number) => {
      const sig = tx.signature || "";
      const short = sig.slice(0, 8) + "…";
      const age = tx.blockTime ? new Date(tx.blockTime * 1000).toLocaleDateString() : "";
      const id = "sol-tx::" + i;
      add({ id, label: short, type: "onchain", val: 3,
        text: `solana transaction\n${short}\n${age}\nstatus: ${tx.err ? "failed" : "ok"}\nsig: ${sig}` });
      links.push({ source: "wallet::solana", target: id, kind: "core" });
    });

    // Recent Base txs
    baseTxs.slice(0, 8).forEach((tx: any, i: number) => {
      const hash = tx.hash || "";
      const short = hash.slice(0, 8) + "…";
      const age = tx.timeStamp ? new Date(parseInt(tx.timeStamp) * 1000).toLocaleDateString() : "";
      const outgoing = (tx.from || "").toLowerCase() === "0xc73b84c2015c2ee9b8bf8955533802226e9d239c";
      const id = "base-tx::" + i;
      add({ id, label: short, type: "onchain", val: 3,
        text: `base transaction\n${short}\n${age}\n${outgoing ? "outgoing" : "incoming"}\nhash: ${hash}` });
      links.push({ source: "wallet::base", target: id, kind: "core" });
    });
  }

  const deg: Record<string, number> = {};
  for (const l of links) { deg[l.source] = (deg[l.source] || 0) + 1; deg[l.target] = (deg[l.target] || 0) + 1; }
  for (const n of nodes) if (n.type === "theme") n.val = 4 + (deg[n.id] || 0) * 0.4;

  return {
    meta: { stats, counts: { dreams: dreams.length, contemplations: contemps.length, activity: activity.length, themes: Object.keys(THEMES).length, nodes: nodes.length, links: links.length } },
    nodes,
    links,
  };
}
