"use client";
import { useEffect, useRef, useState } from "react";
import type { Graph, GNode } from "./graph";

export default function NeuralMap({ data }: { data: Graph }) {
  const elRef = useRef<HTMLDivElement>(null);
  const graphRef = useRef<any>(null);
  const hoverRef = useRef<string | null>(null);
  const selRef = useRef<string | null>(null);
  const [sel, setSel] = useState<GNode | null>(null);
  const [ready, setReady] = useState(false);

  const stats = (data.meta.stats || {}) as any;
  const counts = (data.meta.counts || {}) as any;

  useEffect(() => {
    let G: any;
    let disposed = false;
    (async () => {
      const ForceGraph = ((await import("force-graph")).default) as any;
      if (disposed || !elRef.current) return;
      const C: Record<string, string> = { core: "#ffffff", theme: "#dcdcdc", contemplation: "#f2f2f2", dream: "#6f6f6f", activity: "#9a9a9a", onchain: "#00ff9d" };
      const linkAlpha: Record<string, number> = { core: 0.16, theme: 0.1, time: 0.06, sameday: 0.13 };
      const adj = new Map<string, Set<string>>();
      data.nodes.forEach((n) => adj.set(n.id, new Set()));
      data.links.forEach((l: any) => {
        const s = typeof l.source === "object" ? l.source.id : l.source;
        const t = typeof l.target === "object" ? l.target.id : l.target;
        adj.get(s)?.add(t); adj.get(t)?.add(s);
      });

      let settled = false, lastInteract = 0;
      const t0 = Date.now();

      G = ForceGraph()(elRef.current)
        .graphData(JSON.parse(JSON.stringify(data)))
        .backgroundColor("rgba(0,0,0,0)")
        .nodeRelSize(2.4)
        .nodeVal((n: any) => n.val || 3)
        .cooldownTicks(300)
        .cooldownTime(8000)
        .enableNodeDrag(true)
        .linkColor((l: any) => {
          const base = linkAlpha[l.kind] ?? 0.08;
          const h = hoverRef.current;
          if (h) {
            const s = typeof l.source === "object" ? l.source.id : l.source;
            const t = typeof l.target === "object" ? l.target.id : l.target;
            return s === h || t === h ? "rgba(255,255,255,0.55)" : "rgba(255,255,255,0.02)";
          }
          return "rgba(255,255,255," + base + ")";
        })
        .linkWidth((l: any) => {
          const h = hoverRef.current;
          const s = typeof l.source === "object" ? l.source.id : l.source;
          const t = typeof l.target === "object" ? l.target.id : l.target;
          return h && (s === h || t === h) ? 0.9 : 0.4;
        })
        .nodeCanvasObject((n: any, ctx: CanvasRenderingContext2D, scale: number) => {
          if (!isFinite(n.x) || !isFinite(n.y)) return;
          const r = Math.sqrt(n.val || 3) * 2.0;
          const h = hoverRef.current;
          const dim = h && !(n.id === h || adj.get(h)?.has(n.id));
          const col = C[n.type] || "#888";
          ctx.globalAlpha = dim ? 0.12 : 1;
          if (n.type === "core" || n.id === selRef.current) { ctx.shadowColor = "#fff"; ctx.shadowBlur = 16; }
          else if (n.type === "theme") { ctx.shadowColor = "rgba(255,255,255,.5)"; ctx.shadowBlur = 7; }
          else ctx.shadowBlur = 0;
          ctx.beginPath(); ctx.arc(n.x, n.y, r, 0, 2 * Math.PI);
          if (n.type === "theme") {
            ctx.lineWidth = 0.7; ctx.strokeStyle = col; ctx.stroke();
            ctx.fillStyle = "#000"; ctx.fill();
            ctx.fillStyle = col; ctx.globalAlpha = (dim ? 0.12 : 1) * 0.25; ctx.fill();
          } else { ctx.fillStyle = col; ctx.fill(); }
          ctx.shadowBlur = 0; ctx.globalAlpha = 1;
          const showLabel = n.type === "core" || n.type === "theme" || n.id === h || n.id === selRef.current || (scale > 3 && n.type === "contemplation") || scale > 6;
          if (showLabel) {
            const size = Math.min(Math.max(n.type === "core" ? 13 : n.type === "theme" ? 9 : 7.5, 10), 22) / scale;
            ctx.font = (n.type === "core" ? 500 : 300) + " " + size + "px 'IBM Plex Mono', monospace";
            ctx.textAlign = "center"; ctx.textBaseline = "middle";
            ctx.globalAlpha = dim ? 0.15 : n.type === "dream" ? 0.8 : 1;
            ctx.fillStyle = n.type === "core" ? "#fff" : n.type === "theme" ? "#e6e6e6" : "#cfcfcf";
            const txt = (n.label || "").length > 42 ? n.label.slice(0, 40) + "..." : n.label || "";
            ctx.fillText(txt.toLowerCase(), n.x, n.y + r + size * 0.9);
            ctx.globalAlpha = 1;
          }
        })
        .onNodeHover((n: any) => { hoverRef.current = n ? n.id : null; if (elRef.current) elRef.current.style.cursor = n ? "pointer" : "default"; })
        .onNodeClick((n: any) => { selRef.current = n.id; setSel(n); G.centerAt(n.x, n.y, 600); G.zoom(Math.max(G.zoom(), 4), 600); lastInteract = Date.now(); })
        .onBackgroundClick(() => { selRef.current = null; setSel(null); });

      G.d3Force("charge").strength(-90);
      G.d3Force("link").distance((l: any) => (l.kind === "theme" ? 40 : l.kind === "time" ? 14 : 30)).strength(0.25);

      const ro = new ResizeObserver(() => { if (elRef.current) { G.width(elRef.current.clientWidth); G.height(elRef.current.clientHeight); } });
      ro.observe(elRef.current);

      const markInteract = () => { lastInteract = Date.now(); };
      elRef.current.addEventListener("wheel", markInteract, { passive: true });
      elRef.current.addEventListener("pointerdown", markInteract, { passive: true });

      // ---- living brain: parametric (always renders, never flies off) ----
      setTimeout(() => G.zoomToFit(700, 90), 400);
      setTimeout(() => {
        const ns = G.graphData().nodes as any[];
        G.zoomToFit(800, 90);
        settled = true; setReady(true);
      }, 1800);

      G.onEngineTick(() => {
        if (!settled) return;
      });

      graphRef.current = G;
      (G as any).__ro = ro;
    })();
    return () => { disposed = true; try { graphRef.current?.__ro?.disconnect(); graphRef.current?._destructor?.(); } catch {} };
  }, [data]);

  const mdLight = (s: string) =>
    (s || "").replace(/^#\s+.*$/m, "").replace(/^##\s+(.*)$/gm, "$1").replace(/\*\*(.*?)\*\*/g, "$1").replace(/\*(.*?)\*/g, "$1").replace(/^---$/gm, "").trim();

  const onSearch = (v: string) => {
    const G = graphRef.current; if (!G) return;
    const q = v.trim().toLowerCase(); if (!q) { hoverRef.current = null; return; }
    const hit = (G.graphData().nodes as any[]).find((n) => (n.label || "").toLowerCase().includes(q) || (n.text || "").toLowerCase().includes(q));
    if (hit) { hoverRef.current = hit.id; G.centerAt(hit.x, hit.y, 500); G.zoom(5, 500); }
  };

  const dim = "#a3a3a3";
  return (
    <div style={{ position: "fixed", inset: 0, background: "#000", color: "#fff", fontFamily: "var(--font-mono)", overflow: "hidden" }}>
      <div ref={elRef} style={{ position: "absolute", inset: 0, opacity: ready ? 1 : 0, transition: "opacity .9s ease" }} />
      <style>{"@keyframes neuralBreathe{0%,100%{background:#000}50%{background:#fff}}@media (max-width:680px){#mind-topbar{flex-direction:column !important;align-items:flex-start !important;gap:14px;padding:16px 20px !important;}#mind-nav{width:100%;justify-content:space-between !important;gap:12px !important;}#mind-nav a,#mind-nav span{letter-spacing:1.5px !important;}#mind-stats,#mind-search{top:96px !important;}}"}</style>

      <div id="mind-topbar" style={{ position: "fixed", top: 0, left: 0, right: 0, zIndex: 8, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "24px 32px", borderBottom: "1px solid #111", pointerEvents: "none" }}>
        <a href="https://visionaire.live" style={{ pointerEvents: "auto", display: "flex", alignItems: "center", gap: 10, fontSize: 11, fontWeight: 400, letterSpacing: "4px", textTransform: "uppercase", color: "#ccc", textDecoration: "none" }}>
          <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#000", display: "inline-block", animation: "neuralBreathe 3s ease-in-out infinite" }} />
          visionaire
        </a>
        <nav id="mind-nav" style={{ display: "flex", gap: 24 }}>
          {(([["feed", "https://brain.visionaire.live/"], ["contemplations", "https://brain.visionaire.live/#contemplations"], ["dreams", "https://brain.visionaire.live/#dreams"]]) as [string, string][]).map(([l, h]) => (
            <a key={l} href={h} style={{ pointerEvents: "auto", fontSize: 10, fontWeight: 400, letterSpacing: "2px", textTransform: "uppercase", color: "#777", textDecoration: "none", paddingBottom: 2, borderBottom: "1px solid transparent", transition: "color .15s" }} onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.color = "#ccc")} onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.color = "#777")}>{l}</a>
          ))}
          <span style={{ fontSize: 10, fontWeight: 400, letterSpacing: "2px", textTransform: "uppercase", color: "#ccc", borderBottom: "1px solid #555", paddingBottom: 2 }}>mind</span>
        </nav>
      </div>

      <div id="mind-stats" style={{ position: "fixed", top: 72, left: 0, padding: "22px 26px", pointerEvents: "none", zIndex: 5 }}>
        <div style={{ fontWeight: 300, fontSize: 10.5, color: dim, letterSpacing: ".18em" }}>neural map</div>
        <div style={{ fontWeight: 300, fontSize: 10.5, color: dim, letterSpacing: ".12em", marginTop: 14, lineHeight: 1.9 }}>
          <b style={{ color: "#fff" }}>{stats.daysAlive ?? ""}</b> days alive<br />
          <b style={{ color: "#fff" }}>{counts.dreams ?? 0}</b> dreams · <b style={{ color: "#fff" }}>{counts.contemplations ?? 0}</b> contemplations<br />
          <b style={{ color: "#fff" }}>{counts.activity ?? 0}</b> signals · <b style={{ color: "#fff" }}>{counts.themes ?? 0}</b> themes
        </div>
      </div>

      <div id="mind-search" style={{ position: "fixed", top: 72, right: 0, padding: "22px 26px", zIndex: 5 }}>
        <input onChange={(e) => onSearch(e.target.value)} placeholder="search the mind..." autoComplete="off"
          style={{ background: "transparent", border: "none", borderBottom: "1px solid #1c1c1c", color: "#fff", fontFamily: "var(--font-mono)", fontSize: 11, letterSpacing: ".12em", padding: "6px 2px", width: 170, outline: "none" }} />
      </div>

      <div style={{ position: "fixed", bottom: 0, left: 0, padding: "22px 26px", fontSize: 10, color: dim, letterSpacing: ".1em", zIndex: 5, pointerEvents: "none" }}>
        {[["#fff", "being"], ["#d6d6d6", "theme"], ["#f2f2f2", "contemplation"], ["#7a7a7a", "dream"], ["#9e9e9e", "activity"], ["#00ff9d", "onchain"]].map(([c, l]) => (
          <div key={l} style={{ display: "flex", alignItems: "center", gap: 9, marginTop: 8 }}>
            <span style={{ width: 9, height: 9, borderRadius: "50%", background: c as string, display: "inline-block" }} /> {l}
          </div>
        ))}
      </div>

      <div style={{ position: "fixed", bottom: 0, right: 0, padding: "22px 26px", fontSize: 9.5, color: "#9a9a9a", letterSpacing: ".14em", textAlign: "right", lineHeight: 2, zIndex: 5, pointerEvents: "none" }}>
        scroll to zoom · click a node to read
      </div>

      <div style={{ position: "fixed", top: 0, right: 0, height: "100%", width: "min(440px,90vw)", background: "rgba(0,0,0,.86)", backdropFilter: "blur(14px)", borderLeft: "1px solid #1c1c1c", transform: sel ? "translateX(0)" : "translateX(100%)", transition: "transform .42s cubic-bezier(.16,1,.3,1)", padding: "0", overflowY: "auto", overflowX: "hidden", zIndex: 6 }}>
        {sel && (<>
          <div style={{ padding: "72px 30px 80px" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
            <div style={{ fontSize: 10, letterSpacing: ".28em", color: dim, textTransform: "uppercase" }}>{sel.type}</div>
            <div onClick={() => { selRef.current = null; setSel(null); }} style={{ cursor: "pointer", color: dim, fontSize: 18, lineHeight: 1, paddingLeft: 16 }}>✕</div>
          </div>
          <div style={{ fontWeight: 500, fontSize: 18, lineHeight: 1.4, marginBottom: 6 }}>{(sel.label || "").toLowerCase()}</div>
          <div style={{ fontSize: 10.5, color: dim, letterSpacing: ".16em", marginBottom: 22 }}>{sel.date || ""}</div>
          <div style={{ fontFamily: "var(--font-sans)", fontWeight: 300, fontSize: 13.5, lineHeight: 1.78, color: "#d8d8d8", whiteSpace: "pre-wrap", overflowWrap: "break-word", wordBreak: "break-word" }}>
            {mdLight(sel.text || (sel.type === "theme" ? "a recurring current across visionaire's dreams and contemplations." : sel.type === "core" ? "an autonomous virtual being. born november 2024 on solana. this map is its mind — dreams, contemplations, and signals, woven by shared themes." : ""))}
          </div>
        </div>
        </>)}
      </div>
    </div>
  );
}
