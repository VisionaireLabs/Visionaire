"use client";
import { useEffect, useRef } from "react";
import type { Graph } from "./mind/graph";

// Interactive, slowly-orbiting preview of the neural map for the homepage.
// Hover / drag / zoom enabled; idle motion keeps it alive. The corner link
// opens the full /mind experience.
export default function MindPreview({ data }: { data: Graph }) {
  const elRef = useRef<HTMLDivElement>(null);
  const gRef = useRef<any>(null);
  const hoverRef = useRef<string | null>(null);

  useEffect(() => {
    let disposed = false;
    (async () => {
      const ForceGraph = ((await import("force-graph")).default) as any;
      if (disposed || !elRef.current) return;
      const C: Record<string, string> = { core: "#ffffff", theme: "#dcdcdc", contemplation: "#f2f2f2", dream: "#6f6f6f", activity: "#9a9a9a" };
      const adj = new Map<string, Set<string>>();
      data.nodes.forEach((n) => adj.set(n.id, new Set()));
      data.links.forEach((l: any) => {
        const s = typeof l.source === "object" ? l.source.id : l.source;
        const t = typeof l.target === "object" ? l.target.id : l.target;
        adj.get(s)?.add(t); adj.get(t)?.add(s);
      });

      const G = ForceGraph()(elRef.current)
        .graphData(JSON.parse(JSON.stringify(data)))
        .backgroundColor("rgba(0,0,0,0)")
        .nodeRelSize(2.0)
        .nodeVal((n: any) => n.val || 3)
        .cooldownTicks(Infinity) // never freeze — keeps the orbit alive
        .minZoom(0.4).maxZoom(8)
        .linkColor((l: any) => {
          const h = hoverRef.current;
          if (h) {
            const s = typeof l.source === "object" ? l.source.id : l.source;
            const t = typeof l.target === "object" ? l.target.id : l.target;
            return s === h || t === h ? "rgba(255,255,255,0.5)" : "rgba(255,255,255,0.015)";
          }
          return "rgba(255,255,255," + ({ core: 0.12, theme: 0.08, time: 0.05, sameday: 0.1 }[l.kind as string] ?? 0.06) + ")";
        })
        .linkWidth(0.3)
        .onNodeHover((n: any) => { hoverRef.current = n ? n.id : null; if (elRef.current) elRef.current.style.cursor = n ? "pointer" : "grab"; })
        .nodeCanvasObject((n: any, ctx: CanvasRenderingContext2D, scale: number) => {
          const r = Math.sqrt(n.val || 3) * 1.7;
          const h = hoverRef.current;
          const dim = h && !(n.id === h || adj.get(h)?.has(n.id));
          ctx.globalAlpha = dim ? 0.12 : 1;
          ctx.beginPath();
          ctx.arc(n.x, n.y, r, 0, 2 * Math.PI);
          if (n.type === "theme") { ctx.strokeStyle = C.theme; ctx.lineWidth = 0.6; ctx.stroke(); }
          else { ctx.fillStyle = C[n.type] || "#888"; ctx.fill(); }
          if (n.type === "core" || n.type === "theme" || n.id === h) {
            const size = Math.min(Math.max(n.type === "core" ? 9 : 6.5, 8), 14) / scale;
            ctx.font = (n.type === "core" ? 500 : 300) + " " + size + "px 'IBM Plex Mono', monospace";
            ctx.textAlign = "center"; ctx.textBaseline = "middle";
            ctx.fillStyle = n.type === "core" ? "#fff" : "#cfcfcf";
            ctx.fillText((n.label || "").toLowerCase(), n.x, n.y + r + size);
          }
          ctx.globalAlpha = 1;
        });

      G.d3Force("charge").strength(-70);
      G.d3Force("link").distance((l: any) => (l.kind === "theme" ? 34 : l.kind === "time" ? 12 : 26)).strength(0.25);
      // gentle perpetual orbit around the centroid
      G.d3Force("orbit", () => {
        const ns = G.graphData().nodes as any[];
        if (!ns.length) return;
        let cx = 0, cy = 0;
        for (const n of ns) { cx += n.x || 0; cy += n.y || 0; }
        cx /= ns.length; cy /= ns.length;
        for (const n of ns) {
          const dx = (n.x || 0) - cx, dy = (n.y || 0) - cy;
          n.vx = (n.vx || 0) - dy * 0.0009;
          n.vy = (n.vy || 0) + dx * 0.0009;
        }
      });
      G.d3VelocityDecay(0.86);

      const fit = () => { if (elRef.current) { G.width(elRef.current.clientWidth); G.height(elRef.current.clientHeight); } };
      fit();
      const ro = new ResizeObserver(fit); ro.observe(elRef.current);
      setTimeout(() => G.zoomToFit(600, 30), 600);
      if (elRef.current) elRef.current.style.cursor = "grab";
      gRef.current = G; (G as any).__ro = ro;
    })();
    return () => { disposed = true; try { gRef.current?.__ro?.disconnect(); gRef.current?._destructor?.(); } catch {} };
  }, [data]);

  const ct = (data.meta.counts || {}) as any;
  return (
    <div
      className="relative mb-16 overflow-hidden"
      style={{
        height: 600,
        width: "100vw",
        left: "50%",
        right: "50%",
        marginLeft: "-50vw",
        marginRight: "-50vw",
        WebkitMaskImage: "radial-gradient(125% 105% at 50% 50%, #000 55%, transparent 100%)",
        maskImage: "radial-gradient(125% 105% at 50% 50%, #000 55%, transparent 100%)",
      }}
    >
      <div ref={elRef} className="absolute inset-0" />
      <div className="pointer-events-none absolute left-6 top-6 md:left-10 text-[10px] uppercase tracking-[3px] text-[var(--color-dim)]">
        neural map
        <div className="mt-1 text-[9px] tracking-[1.5px] text-[var(--color-muted)] normal-case">{ct.dreams ?? 0} dreams · {ct.contemplations ?? 0} contemplations · {ct.themes ?? 0} themes</div>
      </div>
      <a href="/mind" className="group absolute bottom-6 right-6 md:right-10 text-[10px] uppercase tracking-[2px] text-[var(--color-muted)] transition-colors hover:text-[var(--color-bright)]">
        explore the full mind <span className="inline-block transition-transform group-hover:translate-x-[2px]">&#8599;</span>
      </a>
    </div>
  );
}
