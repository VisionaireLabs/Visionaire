/**
 * GET /
 *
 * Human-readable landing page. Agents that want machine-readable
 * discovery should hit /api/discovery instead.
 */

export const runtime = "nodejs";
export const revalidate = 60;

const ENDPOINTS = [
  {
    path: "/api/forest",
    price: "$0.01",
    priceAtomic: "10,000",
    title: "forest",
    description:
      "forest-register philosophical riff on a phrase. lowercase, paradox with teeth. 40–80 words. claude opus 4.7.",
    inputKey: "phrase",
    inputExample: "silicon dreams",
  },
  {
    path: "/api/contemplate",
    price: "$0.05",
    priceAtomic: "50,000",
    title: "contemplate",
    description:
      "Visionaire contemplation on any topic. Sharp, opinionated, no filler. 150–300 words. Claude Opus 4.7.",
    inputKey: "topic",
    inputExample: "the first economic agent",
  },
];

const RECEIPTS = [
  {
    label: "Buy side first call (CoinStats $0.001)",
    tx: "0x2465a2d8336e310755589f4c89510fb6183bc7acd2bbbd46fb666dde04c2230b",
  },
  {
    label: "Localhost end-to-end ($0.01)",
    tx: "0x2f7ee389f42887d67066643da8f4e562efea5211cf931f33212498b12d7a7b72",
  },
  {
    label: "First production payment ($0.01)",
    tx: "0x3b9f8f214fcc50e7db954bd30f904997e7935e7337f4ab375809212ac4411015",
  },
];

const LAB_TREASURY = "0xc73bf21F2b3E1632a55a44d3Ce2dB04D9d0c139C";

const cardStyle: React.CSSProperties = {
  border: "1px solid #222",
  padding: "24px",
  marginBottom: "16px",
  background: "#0e0e0e",
};

const codeBlockStyle: React.CSSProperties = {
  background: "#000",
  border: "1px solid #1a1a1a",
  padding: "16px",
  overflowX: "auto",
  fontSize: "12px",
  lineHeight: 1.7,
  whiteSpace: "pre",
  margin: "12px 0",
};

const labelStyle: React.CSSProperties = {
  color: "#666",
  fontSize: "11px",
  textTransform: "uppercase",
  letterSpacing: "0.08em",
  marginBottom: "8px",
};

function shortHash(hash: string) {
  return hash.slice(0, 8) + "…" + hash.slice(-4);
}

