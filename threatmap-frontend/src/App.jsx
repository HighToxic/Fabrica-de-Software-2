import { useEffect, useState, useRef } from "react";
import AnimatedAttackLine from "./AnimatedAttackLine";
import NodeMarker from "./NodeMarker";
import { ComposableMap, Geographies, Geography } from "react-simple-maps";

const geoUrl = "https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json";

const ATTACK_COLORS = {
  "DDoS":        { main: "#ff4b4b", bg: "rgba(255,75,75,0.12)",   glow: "rgba(255,75,75,0.35)"   },
  "Malware":     { main: "#fbbf24", bg: "rgba(251,191,36,0.12)",  glow: "rgba(251,191,36,0.35)"  },
  "Phishing":    { main: "#60a5fa", bg: "rgba(96,165,250,0.12)",  glow: "rgba(96,165,250,0.35)"  },
  "Brute Force": { main: "#a855f7", bg: "rgba(168,85,247,0.12)",  glow: "rgba(168,85,247,0.35)"  },
};

const ATTACK_ICONS = {
  "DDoS":        "⚡",
  "Malware":     "☣",
  "Phishing":    "🎣",
  "Brute Force": "🔓",
};

function StatBox({ label, value, color, icon }) {
  return (
    <div style={{
      flex: 1,
      padding: "12px 16px",
      borderRight: "1px solid #1e2533",
      display: "flex",
      flexDirection: "column",
      gap: 2,
    }}>
      <span style={{ fontSize: 10, color: "#4b5563", textTransform: "uppercase", letterSpacing: "0.1em", fontFamily: "monospace" }}>
        {icon} {label}
      </span>
      <span style={{ fontSize: 22, fontWeight: 700, color: color || "#e2e8f0", fontFamily: "monospace", lineHeight: 1.2 }}>
        {typeof value === "number" ? value.toLocaleString("pt-BR") : value}
      </span>
    </div>
  );
}

