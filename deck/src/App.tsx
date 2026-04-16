import { useState, useEffect } from "react";
import { useDeckInit } from "./hooks";
import { useDeckStore } from "./lib/store";
import { AgentColumn } from "./components/AgentColumn";
import { TopBar } from "./components/TopBar";
import { StatusBar } from "./components/StatusBar";
import { AddAgentModal } from "./components/AddAgentModal";
import { LoginScreen, isAuthenticated, getStoredToken } from "./components/LoginScreen";
import type { AgentConfig } from "./types";
import { themes, applyTheme } from "./themes";
import "./App.css";

/**
 * Agent column configuration.
 *
 * You're running default single-agent mode, so there's one agent: "main".
 * The Gateway routes all messages to the default workspace at:
 *   /Users/austenallred/.openclaw/workspace
 *
 * To add more columns later, set up multi-agent in openclaw.json:
 *   { "agents": { "list": [
 *     { "id": "research", "workspace": "~/.openclaw/workspace-research" },
 *     { "id": "codegen",  "workspace": "~/.openclaw/workspace-codegen" },
 *   ]}}
 *
 * Then add matching entries here.
 */
const AGENT_ACCENTS = [
  "#22d3ee",
  "#a78bfa",
  "#34d399",
  "#f59e0b",
  "#f472b6",
  "#60a5fa",
  "#facc15",
  "#fb7185",
  "#4ade80",
  "#c084fc",
  "#f97316",
  "#2dd4bf",
];

// All default sessions — numbered agents + named persistent sessions
const DEFAULT_AGENTS: AgentConfig[] = [
  { id: "main",                   name: "Main",              icon: "1",  accent: AGENT_ACCENTS[0],  context: "",                        model: "anthropic/claude-opus-4-7"   },
  { id: "agent-2",                name: "Agent 2",           icon: "2",  accent: AGENT_ACCENTS[1],  context: "",                        model: "anthropic/claude-opus-4-6"   },
  { id: "agent-3",                name: "Agent 3",           icon: "3",  accent: AGENT_ACCENTS[2],  context: "",                        model: "anthropic/claude-sonnet-4-6" },
  { id: "agent-4",                name: "Agent 4",           icon: "4",  accent: AGENT_ACCENTS[3],  context: "",                        model: "anthropic/claude-sonnet-4-6" },
  { id: "agent-5",                name: "Agent 5",           icon: "5",  accent: AGENT_ACCENTS[4],  context: "",                        model: "anthropic/claude-sonnet-4-6" },
  { id: "agent-6",                name: "Agent 6",           icon: "6",  accent: AGENT_ACCENTS[5],  context: "",                        model: "anthropic/claude-sonnet-4-6" },
  { id: "agent-7",                name: "Agent 7",           icon: "7",  accent: AGENT_ACCENTS[6],  context: "",                        model: "anthropic/claude-sonnet-4-6" },
  { id: "backup",                 name: "Backup",            icon: "💾", accent: AGENT_ACCENTS[7],  context: "Backup & recovery tasks", model: "anthropic/claude-sonnet-4-6" },
  { id: "skills",                 name: "Skills",            icon: "🛠", accent: AGENT_ACCENTS[8],  context: "Skill building & tooling", model: "anthropic/claude-sonnet-4-6" },
  { id: "research-agent",         name: "Research",          icon: "🔬", accent: AGENT_ACCENTS[9],  context: "Deep research & analysis", model: "anthropic/claude-opus-4-7"   },
  { id: "visionaire-labs",        name: "Visionaire Labs",   icon: "🧠", accent: AGENT_ACCENTS[10], context: "Visionaire Labs strategy", model: "anthropic/claude-opus-4-7"   },
  { id: "github",                 name: "GitHub",            icon: "🐙", accent: AGENT_ACCENTS[11], context: "GitHub & code ops",        model: "anthropic/claude-sonnet-4-6" },
  { id: "visionaire-ai-x-posts",  name: "X Posts",           icon: "𝕏",  accent: AGENT_ACCENTS[0],  context: "X/Twitter content",       model: "anthropic/claude-sonnet-4-6" },
];

function getGatewayConfig() {
  const params = new URLSearchParams(window.location.search);
  let gatewayUrl =
    params.get("gateway") ||
    import.meta.env.VITE_GATEWAY_URL ||
    "ws://127.0.0.1:18789";

  // Resolve relative paths (e.g. "/ws") to full WebSocket URLs
  if (gatewayUrl.startsWith("/")) {
    const proto = window.location.protocol === "https:" ? "wss:" : "ws:";
    gatewayUrl = `${proto}//${window.location.host}${gatewayUrl}`;
  }

  return {
    gatewayUrl,
    token:
      params.get("token") ||
      import.meta.env.VITE_GATEWAY_TOKEN ||
      undefined,
  };
}

export default function App() {
  const [authed, setAuthed] = useState(() => isAuthenticated());
  const [activeTab, setActiveTab] = useState("All Agents");
  const [showAddModal, setShowAddModal] = useState(false);
  // Use persisted agents if available, otherwise fall back to all defaults
  const persistedAgents = useDeckStore((s) => (s as any).persistedAgents as AgentConfig[] | undefined);
  const [initialAgents] = useState<AgentConfig[]>(() => {
    if (persistedAgents && persistedAgents.length > 0) return persistedAgents;
    return DEFAULT_AGENTS;
  });
  const columnOrder = useDeckStore((s) => s.columnOrder);
  const createAgentOnGateway = useDeckStore((s) => s.createAgentOnGateway);
  const theme = useDeckStore((s) => s.theme);

  const { gatewayUrl, token: configToken } = getGatewayConfig();
  // Prefer token from login screen (stored after password validation)
  const token = getStoredToken() || configToken;

  // Apply theme on mount and when it changes
  useEffect(() => {
    const selectedTheme = themes[theme];
    if (selectedTheme) {
      applyTheme(selectedTheme);
    }
  }, [theme]);

  useDeckInit({
    gatewayUrl,
    token,
    agents: initialAgents,
    skip: !authed,
  });

  // Cmd+1-9 to focus column inputs
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.metaKey && e.key >= "1" && e.key <= "9") {
        const index = parseInt(e.key, 10) - 1;
        const input = document.querySelector<HTMLTextAreaElement>(
          `[data-deck-input="${index}"]`
        );
        if (input) {
          e.preventDefault();
          input.focus();
        }
      } else if (e.metaKey && e.key === "k") {
        e.preventDefault();
        setShowAddModal((prev) => !prev);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  if (!authed) {
    return <LoginScreen onSuccess={() => setAuthed(true)} />;
  }

  return (
    <div className="deck-root">
      <TopBar
        activeTab={activeTab}
        onTabChange={setActiveTab}
        onAddAgent={() => setShowAddModal(true)}
      />

      <div className="deck-columns">
        {columnOrder.map((agentId, index) => (
          <AgentColumn key={agentId} agentId={agentId} columnIndex={index} />
        ))}
      </div>

      <StatusBar />

      {showAddModal && (
        <AddAgentModal
          onClose={() => setShowAddModal(false)}
          onCreate={createAgentOnGateway}
        />
      )}
    </div>
  );
}
