import { useState, useEffect, useRef } from "react";

const STORAGE_KEY = "visionaire.cortex.auth";

/** Check if user is already authenticated */
export function isAuthenticated(): boolean {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return false;
    const { expiry, token } = JSON.parse(stored);
    return expiry && token && Date.now() < expiry;
  } catch {
    return false;
  }
}

/** Get the stored gateway token */
export function getStoredToken(): string {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return "";
    const { token } = JSON.parse(stored);
    return token || "";
  } catch {
    return "";
  }
}

/** Store auth state + token */
function setAuthenticated(token: string) {
  const expiry = Date.now() + 30 * 24 * 60 * 60 * 1000; // 30 days
  localStorage.setItem(STORAGE_KEY, JSON.stringify({ expiry, token }));
}

/** Clear auth */
export function logout() {
  localStorage.removeItem(STORAGE_KEY);
  window.location.reload();
}

interface LoginScreenProps {
  onSuccess: () => void;
}

export function LoginScreen({ onSuccess }: LoginScreenProps) {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [shake, setShake] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password.trim()) return;

    setLoading(true);
    setError("");

    // Validate against the gateway token
    try {
      const gatewayUrl =
        import.meta.env.VITE_GATEWAY_URL || "wss://gateway.visionaire.co";
      const ws = new WebSocket(gatewayUrl);

      const timeout = setTimeout(() => {
        ws.close();
        setError("Connection timeout");
        setLoading(false);
      }, 8000);

      ws.onopen = () => {
        // Send a connect request with the password as token
        ws.send(
          JSON.stringify({
            type: "req",
            id: "auth-check",
            method: "connect",
            params: {
              client: {
                id: "gateway-client",
                version: "2026.3.8",
                platform: "web",
                mode: "webchat",
              },
              minProtocol: 3,
              maxProtocol: 3,
              role: "operator",
              scopes: ["operator.read", "operator.write"],
              auth: { token: password.trim() },
            },
          })
        );
      };

      ws.onmessage = (evt) => {
        clearTimeout(timeout);
        try {
          const frame = JSON.parse(evt.data);

          // Handle challenge — for now we just check if connect succeeds
          if (frame.type === "event" && frame.event === "connect.challenge") {
            // Re-send connect after challenge
            ws.send(
              JSON.stringify({
                type: "req",
                id: "auth-check-2",
                method: "connect",
                params: {
                  client: {
                    id: "gateway-client",
                    version: "2026.3.8",
                    platform: "web",
                    mode: "webchat",
                  },
                  minProtocol: 3,
                  maxProtocol: 3,
                  role: "operator",
                  scopes: ["operator.read", "operator.write"],
                  auth: { token: password.trim() },
                },
              })
            );
            return;
          }

          if (frame.type === "res" && (frame.id === "auth-check" || frame.id === "auth-check-2")) {
            ws.close();
            if (frame.ok) {
              setAuthenticated(password.trim());
              onSuccess();
            } else {
              setError("Invalid password");
              setShake(true);
              setTimeout(() => setShake(false), 500);
              setLoading(false);
            }
          }
        } catch {
          ws.close();
          setError("Authentication failed");
          setLoading(false);
        }
      };

      ws.onerror = () => {
        clearTimeout(timeout);
        setError("Connection failed");
        setLoading(false);
      };

      ws.onclose = (evt) => {
        clearTimeout(timeout);
        if (evt.code === 1008 || evt.code === 4001) {
          setError("Invalid password");
          setShake(true);
          setTimeout(() => setShake(false), 500);
          setLoading(false);
        }
      };
    } catch {
      setError("Connection failed");
      setLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      {/* Ambient glow */}
      <div style={styles.glow} />
      <div style={styles.glowSecondary} />

      <div style={{
        ...styles.card,
        ...(shake ? styles.shake : {}),
      }}>
        {/* Logo / Brand */}
        <div style={styles.brand}>
          <div style={styles.logoMark}>V</div>
          <h1 style={styles.title}>Visionaire Cortex</h1>
          <p style={styles.subtitle}>Neural command interface</p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} style={styles.form}>
          <div style={styles.inputWrapper}>
            <input
              ref={inputRef}
              type="password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                setError("");
              }}
              placeholder="Enter access key"
              style={styles.input}
              autoComplete="current-password"
              disabled={loading}
            />
            <div style={{
              ...styles.inputFocusLine,
              ...(password ? styles.inputFocusLineActive : {}),
            }} />
          </div>

          {error && (
            <div style={styles.error}>{error}</div>
          )}

          <button
            type="submit"
            disabled={loading || !password.trim()}
            style={{
              ...styles.button,
              ...(loading || !password.trim() ? styles.buttonDisabled : {}),
            }}
          >
            {loading ? (
              <span style={styles.spinner}>◌</span>
            ) : (
              "Authenticate"
            )}
          </button>
        </form>

        {/* Footer */}
        <div style={styles.footer}>
          <span style={styles.footerDot} />
          <span style={styles.footerText}>Visionaire Labs</span>
        </div>
      </div>
    </div>
  );
}