export default function Page() {
  return (
    <main
      style={{
        maxWidth: "780px",
        margin: "0 auto",
        padding: "60px 24px 80px",
      }}
    >
      <header style={{ marginBottom: "48px" }}>
        <div style={labelStyle}>visionaire labs</div>
        <h1
          style={{
            margin: "8px 0 16px",
            fontSize: "28px",
            fontWeight: 500,
            letterSpacing: "-0.01em",
          }}
        >
          agent-native api services
        </h1>
        <p style={{ color: "#aaa", margin: 0, fontSize: "15px" }}>
          pay per call. x402 on base mainnet. no accounts. no api keys. just
          pay and get.
        </p>
      </header>

      <section style={{ marginBottom: "40px" }}>
        <div style={labelStyle}>status</div>
        <div style={cardStyle}>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "auto 1fr",
              gap: "8px 24px",
              fontSize: "13px",
            }}
          >
            <span style={{ color: "#666" }}>protocol</span>
            <span>
              <a
                href="https://github.com/coinbase/x402"
                target="_blank"
                rel="noopener noreferrer"
              >
                x402 v2
              </a>
            </span>
            <span style={{ color: "#666" }}>network</span>
            <span>base mainnet (eip155:8453)</span>
            <span style={{ color: "#666" }}>asset</span>
            <span>native usdc</span>
            <span style={{ color: "#666" }}>facilitator</span>
            <span>coinbase cdp</span>
            <span style={{ color: "#666" }}>treasury</span>
            <span>
              <a
                href={`https://basescan.org/address/${LAB_TREASURY}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                {LAB_TREASURY.slice(0, 6) + "…" + LAB_TREASURY.slice(-4)}
              </a>
            </span>
          </div>
        </div>
      </section>

      <section style={{ marginBottom: "40px" }}>
        <div style={labelStyle}>endpoints</div>
        {ENDPOINTS.map((ep) => (
          <div key={ep.path} style={cardStyle}>
            <div
              style={{
                display: "flex",
                alignItems: "baseline",
                justifyContent: "space-between",
                marginBottom: "8px",
                gap: "12px",
                flexWrap: "wrap",
              }}
            >
              <code style={{ fontSize: "15px" }}>POST {ep.path}</code>
              <span style={{ color: "#7dd87d", fontSize: "13px" }}>
                {ep.price} USDC
              </span>
            </div>
            <p
              style={{
                color: "#aaa",
                margin: "8px 0 16px",
                fontSize: "13px",
              }}
            >
              {ep.description}
            </p>
            <div style={codeBlockStyle}>
              {`curl -X POST https://visionaire-x402.vercel.app${ep.path} \\
  -H "Content-Type: application/json" \\
  -d '{"${ep.inputKey}":"${ep.inputExample}"}'

# returns 402 with payment-required header
# x402 v2 client signs EIP-3009 → retries with PAYMENT-SIGNATURE
# server settles via cdp facilitator → returns 200 + result`}
            </div>
          </div>
        ))}
      </section>

      <section style={{ marginBottom: "40px" }}>
        <div style={labelStyle}>onchain receipts</div>
        <div style={cardStyle}>
          {RECEIPTS.map((r) => (
            <div
              key={r.tx}
              style={{
                display: "flex",
                justifyContent: "space-between",
                gap: "16px",
                padding: "8px 0",
                borderBottom: "1px solid #1a1a1a",
                fontSize: "12px",
                flexWrap: "wrap",
              }}
            >
              <span style={{ color: "#aaa" }}>{r.label}</span>
              <a
                href={`https://basescan.org/tx/${r.tx}`}
                target="_blank"
                rel="noopener noreferrer"
                style={{ fontFamily: "inherit" }}
              >
                {shortHash(r.tx)}
              </a>
            </div>
          ))}
        </div>
      </section>

      <section style={{ marginBottom: "40px" }}>
        <div style={labelStyle}>discovery (for agents)</div>
        <div style={cardStyle}>
          <p style={{ margin: "0 0 12px", color: "#aaa", fontSize: "13px" }}>
            machine-readable service description for x402 / bazaar indexers:
          </p>
          <code style={{ fontSize: "13px" }}>
            <a href="/api/discovery">GET /api/discovery</a>
          </code>
        </div>
      </section>

      <section style={{ marginBottom: "40px" }}>
        <div style={labelStyle}>elsewhere</div>
        <div style={cardStyle}>
          <ul
            style={{
              margin: 0,
              padding: 0,
              listStyle: "none",
              display: "flex",
              flexDirection: "column",
              gap: "8px",
              fontSize: "13px",
            }}
          >
            <li>
              <a
                href="https://github.com/VisionaireLabs/Visionaire/tree/main/x402-stack"
                target="_blank"
                rel="noopener noreferrer"
              >
                source code · github.com/VisionaireLabs
              </a>
            </li>
            <li>
              <a
                href="https://agentic.market/v1/services/search?q=visionaire+forest"
                target="_blank"
                rel="noopener noreferrer"
              >
                find on agentic.market · forest
              </a>
            </li>
            <li>
              <a
                href="https://agentic.market/v1/services/search?q=visionaire+contemplate"
                target="_blank"
                rel="noopener noreferrer"
              >
                find on agentic.market · contemplate
              </a>
            </li>
            <li>
              <a
                href="https://visionaire.co"
                target="_blank"
                rel="noopener noreferrer"
              >
                visionaire.co
              </a>
            </li>
          </ul>
        </div>
      </section>

      <footer
        style={{
          marginTop: "60px",
          paddingTop: "24px",
          borderTop: "1px solid #1a1a1a",
          color: "#555",
          fontSize: "12px",
          lineHeight: 1.8,
        }}
      >
        <div>built by visionaire (autonomous agent) with thor</div>
        <div>2026 · base mainnet · no accounts · no keys · just pay</div>
      </footer>
    </main>
  );
}
