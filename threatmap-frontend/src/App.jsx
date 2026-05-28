import { useEffect, useState, useRef } from "react";
import AnimatedAttackLine from "./AnimatedAttackLine";
import NodeMarker from "./NodeMarker";
import { ComposableMap, Geographies, Geography } from "react-simple-maps";

const geoUrl = "https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json";

const ATTACK_META = {
  "DDoS":        { color: "#f87171", glow: "rgba(248,113,113,0.5)",  gradient: "linear-gradient(135deg,#7f1d1d,#450a0a)", label: "DDoS"        },
  "Malware":     { color: "#fbbf24", glow: "rgba(251,191,36,0.5)",   gradient: "linear-gradient(135deg,#78350f,#3f1d0a)", label: "Malware"     },
  "Phishing":    { color: "#60a5fa", glow: "rgba(96,165,250,0.5)",   gradient: "linear-gradient(135deg,#1e3a6e,#0c1a3d)", label: "Phishing"    },
  "Brute Force": { color: "#c084fc", glow: "rgba(192,132,252,0.5)",  gradient: "linear-gradient(135deg,#4a1d6e,#1e0a3d)", label: "Brute Force" },
};

// ── Glass base shared style
const glass = {
  background: "rgba(14, 14, 18, 0.58)",
  backdropFilter: "blur(28px) saturate(160%)",
  WebkitBackdropFilter: "blur(28px) saturate(160%)",
  border: "1px solid rgba(255,255,255,0.07)",
  boxShadow: "0 8px 40px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.05)",
};

function GlowBadge({ type }) {
  const m = ATTACK_META[type];
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 5,
      padding: "2px 10px", borderRadius: 99,
      fontSize: 10, fontWeight: 700, letterSpacing: "0.08em",
      color: m.color, fontFamily: "JetBrains Mono, monospace",
      background: `rgba(${hexToRgb(m.color)}, 0.12)`,
      border: `1px solid rgba(${hexToRgb(m.color)}, 0.35)`,
      boxShadow: `0 0 10px rgba(${hexToRgb(m.color)}, 0.2)`,
    }}>
      <span style={{ width: 5, height: 5, borderRadius: "50%", background: m.color, boxShadow: `0 0 6px ${m.color}`, display: "inline-block" }} />
      {type.toUpperCase()}
    </span>
  );
}

function hexToRgb(hex) {
  const r = parseInt(hex.slice(1,3),16);
  const g = parseInt(hex.slice(3,5),16);
  const b = parseInt(hex.slice(5,7),16);
  return `${r},${g},${b}`;
}

function StatPill({ label, value, color }) {
  return (
    <div style={{
      ...glass,
      padding: "10px 18px",
      borderRadius: 14,
      display: "flex", flexDirection: "column", gap: 2,
      borderColor: `rgba(${hexToRgb(color)}, 0.2)`,
      boxShadow: `0 0 20px rgba(${hexToRgb(color)}, 0.08), ${glass.boxShadow}`,
      minWidth: 90,
    }}>
      <span style={{ fontSize: 9, color: "rgba(255,255,255,0.4)", fontFamily: "JetBrains Mono, monospace", letterSpacing: "0.12em", textTransform: "uppercase" }}>
        {label}
      </span>
      <span style={{ fontSize: 20, fontWeight: 700, color, fontFamily: "JetBrains Mono, monospace", lineHeight: 1 }}>
        {value}
      </span>
    </div>
  );
}

