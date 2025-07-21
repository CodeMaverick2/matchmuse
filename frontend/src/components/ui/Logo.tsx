import React from 'react';
import { Sparkles, Zap } from 'lucide-react';
import { motion } from 'framer-motion';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg';
  showText?: boolean;
}

export const Logo: React.FC<LogoProps> = ({
  size = 'md',
  showText = true
}) => {
  const sizes = {
    sm: { icon: 20, text: 'text-lg' },
    md: { icon: 24, text: 'text-xl' },
    lg: { icon: 32, text: 'text-2xl' }
  };
  
  return (
    <motion.div
      whileHover={{ scale: 1.05 }}
      className="flex items-center space-x-2"
    >
      <div className="relative">
        <motion.div
          animate={{ rotate: [0, 360] }}
          transition={{ duration: 8, repeat: Infinity, ease: 'linear' }}
          className="absolute inset-0"
        >
          <Sparkles 
            size={sizes[size].icon} 
            className="text-blue-600"
          />
        </motion.div>
        <motion.div
          animate={{ scale: [1, 1.1, 1] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          <Zap 
            size={sizes[size].icon} 
            className="text-orange-500 relative z-10"
          />
        </motion.div>
      </div>
      {showText && (
        <span className={`font-bold bg-gradient-to-r from-blue-600 to-orange-500 bg-clip-text text-transparent ${sizes[size].text}`}>
          MatchMuse
        </span>
      )}
    </motion.div>
  );
};