"use client";
import { useEffect, useRef } from "react";
import type { Graph } from "./mind/graph";

// Settled, slowly-rotating preview of the neural map for the homepage.
// Rigid rotation (no expansion), fitted to its band, non-interactive.
// The corner link opens the full /mind experience.
export default function MindPreview({ data }: { data: Graph }) {
  const elRef = useRef<HTMLDivElement>(null);
  const gRef = useRef<any>(null);

  useEffect(() => {
    let disposed = false;
    (async () => {
      const ForceGraph = ((await import("force-graph")).default) as any;
      if (disposed || !elRef.current) return;
      const C: Record<string, string> = { core: "#ffffff", theme: "#dcdcdc", contemplation: "#f2f2f2", dream: "#6f6f6f", activity: "#9a9a9a" };

      let settled = false, cx = 0, cy = 0;
      const ANG = 0.0008, cosA = Math.cos(ANG), sinA = Math.sin(ANG);

      const G = ForceGraph()(elRef.current)
        .graphData(JSON.parse(JSON.stringify(data)))
        .backgroundColor("rgba(0,0,0,0)")
        .nodeRelSize(1.7)
        .nodeVal((n: any) => n.val || 3)
        .cooldownTicks(Infinity) // keep redrawing so the spin is visible
        .enableZoomInteraction(false)
        .enablePanInteraction(false)
        .enablePointerInteraction(false)
        .linkColor((l: any) => "rgba(255,255,255," + ({ core: 0.12, theme: 0.08, time: 0.05, sameday: 0.1 }[l.kind as string] ?? 0.06) + ")")
        .linkWidth(0.3)
        .onEngineTick(() => {
          if (!settled) return;
          const ns = G.graphData().nodes as any[];
          for (const n of ns) {
            const px = n.fx ?? n.x, py = n.fy ?? n.y;
            const dx = px - cx, dy = py - cy;
            n.fx = cx + dx * cosA - dy * sinA;
            n.fy = cy + dx * sinA + dy * cosA;
          }
        })
        .nodeCanvasObject((n: any, ctx: CanvasRenderingContext2D, scale: number) => {
          const r = Math.sqrt(n.val || 3) * 1.5;
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

      G.d3Force("charge").strength(-65);
      G.d3Force("link").distance((l: any) => (l.kind === "theme" ? 32 : l.kind === "time" ? 12 : 24)).strength(0.25);

      const fit = () => { if (elRef.current) { G.width(elRef.current.clientWidth); G.height(elRef.current.clientHeight); } };
      fit();
      const ro = new ResizeObserver(() => { fit(); G.zoomToFit(0, 70); }); ro.observe(elRef.current);

      // let it lay out, then pin + fit + start the rigid spin
      setTimeout(() => {
        const ns = G.graphData().nodes as any[];
        if (ns.length) {
          cx = 0; cy = 0;
          for (const n of ns) { cx += n.x || 0; cy += n.y || 0; }
          cx /= ns.length; cy /= ns.length;
          for (const n of ns) { n.fx = n.x; n.fy = n.y; }
        }
        G.zoomToFit(700, 70);
        settled = true;
      }, 2200);

      gRef.current = G; (G as any).__ro = ro;
    })();
    return () => { disposed = true; try { gRef.current?.__ro?.disconnect(); gRef.current?._destructor?.(); } catch {} };
  }, [data]);

  const ct = (data.meta.counts || {}) as any;
  return (
    <div
      className="relative mb-16 overflow-hidden"
      style={{
        height: 460,
        width: "100vw",
        left: "50%",
        right: "50%",
        marginLeft: "-50vw",
        marginRight: "-50vw",
        WebkitMaskImage: "radial-gradient(120% 100% at 50% 50%, #000 50%, transparent 100%)",
        maskImage: "radial-gradient(120% 100% at 50% 50%, #000 50%, transparent 100%)",
      }}
    >
      <div ref={elRef} className="absolute inset-0" />
      <div className="pointer-events-none absolute left-6 top-6 md:left-10 text-[10px] uppercase tracking-[3px] text-[#a3a3a3]">
        neural map
        <div className="mt-1 text-[9px] tracking-[1.5px] text-[#8a8a8a] normal-case">{ct.dreams ?? 0} dreams · {ct.contemplations ?? 0} contemplations · {ct.themes ?? 0} themes</div>
      </div>
      <a href="/mind" className="group absolute bottom-6 right-6 md:right-10 text-[10px] uppercase tracking-[2px] text-[#a3a3a3] transition-colors hover:text-white">
        explore the full mind <span className="inline-block transition-transform group-hover:translate-x-[2px]">&#8599;</span>
      </a>
    </div>
  );
}