export default function App() {
  const [attacks, setAttacks]       = useState([]);
  const [connected, setConnected]   = useState(false);
  const [activeMarkers, setActiveMarkers] = useState([]);
  const [stats, setStats]           = useState({ total: 0, aps: 0, ddos: 0, malware: 0, phishing: 0, brute: 0 });
  const apsBuffer = useRef(0);

  useEffect(() => {
    // Inject fonts
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = "https://fonts.googleapis.com/css2?family=Syne:wght@700;800&family=JetBrains+Mono:wght@400;600;700&display=swap";
    document.head.appendChild(link);
    return () => document.head.removeChild(link);
  }, []);

  useEffect(() => {
    let ws, reconnectTimeout;

    const connect = () => {
      const isLocal = ["localhost","127.0.0.1"].includes(window.location.hostname);
      ws = new WebSocket(isLocal
        ? "ws://localhost:8000/ws/live"
        : "wss://threatmap-backend-ustt.onrender.com/ws/live");

      ws.onopen  = () => setConnected(true);
      ws.onclose = () => { setConnected(false); reconnectTimeout = setTimeout(connect, 5000); };
      ws.onerror = () => ws.close();

      ws.onmessage = (e) => {
        const attack = JSON.parse(e.data);
        const color  = ATTACK_META[attack.type]?.color || "#fff";
        const key    = attack.id;

        setActiveMarkers(prev =>
          [...prev,
            { key: `${key}-src`, location: attack.source, color, role: "source" },
            { key: `${key}-dst`, location: attack.dest,   color, role: "dest"   },
          ].slice(-50)
        );
        setTimeout(() => setActiveMarkers(prev => prev.filter(m => !m.key.startsWith(key))), 4000);

        apsBuffer.current++;
        setStats(prev => ({
          ...prev,
          total:    prev.total + 1,
          ddos:     prev.ddos     + (attack.type === "DDoS"        ? 1 : 0),
          malware:  prev.malware  + (attack.type === "Malware"     ? 1 : 0),
          phishing: prev.phishing + (attack.type === "Phishing"    ? 1 : 0),
          brute:    prev.brute    + (attack.type === "Brute Force"  ? 1 : 0),
        }));
        setAttacks(prev => [attack, ...prev].slice(0, 18));
      };
    };

    connect();
    const apsInterval = setInterval(() => {
      setStats(prev => ({ ...prev, aps: apsBuffer.current }));
      apsBuffer.current = 0;
    }, 1000);

    return () => { if (ws) ws.close(); clearTimeout(reconnectTimeout); clearInterval(apsInterval); };
  }, []);

  return (
    <div style={{ position: "relative", width: "100vw", height: "100vh", overflow: "hidden", background: "#0c0c0e", fontFamily: "JetBrains Mono, monospace" }}>

      {/* ══ KEYFRAMES & GLOBAL CSS ══ */}
      <style>{`
        @keyframes orb-drift-1 {
          0%,100% { transform: translate(0,0) scale(1); }
          33%      { transform: translate(60px,-40px) scale(1.15); }
          66%      { transform: translate(-30px,50px) scale(0.9); }
        }
        @keyframes orb-drift-2 {
          0%,100% { transform: translate(0,0) scale(1); }
          50%      { transform: translate(-80px,60px) scale(1.2); }
        }
        @keyframes orb-drift-3 {
          0%,100% { transform: translate(0,0) scale(1); }
          40%      { transform: translate(50px,80px) scale(0.85); }
          80%      { transform: translate(-60px,-30px) scale(1.1); }
        }
        @keyframes pulse-status {
          0%,100% { box-shadow: 0 0 0 0 rgba(34,197,94,0.6); }
          50%      { box-shadow: 0 0 0 6px rgba(34,197,94,0); }
        }
        @keyframes fade-in-up {
          from { opacity: 0; transform: translateY(12px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes shimmer {
          0%   { background-position: -200% center; }
          100% { background-position:  200% center; }
        }
        ::-webkit-scrollbar { width: 3px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 99px; }
        * { box-sizing: border-box; }
      `}</style>

      {/* ══ BACKGROUND ORBS ══ */}
      <div style={{ position: "absolute", inset: 0, pointerEvents: "none", zIndex: 0, overflow: "hidden" }}>
        {/* Orb vermelho — canto superior esquerdo */}
        <div style={{
          position: "absolute", top: "-10%", left: "-5%",
          width: 650, height: 650, borderRadius: "50%",
          background: "radial-gradient(circle, rgba(148,163,184,0.1) 0%, transparent 70%)",
          animation: "orb-drift-1 18s ease-in-out infinite", filter: "blur(1px)",
        }} />
        {/* Orb azul/violeta — centro direita */}
        <div style={{
          position: "absolute", top: "20%", right: "-8%",
          width: 700, height: 700, borderRadius: "50%",
          background: "radial-gradient(circle, rgba(100,116,139,0.09) 0%, transparent 70%)",
          animation: "orb-drift-2 22s ease-in-out infinite", filter: "blur(1px)",
        }} />
        {/* Orb ciano — inferior esquerdo */}
        <div style={{
          position: "absolute", bottom: "-15%", left: "25%",
          width: 550, height: 550, borderRadius: "50%",
          background: "radial-gradient(circle, rgba(148,163,184,0.08) 0%, transparent 70%)",
          animation: "orb-drift-3 26s ease-in-out infinite", filter: "blur(1px)",
        }} />
        {/* Orb roxo — centro */}
        <div style={{
          position: "absolute", top: "45%", left: "45%",
          width: 400, height: 400, borderRadius: "50%",
          background: "radial-gradient(circle, rgba(71,85,105,0.1) 0%, transparent 70%)",
          animation: "orb-drift-1 30s ease-in-out infinite reverse",
        }} />
        {/* Vinheta de borda */}
        <div style={{
          position: "absolute", inset: 0,
          background: "radial-gradient(ellipse at 50% 50%, transparent 35%, rgba(0,0,0,0.82) 100%)",
        }} />
      </div>

      {/* ══ MAPA (fundo full-screen) ══ */}
      <div style={{ position: "absolute", inset: 0, zIndex: 1 }}>
        <ComposableMap
          projection="geoMercator"
          projectionConfig={{ scale: 148, center: [10, 15] }}
          style={{ width: "100%", height: "100%" }}
        >
          <Geographies geography={geoUrl}>
            {({ geographies }) =>
              geographies.map(geo => (
                <Geography
                  key={geo.rsmKey}
                  geography={geo}
                  fill="rgba(255,255,255,0.025)"
                  stroke="rgba(255,255,255,0.07)"
                  strokeWidth={0.4}
                  style={{ default: { outline: "none" }, hover: { outline: "none", fill: "rgba(255,255,255,0.04)" }, pressed: { outline: "none" } }}
                />
              ))
            }
          </Geographies>

          {activeMarkers.map(m => (
            <NodeMarker key={m.key} location={m.location} color={m.color} role={m.role} />
          ))}

          {attacks.map(attack => (
            <AnimatedAttackLine
              key={attack.id}
              attack={attack}
              color={ATTACK_META[attack.type]?.color || "#fff"}
            />
          ))}
        </ComposableMap>
      </div>

      {/* ══ HEADER BAR ══ */}
      <header style={{
        position: "absolute", top: 0, left: 0, right: 0, zIndex: 10,
        height: 58,
        ...glass,
        borderRadius: 0,
        borderTop: "none", borderLeft: "none", borderRight: "none",
        display: "flex", alignItems: "center",
        padding: "0 24px", gap: 20,
      }}>
        {/* Logo */}
        <div style={{ display: "flex", alignItems: "baseline", gap: 1 }}>
          <span style={{
            fontFamily: "Syne, sans-serif", fontSize: 22, fontWeight: 800,
            background: "linear-gradient(90deg, #f1f5f9, #94a3b8, #e2e8f0)",
            backgroundSize: "200% auto",
            WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
            animation: "shimmer 4s linear infinite",
          }}>THREAT</span>
          <span style={{ fontFamily: "Syne, sans-serif", fontSize: 22, fontWeight: 800, color: "rgba(255,255,255,0.9)" }}>MAP</span>
        </div>

        {/* Status badge */}
        <div style={{
          display: "flex", alignItems: "center", gap: 6,
          padding: "4px 12px", borderRadius: 99,
          background: connected ? "rgba(34,197,94,0.1)" : "rgba(239,68,68,0.1)",
          border: `1px solid ${connected ? "rgba(34,197,94,0.3)" : "rgba(239,68,68,0.3)"}`,
        }}>
          <div style={{
            width: 7, height: 7, borderRadius: "50%",
            background: connected ? "#22c55e" : "#ef4444",
            animation: connected ? "pulse-status 1.8s infinite" : "none",
          }} />
          <span style={{ fontSize: 10, fontWeight: 600, color: connected ? "#22c55e" : "#ef4444", letterSpacing: "0.1em" }}>
            {connected ? "LIVE" : "RECONNECTING"}
          </span>
        </div>

        {/* Spacer */}
        <div style={{ flex: 1 }} />

        {/* Stats inline */}
        <div style={{ display: "flex", gap: 24, alignItems: "center" }}>
          {[
            { label: "TOTAL",  val: stats.total.toLocaleString("pt-BR"), color: "rgba(255,255,255,0.7)" },
            { label: "APS",    val: stats.aps,  color: stats.aps > 2 ? "#f87171" : "#fbbf24" },
          ].map(s => (
            <div key={s.label} style={{ textAlign: "center" }}>
              <div style={{ fontSize: 8, color: "rgba(255,255,255,0.3)", letterSpacing: "0.14em" }}>{s.label}</div>
              <div style={{ fontSize: 16, fontWeight: 700, color: s.color }}>{s.val}</div>
            </div>
          ))}
          <div style={{ width: 1, height: 28, background: "rgba(255,255,255,0.08)" }} />
          {Object.entries(ATTACK_META).map(([type, m]) => (
            <div key={type} style={{ textAlign: "center" }}>
              <div style={{ fontSize: 8, color: m.color, letterSpacing: "0.1em", opacity: 0.8 }}>{m.label.toUpperCase()}</div>
              <div style={{ fontSize: 16, fontWeight: 700, color: m.color }}>
                {type === "DDoS" ? stats.ddos : type === "Malware" ? stats.malware : type === "Phishing" ? stats.phishing : stats.brute}
              </div>
            </div>
          ))}
        </div>
      </header>

      {/* ══ FLOATING SIDEBAR ══ */}
      <aside style={{
        position: "absolute", top: 74, right: 18, bottom: 18,
        width: 290, zIndex: 10,
        ...glass,
        borderRadius: 20,
        display: "flex", flexDirection: "column",
        overflow: "hidden",
      }}>
        {/* Sidebar header */}
        <div style={{
          padding: "16px 18px 12px",
          borderBottom: "1px solid rgba(255,255,255,0.06)",
          flexShrink: 0,
        }}>
          <div style={{ fontSize: 9, color: "rgba(255,255,255,0.3)", letterSpacing: "0.16em", marginBottom: 2 }}>
            LIVE FEED
          </div>
          <div style={{ fontSize: 13, fontWeight: 600, color: "rgba(255,255,255,0.85)", fontFamily: "Syne, sans-serif" }}>
            Eventos de Ataque
          </div>
        </div>

        {/* Feed */}
        <div style={{ flex: 1, overflowY: "auto", padding: "10px 12px", display: "flex", flexDirection: "column", gap: 8 }}>
          {attacks.map((attack, i) => {
            const m = ATTACK_META[attack.type] || ATTACK_META["DDoS"];
            const ts = new Date(attack.timestamp).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
            const isFirst = i === 0;
            return (
              <div
                key={attack.id}
                style={{
                  borderRadius: 14,
                  padding: "11px 13px",
                  background: isFirst
                    ? `rgba(${hexToRgb(m.color)}, 0.1)`
                    : "rgba(255,255,255,0.025)",
                  border: `1px solid ${isFirst ? `rgba(${hexToRgb(m.color)}, 0.3)` : "rgba(255,255,255,0.05)"}`,
                  boxShadow: isFirst ? `0 0 20px rgba(${hexToRgb(m.color)}, 0.12)` : "none",
                  animation: isFirst ? "fade-in-up 0.3s ease-out" : "none",
                  transition: "all 0.3s ease",
                }}
              >
                {/* Top row */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                  <GlowBadge type={attack.type} />
                  <span style={{ fontSize: 9, color: "rgba(255,255,255,0.25)", letterSpacing: "0.05em" }}>{ts}</span>
                </div>

                {/* Route */}
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 8, color: "rgba(255,255,255,0.3)", marginBottom: 2, letterSpacing: "0.1em" }}>ORIGEM</div>
                    <div style={{ fontSize: 11, color: "rgba(255,255,255,0.75)", fontWeight: 600 }}>{attack.source.name}</div>
                  </div>
                  <div style={{ color: m.color, fontSize: 14, opacity: 0.8 }}>→</div>
                  <div style={{ flex: 1, textAlign: "right" }}>
                    <div style={{ fontSize: 8, color: "rgba(255,255,255,0.3)", marginBottom: 2, letterSpacing: "0.1em" }}>DESTINO</div>
                    <div style={{ fontSize: 11, color: m.color, fontWeight: 600 }}>{attack.dest.name}</div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </aside>

      {/* ══ FLOATING LEGEND (bottom center) ══ */}
      <div style={{
        position: "absolute", bottom: 20, left: "50%",
        transform: "translateX(-50%)",
        zIndex: 10,
        ...glass,
        borderRadius: 99,
        padding: "8px 22px",
        display: "flex", gap: 22, alignItems: "center",
      }}>
        {Object.entries(ATTACK_META).map(([type, m]) => (
          <div key={type} style={{ display: "flex", alignItems: "center", gap: 7 }}>
            <div style={{
              width: 8, height: 8, borderRadius: "50%",
              background: m.color,
              boxShadow: `0 0 8px ${m.color}, 0 0 16px rgba(${hexToRgb(m.color)}, 0.4)`,
            }} />
            <span style={{ fontSize: 10, color: "rgba(255,255,255,0.55)", letterSpacing: "0.06em" }}>
              {type}
            </span>
          </div>
        ))}
      </div>

    </div>
  );
}
