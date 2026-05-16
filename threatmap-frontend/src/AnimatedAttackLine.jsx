import React, { useContext } from "react";
import { MapContext } from "react-simple-maps";
import { motion } from "framer-motion";

const AnimatedAttackLine = ({ attack, color }) => {
  const { projection } = useContext(MapContext);

  const src = projection([attack.source.lng, attack.source.lat]);
  const dst = projection([attack.dest.lng, attack.dest.lat]);

  if (!src || !dst) return null;

  // Calcula ponto de controle elevado para criar arco curvo (quanto maior a distância, maior o arco)
  const dx = dst[0] - src[0];
  const dy = dst[1] - src[1];
  const dist = Math.sqrt(dx * dx + dy * dy);
  const arcHeight = Math.min(dist * 0.35, 120); // limita arco em telas menores

  const mx = (src[0] + dst[0]) / 2;
  const my = (src[1] + dst[1]) / 2 - arcHeight;

  const pathD = `M ${src[0]} ${src[1]} Q ${mx} ${my} ${dst[0]} ${dst[1]}`;

  // Duração baseada na distância — ataques "próximos" chegam mais rápido
  const duration = 0.8 + (dist / 1200);

  return (
    <g>
      {/* ── Camada 1: brilho externo (glow) ── */}
      <motion.path
        d={pathD}
        stroke={color}
        strokeWidth={6}
        strokeLinecap="round"
        fill="none"
        style={{ filter: `blur(8px)`, mixBlendMode: "screen" }}
        initial={{ pathLength: 0, opacity: 0 }}
        animate={{ pathLength: 1, opacity: [0, 0.7, 0.7, 0] }}
        transition={{
          pathLength: { duration, ease: "easeOut" },
          opacity: { duration: duration + 0.8, times: [0, 0.1, 0.7, 1] },
        }}
      />

      {/* ── Camada 2: linha principal colorida ── */}
      <motion.path
        d={pathD}
        stroke={color}
        strokeWidth={1.8}
        strokeLinecap="round"
        fill="none"
        initial={{ pathLength: 0, opacity: 0 }}
        animate={{ pathLength: 1, opacity: [0, 1, 1, 0] }}
        transition={{
          pathLength: { duration, ease: "easeOut" },
          opacity: { duration: duration + 0.8, times: [0, 0.08, 0.7, 1] },
        }}
      />

      {/* ── Camada 3: núcleo branco concentrado ── */}
      <motion.path
        d={pathD}
        stroke="rgba(255,255,255,0.9)"
        strokeWidth={0.7}
        strokeLinecap="round"
        fill="none"
        initial={{ pathLength: 0, opacity: 0 }}
        animate={{ pathLength: 1, opacity: [0, 1, 1, 0] }}
        transition={{
          pathLength: { duration, ease: "easeOut" },
          opacity: { duration: duration + 0.8, times: [0, 0.08, 0.7, 1] },
        }}
      />

      {/* ── Dot pulsante na ORIGEM ── */}
      <motion.circle
        cx={src[0]}
        cy={src[1]}
        r={3}
        fill={color}
        initial={{ scale: 1, opacity: 0.9 }}
        animate={{ scale: [1, 1.8, 1], opacity: [0.9, 0.4, 0] }}
        transition={{ duration: duration + 0.5, ease: "easeOut" }}
        style={{ transformOrigin: `${src[0]}px ${src[1]}px` }}
      />

      {/* ── Anel de impacto ao chegar no DESTINO ── */}
      <motion.circle
        cx={dst[0]}
        cy={dst[1]}
        r={4}
        fill="none"
        stroke={color}
        strokeWidth={1.5}
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: [0, 3], opacity: [1, 0] }}
        transition={{
          delay: duration * 0.95,
          duration: 0.6,
          ease: "easeOut",
        }}
        style={{ transformOrigin: `${dst[0]}px ${dst[1]}px` }}
      />

      {/* ── Segundo anel de impacto (delay maior) ── */}
      <motion.circle
        cx={dst[0]}
        cy={dst[1]}
        r={4}
        fill="none"
        stroke={color}
        strokeWidth={1}
        style={{ filter: `blur(2px)`, transformOrigin: `${dst[0]}px ${dst[1]}px` }}
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: [0, 4.5], opacity: [0.6, 0] }}
        transition={{
          delay: duration * 0.95 + 0.15,
          duration: 0.7,
          ease: "easeOut",
        }}
      />

      {/* ── Flash branco no ponto de destino ── */}
      <motion.circle
        cx={dst[0]}
        cy={dst[1]}
        r={3}
        fill="white"
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: [0, 1.5, 0], opacity: [0, 1, 0] }}
        transition={{
          delay: duration * 0.95,
          duration: 0.35,
          ease: "easeOut",
        }}
        style={{ transformOrigin: `${dst[0]}px ${dst[1]}px` }}
      />
    </g>
  );
};

export default AnimatedAttackLine;
