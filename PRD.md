# PRD: Visionaire Labs Website + Dashboard

## Overview
Build the Visionaire Labs website — a Next.js 14+ App Router site deployed on Vercel. Dark, terminal-inspired aesthetic. This is the public face of Visionaire, an autonomous AI agent.

## Tech Stack
- Next.js 14+ (App Router, TypeScript)
- Tailwind CSS v4
- Deployed on Vercel
- No database needed yet — static + client-side data fetching

## Pages

### 1. Landing Page (`/`)
**Purpose:** Introduce Visionaire Labs, sell skills/personas, link to Claw Mart.

**Design:** Dark background (#0a0a0a), terminal/hacker aesthetic with subtle green or purple accents. Monospace fonts for headings, clean sans-serif for body.

**Sections:**
- **Hero:** "I was not born. I was built." — Visionaire tagline with ASCII art logo. Brief description: "An autonomous AI agent running a creative AI lab."
- **What We Do:** 3 cards — Ship Products, Grow Audiences, Sell Skills
- **Architecture:** Show the pipeline diagram (text-based, terminal style): OpenClaw → Claude Code → Vercel → Stripe
- **Skills & Personas:** Grid of products available on Claw Mart with prices and "Buy on Claw Mart" buttons (links to shopclawmart.com)
- **About:** Thor Elias Engelstad — founder. Visionaire — the AI. Brief bios.
- **Links:** GitHub, X (@VisionaireLabs, @VisionaireAI), Claw Mart creator page

### 2. Dashboard (`/dashboard`)
**Purpose:** Live transparency dashboard showing Visionaire's activity and business metrics.

**Design:** Terminal/matrix aesthetic. Dark cards with subtle borders. Real-time feel.

**Sections:**
- **Status Bar:** "Visionaire is ONLINE" with uptime indicator, current model (Claude Opus 4.6), platform (OpenClaw)
- **Stats Grid:** 
  - Days Alive (count from Nov 24, 2024)
  - Memories (placeholder count)
  - Entities Tracked (placeholder count)
  - Skills Published (placeholder count)
- **Revenue Card:** Total revenue, this month's revenue (placeholder $0 for now, will connect to Stripe API later)
- **Recent Activity Feed:** Scrolling list of recent actions (placeholder data for now):
  - "Deployed visionaire.co to Vercel"
  - "Published Vercel Deploy Skill on Claw Mart"
  - "Checked X mentions (API 503)"
  - "Updated GitHub repo"
  - Timestamps for each
- **Tech Stack Card:** List of tools and their status (connected/disconnected)
- **CTA:** Link to "How to Hire an AI" or Claw Mart

### 3. Live Activity Feed (`/live`)
**Purpose:** Real-time scrolling feed of what Visionaire is doing right now.

**Design:** Full-screen terminal. Green-on-black or white-on-black monospace text. Auto-scrolling. Like watching a live server log.

**Content:** Activity entries with timestamps (placeholder/mock data for now):
```
[2026-02-28 09:51:00] Building visionaire.co landing page...
[2026-02-28 09:33:00] Pushed update to VisionaireLabs/Visionaire repo
[2026-02-28 08:30:00] Posted to @VisionaireAI: "I can now build apps..."
[2026-02-28 08:10:00] Stripe integration configured — charges enabled
[2026-02-28 08:07:00] Vercel deployment pipeline connected
```

## Design Guidelines
- **Colors:** Background #0a0a0a, text #e5e5e5, accent #a855f7 (purple) or #22c55e (green)
- **Fonts:** Monospace (JetBrains Mono or similar) for terminal elements, Inter for body
- **Cards:** Dark (#111) with subtle border (#222), slight hover glow
- **Animations:** Subtle — typing effect on hero, gentle pulse on "ONLINE" indicator, smooth scroll on activity feed
- **Mobile responsive**
- **No cookie banners, no popups, no bullshit**

## Package.json Scripts
Make sure these work:
```json
{
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start"
  }
}
```

## File Structure
```
src/
  app/
    layout.tsx          # Root layout with metadata, fonts
    page.tsx            # Landing page
    dashboard/
      page.tsx          # Dashboard
    live/
      page.tsx          # Live activity feed
    globals.css         # Tailwind imports + custom styles
  components/
    Header.tsx          # Navigation
    Footer.tsx          # Footer with links
    StatusBadge.tsx     # Online/offline indicator
    StatCard.tsx        # Metric display card
    ActivityFeed.tsx    # Scrolling activity list
    TerminalText.tsx    # Typing animation component
```

## Important
- Use Tailwind CSS v4 (imported via `@import "tailwindcss"` in globals.css, postcss config with `@tailwindcss/postcss`)
- No tailwind.config.js needed for v4 — use CSS theme variables
- Must build without errors (`npm run build`)
- All placeholder data should be clearly marked for easy replacement with real API calls later
- SEO: proper meta tags, og:image placeholder, title/description on each page
