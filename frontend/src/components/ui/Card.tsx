import React from 'react';
import { motion } from 'framer-motion';
import { clsx } from 'clsx';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  hover?: boolean;
  padding?: 'sm' | 'md' | 'lg';
  glass?: boolean;
  glow?: boolean;
}

export const Card: React.FC<CardProps> = ({
  children,
  className,
  hover = false,
  padding = 'md',
  glass = true,
  glow = false
}) => {
  const paddingClasses = {
    sm: 'p-4',
    md: 'p-6',
    lg: 'p-8'
  };
  
  return (
    <motion.div
      whileHover={hover ? { 
        y: -8, 
        scale: 1.02,
        boxShadow: '0 20px 40px rgba(0, 0, 0, 0.4)'
      } : {}}
      transition={{ 
        duration: 0.3,
        type: "spring",
        stiffness: 300,
        damping: 20
      }}
      className={clsx(
        'rounded-2xl transition-all duration-300',
        glass ? 'glass-card text-white' : 'bg-white/5 backdrop-blur-md border border-white/10',
        paddingClasses[padding],
        hover && 'cursor-pointer hover-lift',
        glow && 'animate-glow',
        className
      )}
    >
      {children}
    </motion.div>
  );
};