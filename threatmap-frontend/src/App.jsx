import { useEffect, useState } from 'react';
import { ComposableMap, Geographies, Geography, Line } from 'react-simple-maps';

// Mapa mundi
const geoUrl = "https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json";

// 🎨 Dicionário de cores baseado nas regras de negócio do seu TCC
const attackColors = {
  "DDoS": "#ff4b4b",       // Vermelho intenso
  "Malware": "#fbbf24",    // Amarelo
  "Phishing": "#60a5fa",   // Azul claro
  "Brute Force": "#f97316" // Laranja
};

function App() {
  const [attacks, setAttacks] = useState([]);

  useEffect(() => {
    let ws;
    let reconnectTimeout;

    const connectWebSocket = () => {
      // Cria a conexão com o backend real
      ws = new WebSocket('wss://threatmap-backend-ustt.onrender.com/ws/live');

      ws.onopen = () => {
        console.log("✅ Conectado ao servidor!");
      };

      ws.onmessage = (event) => {
        const newAttack = JSON.parse(event.data);
        setAttacks((prev) => {
          const updated = [newAttack, ...prev];
          return updated.slice(0, 15);
        });
      };

      ws.onclose = () => {
        console.log("⚠️ Conexão caiu. O Render deve estar acordando. Tentando reconectar em 5 segundos...");
        // Tenta conectar de novo após 5 segundos
        reconnectTimeout = setTimeout(connectWebSocket, 5000);
      };

      ws.onerror = (err) => {
        console.error("❌ Erro no WebSocket. Fechando conexão para tentar novamente.");
        ws.close(); // Força o onclose a rodar
      };
    };

    // Inicia a primeira tentativa de conexão
    connectWebSocket();

    // Limpa a conexão se o usuário fechar a página
    return () => {
      if (ws) ws.close();
      clearTimeout(reconnectTimeout);
    };
  }, []);

  return (
    <div style={{ display: 'flex', height: '100vh', backgroundColor: '#121212', color: '#e5e5e5', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      
      {/* 🌍 Área do Mapa (75%) */}
      <div style={{ width: '75%', position: 'relative', overflow: 'hidden' }}>
        
        {/* Header HUD (Estilo Painel) */}
        <div style={{ position: 'absolute', top: 20, left: 20, zIndex: 10, backgroundColor: 'rgba(0,0,0,0.6)', padding: '15px 20px', borderRadius: '8px', border: '1px solid #333', backdropFilter: 'blur(4px)' }}>
          <h2 style={{ margin: 0, color: '#fff', fontSize: '24px', letterSpacing: '1px' }}>
            🌐 ThreatMap <span style={{ color: '#ff4b4b' }}>LIVE</span>
          </h2>
          <div style={{ fontSize: '12px', color: '#aaa', marginTop: '6px', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ color: '#4ade80', fontSize: '14px' }}>●</span> WebSocket Conectado
          </div>
        </div>

        {/* Legenda de Cores no rodapé do mapa */}
        <div style={{ position: 'absolute', bottom: 20, left: 20, zIndex: 10, display: 'flex', gap: '15px', backgroundColor: 'rgba(0,0,0,0.6)', padding: '10px 15px', borderRadius: '8px', border: '1px solid #333', fontSize: '12px', fontWeight: 'bold', backdropFilter: 'blur(4px)' }}>
          <span style={{ color: attackColors["DDoS"] }}>■ DDoS</span>
          <span style={{ color: attackColors["Malware"] }}>■ Malware</span>
          <span style={{ color: attackColors["Phishing"] }}>■ Phishing</span>
          <span style={{ color: attackColors["Brute Force"] }}>■ Brute Force</span>
        </div>

        <ComposableMap projection="geoMercator" style={{ width: "100%", height: "100%" }}>
          <Geographies geography={geoUrl}>
            {({ geographies }) =>
              geographies.map((geo) => (
                <Geography 
                  key={geo.rsmKey} 
                  geography={geo} 
                  fill="#262626" 
                  stroke="#121212" 
                  strokeWidth={0.5} 
                  style={{ default: { outline: "none" }, hover: { outline: "none" }, pressed: { outline: "none" } }}
                />
              ))
            }
          </Geographies>
          
          {/* Linhas animadas das ameaças */}
          {attacks.map((attack) => (
            <Line
              key={attack.id}
              from={[attack.source.lng, attack.source.lat]}
              to={[attack.dest.lng, attack.dest.lat]}
              stroke={attackColors[attack.type] || "#ffffff"}
              strokeWidth={3}
              strokeLinecap="round"
              style={{ opacity: 0.8 }}
            />
          ))}
        </ComposableMap>
      </div>

      {/* 📊 Sidebar Lateral (Feed de Eventos - 25%) */}
      <div style={{ width: '25%', backgroundColor: '#1a1a1a', borderLeft: '1px solid #333', display: 'flex', flexDirection: 'column' }}>
        <div style={{ padding: '20px', borderBottom: '1px solid #333', backgroundColor: '#121212' }}>
          <h3 style={{ margin: 0, textTransform: 'uppercase', letterSpacing: '1px', fontSize: '16px', color: '#fff' }}>Feed de Eventos</h3>
        </div>
        
        <div style={{ flex: 1, overflowY: 'auto', padding: '15px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {attacks.map(attack => (
            // Card individual de cada ataque
            <div key={attack.id} style={{ 
              backgroundColor: '#262626', 
              padding: '12px', 
              borderRadius: '6px', 
              fontSize: '13px', 
              borderLeft: `4px solid ${attackColors[attack.type]}`, 
              boxShadow: '0 4px 6px rgba(0,0,0,0.3)' 
            }}>
              
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                <strong style={{ color: attackColors[attack.type], textTransform: 'uppercase', fontSize: '13px', letterSpacing: '0.5px' }}>
                  {attack.type}
                </strong>
                <span style={{ color: '#666', fontSize: '11px', fontFamily: 'monospace' }}>ID:{attack.id}</span>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', color: '#ccc', fontFamily: 'monospace' }}>
                <div style={{ backgroundColor: '#1e1e1e', padding: '6px', borderRadius: '4px' }}>
                  <span style={{ color: '#888', fontSize: '10px', display: 'block', marginBottom: '2px' }}>ORIGEM</span>
                  {attack.source.lat.toFixed(2)}<br/>{attack.source.lng.toFixed(2)}
                </div>
                <div style={{ backgroundColor: '#1e1e1e', padding: '6px', borderRadius: '4px' }}>
                  <span style={{ color: '#888', fontSize: '10px', display: 'block', marginBottom: '2px' }}>DESTINO</span>
                  {attack.dest.lat.toFixed(2)}<br/>{attack.dest.lng.toFixed(2)}
                </div>
              </div>

            </div>
          ))}
        </div>
      </div>

    </div>
  );
}

export default App;
