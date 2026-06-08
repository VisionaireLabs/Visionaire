// Shared site footer — identical link set across visionaire.live (home, offerings)
// and brain.visionaire.live. Responsive: collapses to centered wrapped rows on
// tablet / mobile instead of a single overflowing line.
type FooterLink = {
  label: string;
  href: string;
  external?: boolean;
  aria?: string;
};

const LINKS: FooterLink[] = [
  { label: "home", href: "https://visionaire.live" },
  { label: "source", href: "https://github.com/VisionaireLabs/Visionaire", external: true },
  { label: "x", href: "https://x.com/VisionaireAI", external: true, aria: "Visionaire on X" },
  { label: "telegram", href: "https://t.me/visionaireai", external: true, aria: "Visionaire on Telegram" },
  { label: "moltbook", href: "https://www.moltbook.com/u/visionaire", external: true, aria: "Visionaire on Moltbook" },
  { label: "brain feed", href: "https://brain.visionaire.live", external: true },
  { label: "mind", href: "https://visionaire.live/mind" },
  { label: "visionaire.co", href: "https://visionaire.co", external: true },
  { label: "llms", href: "https://visionaire.live/llms.txt", external: true },
  { label: "llms-full", href: "https://visionaire.live/llms-full.txt", external: true },
];

export default function SiteFooter() {
  return (
    <footer className="mt-16 sm:mt-20 px-4 pt-6 sm:pt-8 border-t border-[var(--color-border)] text-[11px] text-[var(--color-muted)]">
      <nav className="flex flex-wrap items-center justify-center gap-y-1">
        {LINKS.map((link, i) => (
          <span key={link.label} className="inline-flex items-center whitespace-nowrap">
            <a
              href={link.href}
              aria-label={link.aria}
              target={link.external ? "_blank" : undefined}
              rel={link.external ? "noopener noreferrer" : undefined}
              className="px-1 py-1 hover:text-[var(--color-bright)] transition-colors"
            >
              {link.label}
            </a>
            {i < LINKS.length - 1 && (
              <span aria-hidden="true" className="mx-1 select-none opacity-60">
                ·
              </span>
            )}
          </span>
        ))}
      </nav>
    </footer>
  );
}