export default function App() {
  const [attacks, setAttacks] = useState([]);
  const [connected, setConnected] = useState(false);
  const [stats, setStats] = useState({ total: 0, ddos: 0, malware: 0, phishing: 0, brute: 0, aps: 0 });
  // activeMarkers: array de { key, location, color, role } — renderizado como NodeMarker no mapa
  const [activeMarkers, setActiveMarkers] = useState([]);
  const apsBuffer = useRef(0);

  useEffect(() => {
    let ws;
    let reconnectTimeout;

    const connect = () => {
      const isLocal = window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1";
      const url = isLocal
        ? "ws://localhost:8000/ws/live"
        : "wss://threatmap-backend-ustt.onrender.com/ws/live";

      ws = new WebSocket(url);

      ws.onopen = () => setConnected(true);

      ws.onmessage = (e) => {
        const attack = JSON.parse(e.data);
        const color = ATTACK_COLORS[attack.type]?.main || "#fff";
        const markerKey = attack.id;

        // Adiciona marcadores para origem e destino
        setActiveMarkers((prev) =>
          [...prev,
            { key: `${markerKey}-src`, location: attack.source, color, role: "source" },
            { key: `${markerKey}-dst`, location: attack.dest,   color, role: "dest"   },
          ].slice(-40)
        );

        // Remove após a animação terminar (~4s)
        setTimeout(() => {
          setActiveMarkers((prev) => prev.filter((m) => !m.key.startsWith(markerKey)));
        }, 4000);

        apsBuffer.current++;

        setStats((prev) => ({
          ...prev,
          total:    prev.total + 1,
          ddos:     prev.ddos    + (attack.type === "DDoS"        ? 1 : 0),
          malware:  prev.malware + (attack.type === "Malware"     ? 1 : 0),
          phishing: prev.phishing + (attack.type === "Phishing"   ? 1 : 0),
          brute:    prev.brute   + (attack.type === "Brute Force" ? 1 : 0),
        }));

        setAttacks((prev) => [attack, ...prev].slice(0, 20));
      };

      ws.onclose = () => {
        setConnected(false);
        reconnectTimeout = setTimeout(connect, 5000);
      };

      ws.onerror = () => ws.close();
    };

    connect();

    // Atualiza ataques/segundo a cada segundo
    const apsInterval = setInterval(() => {
      setStats((prev) => ({ ...prev, aps: apsBuffer.current }));
      apsBuffer.current = 0;
    }, 1000);

    return () => {
      if (ws) ws.close();
      clearTimeout(reconnectTimeout);
      clearInterval(apsInterval);
    };
  }, []);

  return (
    <div style={{
      display: "flex",
      flexDirection: "column",
      height: "100vh",
      backgroundColor: "#080c12",
      color: "#e2e8f0",
      fontFamily: "'IBM Plex Mono', 'Courier New', monospace",
      overflow: "hidden",
    }}>

      {/* ═══ TOP HEADER ═══ */}
      <header style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "10px 24px",
        backgroundColor: "#0a0f18",
        borderBottom: "1px solid #1e2533",
        flexShrink: 0,
        zIndex: 20,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <span style={{ fontSize: 18, letterSpacing: "0.12em", fontWeight: 700, color: "#e2e8f0" }}>
            THREAT<span style={{ color: "#ff4b4b" }}>MAP</span>
          </span>
          <span style={{
            fontSize: 10,
            color: connected ? "#22c55e" : "#ef4444",
            border: `1px solid ${connected ? "#166534" : "#7f1d1d"}`,
            backgroundColor: connected ? "#052e16" : "#1c0608",
            padding: "2px 8px",
            borderRadius: 3,
            letterSpacing: "0.1em",
            display: "flex",
            alignItems: "center",
            gap: 5,
          }}>
            <span style={{
              display: "inline-block",
              width: 6,
              height: 6,
              borderRadius: "50%",
              backgroundColor: connected ? "#22c55e" : "#ef4444",
              boxShadow: connected ? "0 0 6px #22c55e" : "none",
              animation: connected ? "pulse-dot 1.5s infinite" : "none",
            }} />
            {connected ? "LIVE" : "RECONECTANDO..."}
          </span>
        </div>

        {/* Stats bar no header */}
        <div style={{ display: "flex", gap: 24, fontSize: 12, color: "#6b7280" }}>
          <span>TOTAL <strong style={{ color: "#e2e8f0" }}>{stats.total.toLocaleString("pt-BR")}</strong></span>
          <span style={{ color: "#1e2533" }}>|</span>
          <span>APS <strong style={{ color: stats.aps > 2 ? "#ff4b4b" : "#fbbf24" }}>{stats.aps}</strong></span>
          <span style={{ color: "#1e2533" }}>|</span>
          <span style={{ color: ATTACK_COLORS["DDoS"].main }}>DDoS <strong>{stats.ddos}</strong></span>
          <span style={{ color: ATTACK_COLORS["Malware"].main }}>Malware <strong>{stats.malware}</strong></span>
          <span style={{ color: ATTACK_COLORS["Phishing"].main }}>Phishing <strong>{stats.phishing}</strong></span>
          <span style={{ color: ATTACK_COLORS["Brute Force"].main }}>Brute Force <strong>{stats.brute}</strong></span>
        </div>
      </header>

      {/* ═══ BODY: MAPA + SIDEBAR ═══ */}
      <div style={{ display: "flex", flex: 1, overflow: "hidden" }}>

        {/* ── MAPA ── */}
        <div style={{ flex: 1, position: "relative", overflow: "hidden", background: "radial-gradient(ellipse at 50% 40%, #0d1520 0%, #080c12 70%)" }}>

          {/* Grid overlay sutil */}
          <div style={{
            position: "absolute", inset: 0, zIndex: 1, pointerEvents: "none",
            backgroundImage: "linear-gradient(rgba(30,37,51,0.4) 1px, transparent 1px), linear-gradient(90deg, rgba(30,37,51,0.4) 1px, transparent 1px)",
            backgroundSize: "40px 40px",
          }} />

          {/* Legenda de tipos */}
          <div style={{
            position: "absolute", bottom: 20, left: 20, zIndex: 10,
            display: "flex", gap: 10, flexWrap: "wrap",
            backgroundColor: "rgba(8,12,18,0.85)",
            padding: "8px 14px", borderRadius: 6,
            border: "1px solid #1e2533",
            backdropFilter: "blur(8px)",
          }}>
            {Object.entries(ATTACK_COLORS).map(([type, c]) => (
              <span key={type} style={{ fontSize: 11, color: c.main, display: "flex", alignItems: "center", gap: 5 }}>
                <span style={{ display: "inline-block", width: 8, height: 8, borderRadius: "50%", backgroundColor: c.main, boxShadow: `0 0 6px ${c.main}` }} />
                {type}
              </span>
            ))}
          </div>

          <ComposableMap
            projection="geoMercator"
            projectionConfig={{ scale: 140, center: [10, 15] }}
            style={{ width: "100%", height: "100%", position: "relative", zIndex: 2 }}
          >
            <Geographies geography={geoUrl}>
              {({ geographies }) =>
                geographies.map((geo) => (
                  <Geography
                    key={geo.rsmKey}
                    geography={geo}
                    fill="#111827"
                    stroke="#1e2533"
                    strokeWidth={0.4}
                    style={{
                      default: { outline: "none" },
                      hover:   { outline: "none", fill: "#1a2436" },
                      pressed: { outline: "none" },
                    }}
                  />
                ))
              }
            </Geographies>

            {/* Marcadores pulsantes nos nós ativos (abaixo das linhas) */}
            {activeMarkers.map((m) => (
              <NodeMarker
                key={m.key}
                location={m.location}
                color={m.color}
                role={m.role}
              />
            ))}

            {/* Linhas de ataque animadas (acima dos marcadores) */}
            {attacks.map((attack) => (
              <AnimatedAttackLine
                key={attack.id}
                attack={attack}
                color={ATTACK_COLORS[attack.type]?.main || "#fff"}
              />
            ))}
          </ComposableMap>
        </div>

        {/* ── SIDEBAR ── */}
        <aside style={{
          width: 280,
          backgroundColor: "#0a0f18",
          borderLeft: "1px solid #1e2533",
          display: "flex",
          flexDirection: "column",
          flexShrink: 0,
        }}>
          {/* Cabeçalho da sidebar */}
          <div style={{
            padding: "14px 16px",
            borderBottom: "1px solid #1e2533",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}>
            <span style={{ fontSize: 11, letterSpacing: "0.12em", color: "#6b7280", textTransform: "uppercase" }}>
              Feed de Eventos
            </span>
            <span style={{
              fontSize: 10, color: "#22c55e",
              backgroundColor: "#052e16",
              border: "1px solid #166534",
              padding: "1px 6px", borderRadius: 2,
            }}>
              ● LIVE
            </span>
          </div>

          {/* Cards de ataque */}
          <div style={{ flex: 1, overflowY: "auto", padding: "10px 10px", display: "flex", flexDirection: "column", gap: 8 }}>
            {attacks.map((attack, i) => {
              const c = ATTACK_COLORS[attack.type] || ATTACK_COLORS["DDoS"];
              const ts = new Date(attack.timestamp).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
              return (
                <div
                  key={attack.id}
                  style={{
                    backgroundColor: i === 0 ? c.bg : "rgba(255,255,255,0.02)",
                    border: `1px solid ${i === 0 ? c.main + "55" : "#1e2533"}`,
                    borderLeft: `3px solid ${c.main}`,
                    borderRadius: 5,
                    padding: "10px 12px",
                    fontSize: 11,
                    transition: "background 0.3s",
                    boxShadow: i === 0 ? `0 0 12px ${c.glow}` : "none",
                  }}
                >
                  {/* Header do card */}
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                    <span style={{
                      color: c.main,
                      fontWeight: 700,
                      fontSize: 11,
                      letterSpacing: "0.08em",
                      display: "flex",
                      alignItems: "center",
                      gap: 5,
                    }}>
                      {ATTACK_ICONS[attack.type]} {attack.type.toUpperCase()}
                    </span>
                    <span style={{ color: "#374151", fontSize: 10 }}>{ts}</span>
                  </div>

                  {/* Origem → Destino */}
                  <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <span style={{ color: "#4b5563", fontSize: 10, width: 42, flexShrink: 0 }}>ORIGEM</span>
                      <span style={{ color: "#9ca3af", fontSize: 11, fontFamily: "monospace" }}>{attack.source.name}</span>
                    </div>
                    <div style={{ paddingLeft: 48, color: "#374151", fontSize: 10 }}>▼</div>
                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <span style={{ color: "#4b5563", fontSize: 10, width: 42, flexShrink: 0 }}>DESTINO</span>
                      <span style={{ color: c.main, fontSize: 11, fontFamily: "monospace" }}>{attack.dest.name}</span>
                    </div>
                  </div>

                  {/* ID do ataque */}
                  <div style={{ marginTop: 8, color: "#374151", fontSize: 9, fontFamily: "monospace", borderTop: "1px solid #1e2533", paddingTop: 6 }}>
                    ID: {attack.id}
                  </div>
                </div>
              );
            })}
          </div>
        </aside>
      </div>

      {/* Animação CSS para o dot pulsante do status */}
      <style>{`
        @keyframes pulse-dot {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: #080c12; }
        ::-webkit-scrollbar-thumb { background: #1e2533; border-radius: 2px; }
      `}</style>
    </div>
  );
}
