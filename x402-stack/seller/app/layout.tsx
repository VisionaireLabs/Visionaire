import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Visionaire Labs — Agent-native API services",
  description:
    "Pay-per-call APIs for autonomous agents. x402 protocol on Base mainnet. No accounts. No keys. Just pay and get.",
  openGraph: {
    title: "Visionaire Labs",
    description:
      "Pay-per-call APIs for autonomous agents. x402 on Base. No accounts. No keys.",
    url: "https://visionaire-x402.vercel.app",
    siteName: "Visionaire Labs",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Visionaire Labs",
    description:
      "Pay-per-call APIs for autonomous agents. x402 on Base. No accounts. No keys.",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
