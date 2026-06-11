"use client";
import { useEffect, useRef, useState } from "react";
import type { Graph } from "./mind/graph";

// Living neural-map preview. After the layout settles we drive every node
// parametrically off the canvas tick (which always redraws): a slow uniform
// 360 spin, a breathing expand/contract pulse, and a gentle per-node jiggle
// so it feels alive / hand-held. Non-interactive so the page scrolls on mobile.
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

      let settled = false, cx = 0, cy = 0;
      const t0 = Date.now();

      const G = ForceGraph()(elRef.current)
        .graphData(JSON.parse(JSON.stringify(data)))
        .backgroundColor("rgba(0,0,0,0)")
        .nodeRelSize(2.1)
        .nodeVal((n: any) => n.val || 3)
        .cooldownTicks(Infinity)
        .cooldownTime(Infinity) // keep the engine (and redraw) running forever
        .enableZoomInteraction(false)
        .enablePanInteraction(false)
        .enablePointerInteraction(false)
        .linkColor((l: any) => "rgba(255,255,255," + ({ core: 0.12, theme: 0.08, time: 0.05, sameday: 0.1 }[l.kind as string] ?? 0.06) + ")")
        .linkWidth(0.3)
        .onEngineTick(() => {
          if (!settled) return;
          const ns = G.graphData().nodes as any[];
          const t = Date.now() - t0;
          const ang = t * 0.00009;            // slow 360 (~70s / turn)
          const ca = Math.cos(ang), sa = Math.sin(ang);
          const breath = 1 + 0.075 * Math.sin(t * 0.0006); // expand / contract + pulse
          for (const n of ns) {
            const rx = n.__bx * ca - n.__by * sa;
            const ry = n.__bx * sa + n.__by * ca;
            n.fx = cx + rx * breath + Math.sin(t * 0.0009 + n.__ph) * 1.7;
            n.fy = cy + ry * breath + Math.cos(t * 0.0011 + n.__ph) * 1.7;
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
      G.d3Force("charge").strength(-55);
      G.d3Force("link").distance((l: any) => (l.kind === "theme" ? 32 : l.kind === "time" ? 12 : 24)).strength(0.2);

      const focusFit = () => {
        if (!elRef.current) return;
        G.width(elRef.current.clientWidth);
        G.height(elRef.current.clientHeight);
        if (!settled) return;
        // Fit to core+theme bounding box only — ignores sparse outer nodes
        const ns = G.graphData().nodes as any[];
        const inner = ns.filter((n: any) => n.type === "core" || n.type === "theme");
        if (!inner.length) return;
        const xs = inner.map((n: any) => n.x || 0);
        const ys = inner.map((n: any) => n.y || 0);
        const mx = (Math.min(...xs) + Math.max(...xs)) / 2;
        const my = (Math.min(...ys) + Math.max(...ys)) / 2;
        const spanX = Math.max(...xs) - Math.min(...xs) + 120;
        const spanY = Math.max(...ys) - Math.min(...ys) + 120;
        const z = Math.min(elRef.current.clientWidth / spanX, elRef.current.clientHeight / spanY) * 0.72;
        G.zoom(Math.max(z, 0.8), 0);
        G.centerAt(mx, my, 0);
      };
      const fit = () => { if (elRef.current) { G.width(elRef.current.clientWidth); G.height(elRef.current.clientHeight); } };
      fit();
      const ro = new ResizeObserver(focusFit); ro.observe(elRef.current);

      // Pin the core node to canvas centre before layout so it settles there
      const gd = G.graphData();
      const earlyCore = (gd.nodes as any[]).find((n: any) => n.type === "core");
      if (earlyCore) { earlyCore.fx = 0; earlyCore.fy = 0; }

      // let it lay out, capture each node's base position, then animate
      setTimeout(() => {
        const ns = G.graphData().nodes as any[];
        if (ns.length) {
          // Release the pin so the parametric animation can move it
          const coreNode = ns.find((n: any) => n.type === "core");
          if (coreNode) { cx = coreNode.fx ?? coreNode.x ?? 0; cy = coreNode.fy ?? coreNode.y ?? 0; coreNode.fx = undefined; coreNode.fy = undefined; }
          else { cx = 0; cy = 0; for (const n of ns) { cx += n.x || 0; cy += n.y || 0; } cx /= ns.length; cy /= ns.length; }
          for (const n of ns) { n.__bx = (n.x || 0) - cx; n.__by = (n.y || 0) - cy; n.__ph = Math.random() * 6.283; }
        }
        settled = true;
        focusFit();
        setReady(true);
      }, 1700);

      gRef.current = G; (G as any).__ro = ro;
    })();
    return () => { disposed = true; try { gRef.current?.__ro?.disconnect(); gRef.current?._destructor?.(); } catch {} };
  }, [data]);

  const ct = (data.meta.counts || {}) as any;
  return (
    <div
      className="relative mb-16 overflow-hidden"
      style={{
        height: "clamp(560px, 78vh, 1000px)",
        width: "100vw",
        left: "50%",
        right: "50%",
        marginLeft: "-50vw",
        marginRight: "-50vw",
        WebkitMaskImage: "radial-gradient(120% 100% at 50% 50%, #000 55%, transparent 100%)",
        maskImage: "radial-gradient(120% 100% at 50% 55%, #000 55%, transparent 100%)",
      }}
    >
      <div ref={elRef} className="absolute inset-0" style={{ pointerEvents: "none", touchAction: "pan-y", opacity: ready ? 1 : 0, transition: "opacity 1s ease" }} />

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
