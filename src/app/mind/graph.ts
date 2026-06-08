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
const trim = (s: string | undefined, n = 600) => (s || "").slice(0, n);

export function buildGraph(dreams: any[], contemps: any[], feed: any): Graph {
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

  const deg: Record<string, number> = {};
  for (const l of links) { deg[l.source] = (deg[l.source] || 0) + 1; deg[l.target] = (deg[l.target] || 0) + 1; }
  for (const n of nodes) if (n.type === "theme") n.val = 4 + (deg[n.id] || 0) * 0.4;

  return {
    meta: { stats, counts: { dreams: dreams.length, contemplations: contemps.length, activity: activity.length, themes: Object.keys(THEMES).length, nodes: nodes.length, links: links.length } },
    nodes,
    links,
  };
}
