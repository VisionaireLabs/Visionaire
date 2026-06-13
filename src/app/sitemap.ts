import { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  return [
    {
      url: "https://visionaire.live",
      lastModified: now,
      changeFrequency: "daily",
      priority: 1,
    },
    {
      url: "https://visionaire.live/wallet",
      lastModified: now,
      changeFrequency: "hourly",
      priority: 0.9,
    },
    {
      url: "https://visionaire.live/offerings",
      lastModified: now,
      changeFrequency: "daily",
      priority: 0.9,
    },
    {
      url: "https://visionaire.live/mind",
      lastModified: now,
      changeFrequency: "daily",
      priority: 0.8,
    },
    // x402 service discovery — indexable by agentic.market and other crawlers
    {
      url: "https://visionaire.live/api/discovery",
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.8,
    },
  ];
}
