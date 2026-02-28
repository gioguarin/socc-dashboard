import { motion } from 'framer-motion';
import { ReactNode } from 'react';

interface CardProps {
  children: ReactNode;
  className?: string;
  hover?: boolean;
  glow?: boolean;
  gradient?: boolean;
  onClick?: () => void;
}

export default function Card({ children, className = '', hover = false, glow = false, gradient = false, onClick }: CardProps) {
  return (
    <motion.div
      initial={false}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, ease: 'easeOut' }}
      onClick={onClick}
      className={`
        bg-socc-card/80 backdrop-blur-sm rounded-xl
        border border-socc-border/40
        shadow-[var(--socc-card-shadow)]
        ${hover ? 'hover:shadow-[var(--socc-card-shadow-hover)] hover:border-socc-border/60 transition-all duration-300 cursor-pointer card-hover-gradient' : ''}
        ${glow ? 'animate-border-glow' : ''}
        ${gradient ? 'card-hover-gradient' : ''}
        ${onClick ? 'cursor-pointer' : ''}
        ${className}
      `}
    >
      {children}
    </motion.div>
  );
}
