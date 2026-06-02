"use client";

import { useEffect, useState } from "react";

// Small live countdown to the next vesting unlock. Server renders the date
// statically (so the page is still useful with JS off); this component
// upgrades the secondary "in N days" text into a ticking countdown once
// hydrated. No external dependencies, no polling — just a 1s setInterval.
export function UnlockCountdown({ unix }: { unix: number }) {
  const [now, setNow] = useState<number>(() => Date.now() / 1000);

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now() / 1000), 1000);
    return () => clearInterval(id);
  }, []);

  const remaining = Math.max(0, Math.floor(unix - now));
  if (remaining === 0) return <span>unlocking now</span>;

  const days = Math.floor(remaining / 86400);
  const hours = Math.floor((remaining % 86400) / 3600);
  const minutes = Math.floor((remaining % 3600) / 60);
  const seconds = remaining % 60;

  const pad = (n: number) => String(n).padStart(2, "0");

  return (
    <span style={{ fontVariantNumeric: "tabular-nums" }}>
      {days}d {pad(hours)}:{pad(minutes)}:{pad(seconds)}
    </span>
  );
}