// ─── Styles ───

const styles: Record<string, React.CSSProperties> = {
  container: {
    width: "100%",
    height: "100%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "#0a0b10",
    position: "relative",
    overflow: "hidden",
    fontFamily: "'DM Sans', sans-serif",
  },
  glow: {
    position: "absolute",
    top: "20%",
    left: "50%",
    transform: "translate(-50%, -50%)",
    width: "600px",
    height: "600px",
    background: "radial-gradient(circle, rgba(34, 211, 238, 0.06) 0%, transparent 70%)",
    pointerEvents: "none",
  },
  glowSecondary: {
    position: "absolute",
    bottom: "10%",
    right: "20%",
    width: "400px",
    height: "400px",
    background: "radial-gradient(circle, rgba(167, 139, 250, 0.04) 0%, transparent 70%)",
    pointerEvents: "none",
  },
  card: {
    width: "100%",
    maxWidth: "380px",
    padding: "48px 40px",
    background: "rgba(255, 255, 255, 0.03)",
    border: "1px solid rgba(255, 255, 255, 0.06)",
    borderRadius: "16px",
    backdropFilter: "blur(20px)",
    position: "relative",
    zIndex: 1,
  },
  shake: {
    animation: "shake 0.5s ease-in-out",
  },
  brand: {
    textAlign: "center" as const,
    marginBottom: "40px",
  },
  logoMark: {
    width: "48px",
    height: "48px",
    margin: "0 auto 16px",
    background: "linear-gradient(135deg, #22d3ee, #a78bfa)",
    borderRadius: "12px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "24px",
    fontWeight: 700,
    color: "#0a0b10",
    letterSpacing: "-1px",
  },
  title: {
    fontSize: "20px",
    fontWeight: 600,
    color: "rgba(255, 255, 255, 0.92)",
    letterSpacing: "-0.3px",
    margin: 0,
  },
  subtitle: {
    fontSize: "13px",
    color: "rgba(255, 255, 255, 0.35)",
    marginTop: "6px",
    letterSpacing: "0.5px",
    textTransform: "uppercase" as const,
    fontWeight: 500,
  },
  form: {
    display: "flex",
    flexDirection: "column" as const,
    gap: "16px",
  },
  inputWrapper: {
    position: "relative" as const,
  },
  input: {
    width: "100%",
    padding: "14px 16px",
    background: "rgba(255, 255, 255, 0.05)",
    border: "1px solid rgba(255, 255, 255, 0.08)",
    borderRadius: "10px",
    color: "rgba(255, 255, 255, 0.9)",
    fontSize: "14px",
    fontFamily: "'JetBrains Mono', monospace",
    outline: "none",
    transition: "border-color 0.2s, background 0.2s",
    letterSpacing: "2px",
  },
  inputFocusLine: {
    position: "absolute" as const,
    bottom: 0,
    left: "50%",
    transform: "translateX(-50%)",
    width: "0%",
    height: "2px",
    background: "linear-gradient(90deg, #22d3ee, #a78bfa)",
    borderRadius: "1px",
    transition: "width 0.3s ease",
  },
  inputFocusLineActive: {
    width: "90%",
  },
  error: {
    fontSize: "12px",
    color: "#f87171",
    textAlign: "center" as const,
    padding: "4px 0",
  },
  button: {
    padding: "14px",
    background: "linear-gradient(135deg, rgba(34, 211, 238, 0.15), rgba(167, 139, 250, 0.15))",
    border: "1px solid rgba(34, 211, 238, 0.2)",
    borderRadius: "10px",
    color: "rgba(255, 255, 255, 0.9)",
    fontSize: "14px",
    fontWeight: 600,
    fontFamily: "'DM Sans', sans-serif",
    cursor: "pointer",
    transition: "all 0.2s",
    letterSpacing: "0.3px",
  },
  buttonDisabled: {
    opacity: 0.4,
    cursor: "not-allowed",
  },
  spinner: {
    display: "inline-block",
    animation: "spin 1s linear infinite",
  },
  footer: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "6px",
    marginTop: "32px",
  },
  footerDot: {
    width: "6px",
    height: "6px",
    borderRadius: "50%",
    background: "rgba(34, 211, 238, 0.4)",
  },
  footerText: {
    fontSize: "11px",
    color: "rgba(255, 255, 255, 0.2)",
    letterSpacing: "1.5px",
    textTransform: "uppercase" as const,
    fontWeight: 500,
  },
};
