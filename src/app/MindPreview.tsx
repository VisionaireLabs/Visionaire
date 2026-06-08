"use client";
import { useEffect, useRef } from "react";
import type { Graph } from "./mind/graph";

// Settled neural-map preview that floats on a loop (rotate + drift + tilt)
// via CSS transform. Non-interactive. Corner link opens the full /mind.
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
        .nodeRelSize(1.7)
        .nodeVal((n: any) => n.val || 3)
        .cooldownTicks(220)
        .enableZoomInteraction(false)
        .enablePanInteraction(false)
        .enablePointerInteraction(false)
        .linkColor((l: any) => "rgba(255,255,255," + ({ core: 0.12, theme: 0.08, time: 0.05, sameday: 0.1 }[l.kind as string] ?? 0.06) + ")")
        .linkWidth(0.3)
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
      const fit = () => { if (elRef.current) { G.width(elRef.current.clientWidth); G.height(elRef.current.clientHeight); G.zoomToFit(0, 70); } };
      fit();
      const ro = new ResizeObserver(fit); ro.observe(elRef.current);
      setTimeout(() => G.zoomToFit(800, 70), 1800);
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
      <style>{`
        @keyframes mindfloat {
          0%   { transform: perspective(1400px) rotateX(7deg) rotateY(-9deg) rotateZ(-4deg) translate3d(-1.2%,0.4%,0) scale(1); }
          25%  { transform: perspective(1400px) rotateX(3deg) rotateY(7deg) rotateZ(3deg) translate3d(1.2%,-0.8%,0) scale(1.05); }
          50%  { transform: perspective(1400px) rotateX(9deg) rotateY(10deg) rotateZ(4deg) translate3d(1%,1%,0) scale(1.01); }
          75%  { transform: perspective(1400px) rotateX(4deg) rotateY(-7deg) rotateZ(-3deg) translate3d(-1%,0.9%,0) scale(1.05); }
          100% { transform: perspective(1400px) rotateX(7deg) rotateY(-9deg) rotateZ(-4deg) translate3d(-1.2%,0.4%,0) scale(1); }
        }
        .mindfloat-canvas { animation: mindfloat 34s ease-in-out infinite; transform-origin: 50% 50%; will-change: transform; }
      `}</style>
      <div ref={elRef} className="absolute inset-0 mindfloat-canvas" />

      {/* labels aligned to the text column margins */}
      <div className="pointer-events-none absolute inset-x-0 top-6 z-10">
        <div className="mx-auto max-w-[640px] px-6">
          <div className="text-[10px] uppercase tracking-[3px] text-[#a3a3a3]">neural map</div>
          <div className="mt-1 text-[9px] tracking-[1.5px] text-[#8a8a8a]">{ct.dreams ?? 0} dreams · {ct.contemplations ?? 0} contemplations · {ct.themes ?? 0} themes</div>
        </div>
      </div>
      <div className="pointer-events-none absolute inset-x-0 bottom-6 z-10">
        <div className="mx-auto flex max-w-[640px] justify-end px-6">
          <a href="/mind" className="group pointer-events-auto text-[10px] uppercase tracking-[2px] text-[#a3a3a3] transition-colors hover:text-white">
            explore the full mind <span className="inline-block transition-transform group-hover:translate-x-[2px]">&#8599;</span>
          </a>
        </div>
      </div>
    </div>
  );
}
