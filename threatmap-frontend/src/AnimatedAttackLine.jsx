import React from "react";
import { Line } from "react-simple-maps";
import { motion } from "framer-motion";

// Aqui está o truque de sênior: Transformamos a Linha estática do mapa 
// em um componente "Motion", que aceita as animações nativamente!
const MotionLine = motion.create ? motion.create(Line) : motion(Line);

const AnimatedAttackLine = ({ attack, color }) => {
  // Configuração da animação do Framer Motion
  const lineVariants = {
    hidden: { pathLength: 0, opacity: 0.8 },
    visible: {
      pathLength: 1, // Desenha do início ao fim
      opacity: [0.8, 1, 0], // Brilha e depois desaparece
      transition: {
        pathLength: { duration: 1.5, ease: "easeOut" }, // Velocidade do tiro
        opacity: { delay: 1.5, duration: 1 }, // Tempo até sumir da tela
        times: [0, 0.2, 1],
      },
    },
  };

  return (
    <g>
      {/* 1. Efeito de Brilho (Glow) por baixo */}
      <MotionLine
        from={[attack.source.lng, attack.source.lat]}
        to={[attack.dest.lng, attack.dest.lat]}
        stroke={color}
        strokeWidth={4} // Mais grossa para o brilho
        strokeLinecap="round"
        fill="transparent"
        style={{ filter: "blur(4px)" }}
        variants={lineVariants}
        initial="hidden"
        animate="visible"
      />

      {/* 2. Linha Principal (Feixe de luz concentrado) por cima */}
      <MotionLine
        from={[attack.source.lng, attack.source.lat]}
        to={[attack.dest.lng, attack.dest.lat]}
        stroke="#ffffff" // Centro branco
        strokeWidth={1.5}
        strokeLinecap="round"
        fill="transparent"
        variants={lineVariants}
        initial="hidden"
        animate="visible"
      />
    </g>
  );
};

export default AnimatedAttackLine;
