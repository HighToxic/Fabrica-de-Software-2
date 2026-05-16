import { useContext } from "react";
import { MapContext } from "react-simple-maps";
import { motion } from "framer-motion";

/**
 * NodeMarker
 * Exibe um marcador pulsante no mapa para nós ativos (origem ou destino de ataque).
 *
 * Props:
 *  - location : { lat, lng, name }
 *  - color    : string (hex)
 *  - role     : "source" | "dest"
 */
const NodeMarker = ({ location, color, role }) => {
  const { projection } = useContext(MapContext);

  const coords = projection([location.lng, location.lat]);
  if (!coords) return null;

  const [x, y] = coords;

  // Destinos têm animação mais intensa (estão "sofrendo" o ataque)
  const isTarget = role === "dest";

  return (
    <g>
      {/* ── Anel externo lento ── */}
      <motion.circle
        cx={x} cy={y} r={isTarget ? 10 : 7}
        fill="none"
        stroke={color}
        strokeWidth={0.8}
        style={{ transformOrigin: `${x}px ${y}px` }}
        initial={{ scale: 0.6, opacity: 0 }}
        animate={{ scale: [0.6, 1.6, 0.6], opacity: [0, 0.5, 0] }}
        transition={{ duration: 2, repeat: 2, ease: "easeInOut" }}
      />

      {/* ── Anel médio (mais brilhante) ── */}
      <motion.circle
        cx={x} cy={y} r={isTarget ? 6 : 4}
        fill="none"
        stroke={color}
        strokeWidth={1}
        style={{ filter: `blur(1px)`, transformOrigin: `${x}px ${y}px` }}
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: [0.8, 2, 0.8], opacity: [0.2, 0.8, 0.2] }}
        transition={{ duration: 1.4, repeat: 3, ease: "easeOut" }}
      />

      {/* ── Glow atrás do dot (só no destino) ── */}
      {isTarget && (
        <motion.circle
          cx={x} cy={y} r={5}
          fill={color}
          style={{ filter: `blur(5px)`, transformOrigin: `${x}px ${y}px` }}
          initial={{ opacity: 0, scale: 0 }}
          animate={{ opacity: [0, 0.4, 0.4, 0], scale: [0, 1, 1.3, 0] }}
          transition={{ duration: 3.5, ease: "easeOut" }}
        />
      )}

      {/* ── Dot central sólido ── */}
      <motion.circle
        cx={x} cy={y} r={isTarget ? 3 : 2}
        fill={color}
        style={{ filter: `drop-shadow(0 0 4px ${color})` }}
        initial={{ opacity: 0, scale: 0 }}
        animate={{ opacity: [0, 1, 1, 0], scale: [0, 1.2, 1, 0] }}
        transition={{ duration: isTarget ? 3.5 : 2.5, ease: "easeOut" }}
      />
    </g>
  );
};

export default NodeMarker;
