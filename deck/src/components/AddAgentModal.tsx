import { useState, type KeyboardEvent } from "react";
import type { AgentConfig } from "../types";
import styles from "./AddAgentModal.module.css";

const ACCENTS = [
  "#22d3ee", // cyan
  "#a78bfa", // purple
  "#34d399", // green
  "#fb923c", // orange
  "#f472b6", // pink
  "#facc15", // yellow
  "#60a5fa", // blue
  "#ef4444", // red
];

const MODELS = [
  // Anthropic (direct) — quality tier
  "anthropic/claude-opus-4-7",
  "anthropic/claude-opus-4-6",
  "anthropic/claude-sonnet-4-6",
  "anthropic/claude-sonnet-4-5",
  "anthropic/claude-haiku-4-5",
  // Google
  "google/gemini-2.5-pro",
  "google/gemini-2.5-flash",
  // NVIDIA NIM
  "nvidia/nvidia/nemotron-3-super-120b-a12b",
  "nvidia/nvidia/nemotron-3-nano-30b-a3b",
  // Ollama (free, local/cloud)
  "ollama/deepseek-v3.2",
  "ollama/kimi-k2.5",
  "ollama/glm-5",
  "ollama/minimax-m2.7",
  "ollama/qwen3-coder:480b",
  "ollama/devstral-2:123b",
  "ollama/ministral-3:8b",
];

export function AddAgentModal({
  onClose,
  onCreate,
}: {
  onClose: () => void;
  onCreate: (agent: AgentConfig) => Promise<void>;
}) {
  const [name, setName] = useState("");
  const [icon, setIcon] = useState("");
  const [accent, setAccent] = useState(ACCENTS[1]);
  const [context, setContext] = useState("");
  const [model, setModel] = useState(MODELS[0]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const id = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

  const canCreate = name.trim().length > 0;

  const handleCreate = async () => {
    if (!canCreate || loading) return;
    setLoading(true);
    setError(null);
    try {
      await onCreate({
        id: id || `agent-${Date.now()}`,
        name: name.trim(),
        icon: icon || name.trim()[0]?.toUpperCase() || "?",
        accent,
        context: context.trim() || name.trim(),
        model,
      });
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create agent");
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === "Enter" && canCreate) {
      e.stopPropagation();
      handleCreate();
    }
    if (e.key === "Escape") onClose();
  };

  return (
    <div className={styles.overlay} onClick={onClose} onKeyDown={handleKeyDown}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.title}>New Agent</div>

        <div className={styles.row}>
          <div className={styles.field}>
            <label className={styles.label}>Name</label>
            <input
              className={styles.input}
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Research Agent"
              autoFocus
            />
          </div>
          <div className={styles.fieldSmall}>
            <label className={styles.label}>Icon</label>
            <input
              className={styles.input}
              value={icon}
              onChange={(e) => setIcon(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="&#x25CE;"
              style={{ textAlign: "center" }}
            />
          </div>
        </div>

        <div className={styles.field}>
          <label className={styles.label}>Color</label>
          <div className={styles.colors}>
            {ACCENTS.map((c) => (
              <div
                key={c}
                className={`${styles.colorSwatch} ${accent === c ? styles.colorSwatchActive : ""}`}
                style={{ backgroundColor: c }}
                onClick={() => setAccent(c)}
              />
            ))}
          </div>
        </div>

        <div className={styles.field}>
          <label className={styles.label}>Context</label>
          <input
            className={styles.input}
            value={context}
            onChange={(e) => setContext(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Deep web research &amp; synthesis"
          />
        </div>

        <div className={styles.field}>
          <label className={styles.label}>Model</label>
          <select
            className={styles.select}
            value={model}
            onChange={(e) => setModel(e.target.value)}
          >
            {MODELS.map((m) => (
              <option key={m} value={m}>{m}</option>
            ))}
          </select>
        </div>

        {error && <div className={styles.error}>{error}</div>}

        <div className={styles.actions}>
          <button className={styles.cancelBtn} onClick={onClose} disabled={loading}>
            Cancel
          </button>
          <button
            className={styles.createBtn}
            disabled={!canCreate || loading}
            onClick={handleCreate}
          >
            {loading ? "Creating..." : "Create"}
          </button>
        </div>
      </div>
    </div>
  );
}
