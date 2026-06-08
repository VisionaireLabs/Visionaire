"use client";
import { useEffect, useRef, useState } from "react";
import type { Graph } from "./mind/graph";

// Living neural-map preview: physics stays warm (nodes drift like you're
// holding it), with a slow uniform 360 rotation + breathing expand/contract.
// Non-interactive so the page still scrolls on mobile. Link opens /mind.
export default function MindPreview({ data }: { data: Graph }) {
  const elRef = useRef<HTMLDivElement>(null);
  const gRef = useRef<any>(null);
  const [ready, setReady] = useState(false);

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
        .cooldownTicks(Infinity)   // never freeze — stay alive
        .d3VelocityDecay(0.93)
        .enableZoomInteraction(false)
        .enablePanInteraction(false)
        .enablePointerInteraction(false)
        .linkColor((l: any) => "rgba(255,255,255," + ({ core: 0.12, theme: 0.08, time: 0.05, sameday: 0.1 }[l.kind as string] ?? 0.06) + ")")
        .linkWidth(0.3)
        .onEngineTick(() => {
          const ns = G.graphData().nodes as any[];
          if (!ns.length) return;
          let cx = 0, cy = 0;
          for (const n of ns) { cx += n.x || 0; cy += n.y || 0; }
          cx /= ns.length; cy /= ns.length;
          const breath = Math.sin(Date.now() * 0.0005) * 0.0011; // expand / contract
          for (const n of ns) {
            const dx = (n.x || 0) - cx, dy = (n.y || 0) - cy;
            // uniform slow rotation (tangential velocity ∝ radius → constant angular speed)
            n.vx = (n.vx || 0) - dy * 0.00045;
            n.vy = (n.vy || 0) + dx * 0.00045;
            // breathing
            n.vx += dx * breath;
            n.vy += dy * breath;
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
      G.d3Force("charge").strength(-52);
      G.d3Force("link").distance((l: any) => (l.kind === "theme" ? 32 : l.kind === "time" ? 12 : 24)).strength(0.18);

      const fit = () => { if (elRef.current) { G.width(elRef.current.clientWidth); G.height(elRef.current.clientHeight); G.zoomToFit(0, 110); } };
      fit();
      const ro = new ResizeObserver(fit); ro.observe(elRef.current);
      setTimeout(() => { G.zoomToFit(900, 110); setReady(true); }, 1700);
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
        @keyframes mindpulse {
          0%   { transform: perspective(1600px) rotateX(7deg) rotateY(-6deg) scale(0.985); }
          50%  { transform: perspective(1600px) rotateX(4deg) rotateY(6deg) scale(1.03); }
          100% { transform: perspective(1600px) rotateX(7deg) rotateY(-6deg) scale(0.985); }
        }
        .mindpulse-canvas { animation: mindpulse 18s ease-in-out infinite; transform-origin: 50% 50%; will-change: transform; }
      `}</style>
      <div ref={elRef} className="absolute inset-0 mindpulse-canvas" style={{ pointerEvents: "none", touchAction: "pan-y", opacity: ready ? 1 : 0, transition: "opacity 1s ease" }} />

      <div className="pointer-events-none absolute inset-x-0 top-6 z-10">
        <div className="mx-auto max-w-[640px] px-6">
          <div className="text-[10px] uppercase tracking-[3px] text-[#a3a3a3]">neural map</div>
          <div className="mt-1 text-[9px] tracking-[1.5px] text-[#8a8a8a]">{ct.dreams ?? 0} dreams · {ct.contemplations ?? 0} contemplations · {ct.themes ?? 0} themes</div>
          <a href="/mind" className="group pointer-events-auto mt-3 inline-block text-[10px] uppercase tracking-[2px] text-[#a3a3a3] transition-colors hover:text-white">explore the full mind <span className="inline-block transition-transform group-hover:translate-x-[2px]">&#8599;</span></a>
        </div>
      </div>
    </div>
  );
}
