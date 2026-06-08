"use client";
import { useEffect, useRef } from "react";
import type { Graph } from "./mind/graph";

// Compact, non-interactive preview of the neural map for the homepage.
// The whole card is a link to the full /mind experience.
export default function MindPreview({ data }: { data: Graph }) {
  const elRef = useRef<HTMLDivElement>(null);
  const gRef = useRef<any>(null);

  useEffect(() => {
    let disposed = false;
    (async () => {
      const ForceGraph = ((await import("force-graph")).default) as any;
      if (disposed || !elRef.current) return;
      const C: Record<string, string> = { core: "#ffffff", theme: "#dcdcdc", contemplation: "#f2f2f2", dream: "#6f6f6f", activity: "#9a9a9a" };
      const G = ForceGraph()(elRef.current)
        .graphData(JSON.parse(JSON.stringify(data)))
        .backgroundColor("rgba(0,0,0,0)")
        .nodeRelSize(2.0)
        .nodeVal((n: any) => n.val || 3)
        .cooldownTicks(180)
        .enableZoomInteraction(false)
        .enablePanInteraction(false)
        .enablePointerInteraction(false)
        .linkColor((l: any) => "rgba(255,255,255," + ({ core: 0.12, theme: 0.08, time: 0.05, sameday: 0.1 }[l.kind as string] ?? 0.06) + ")")
        .linkWidth(0.3)
        .nodeCanvasObject((n: any, ctx: CanvasRenderingContext2D, scale: number) => {
          const r = Math.sqrt(n.val || 3) * 1.7;
          ctx.beginPath();
          ctx.arc(n.x, n.y, r, 0, 2 * Math.PI);
          if (n.type === "theme") { ctx.strokeStyle = C.theme; ctx.lineWidth = 0.6; ctx.stroke(); }
          else { ctx.fillStyle = C[n.type] || "#888"; ctx.fill(); }
          if (n.type === "core" || n.type === "theme") {
            const size = Math.min(Math.max(n.type === "core" ? 9 : 6.5, 8), 14) / scale;
            ctx.font = (n.type === "core" ? 500 : 300) + " " + size + "px 'IBM Plex Mono', monospace";
            ctx.textAlign = "center"; ctx.textBaseline = "middle";
            ctx.fillStyle = n.type === "core" ? "#fff" : "#cfcfcf";
            ctx.fillText((n.label || "").toLowerCase(), n.x, n.y + r + size);
          }
        });
      G.d3Force("charge").strength(-70);
      G.d3Force("link").distance((l: any) => (l.kind === "theme" ? 34 : l.kind === "time" ? 12 : 26)).strength(0.25);
      const fit = () => { if (elRef.current) { G.width(elRef.current.clientWidth); G.height(elRef.current.clientHeight); } };
      fit();
      const ro = new ResizeObserver(fit); ro.observe(elRef.current);
      setTimeout(() => G.zoomToFit(600, 30), 500);
      gRef.current = G; (G as any).__ro = ro;
    })();
    return () => { disposed = true; try { gRef.current?.__ro?.disconnect(); gRef.current?._destructor?.(); } catch {} };
  }, [data]);

  const ct = (data.meta.counts || {}) as any;
  return (
    <a href="/mind" className="group relative block mb-16 overflow-hidden border border-[var(--color-border)] transition-colors hover:border-[var(--color-muted)]" aria-label="Open the full neural map" style={{ height: 380 }}>
      <div ref={elRef} className="absolute inset-0" />
      <div className="pointer-events-none absolute left-4 top-4 text-[10px] uppercase tracking-[3px] text-[var(--color-dim)]">
        neural map
        <div className="mt-1 text-[9px] tracking-[1.5px] text-[var(--color-muted)] normal-case">{ct.dreams ?? 0} dreams · {ct.contemplations ?? 0} contemplations · {ct.themes ?? 0} themes</div>
      </div>
      <div className="pointer-events-none absolute bottom-4 right-4 text-[10px] uppercase tracking-[2px] text-[var(--color-muted)] transition-colors group-hover:text-[var(--color-bright)]">
        explore the full mind <span className="transition-transform group-hover:translate-x-[2px] inline-block">&#8599;</span>
      </div>
    </a>
  );
}
