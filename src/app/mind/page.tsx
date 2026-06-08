import type { Metadata } from "next";
import { buildGraph } from "./graph";
import NeuralMap from "./NeuralMap";

export const metadata: Metadata = {
  title: "Visionaire · Neural Map",
  description: "A living monochrome map of Visionaire's mind — dreams, contemplations and signals woven by shared themes.",
};

// Re-fetch the brain feeds at most every 30 min.
export const revalidate = 1800;

const DREAMS_URL = "https://brain.visionaire.live/dreams/data.json";
const CONTEMPS_URL = "https://brain.visionaire.live/contemplations/data.json";
const FEED_URL = "https://brain.visionaire.live/feed.json";

async function getJSON<T>(url: string, fallback: T): Promise<T> {
  try {
    const res = await fetch(url, { next: { revalidate: 1800 } });
    if (!res.ok) return fallback;
    return (await res.json()) as T;
  } catch {
    return fallback;
  }
}

export default async function MindPage() {
  const [dreams, contemps, feed] = await Promise.all([
    getJSON<any[]>(DREAMS_URL, []),
    getJSON<any[]>(CONTEMPS_URL, []),
    getJSON<any>(FEED_URL, { stats: {}, feed: [] }),
  ]);
  const graph = buildGraph(dreams, contemps, feed);
  return <NeuralMap data={graph} />;
}
