import React from 'react';
import { motion } from 'framer-motion';
import { clsx } from 'clsx';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger' | 'glass';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  glow?: boolean;
  children: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'md',
  loading = false,
  glow = false,
  children,
  className,
  disabled,
  ...props
}) => {
  const baseClasses = 'inline-flex items-center justify-center font-medium transition-all duration-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed relative overflow-hidden btn-glow';
  
  const variantClasses = {
    primary: 'bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 text-white hover:from-blue-600 hover:via-purple-600 hover:to-pink-600 focus:ring-blue-500 shadow-lg hover:shadow-2xl border-0',
    secondary: 'bg-gradient-to-r from-orange-500 to-red-500 text-white hover:from-orange-600 hover:to-red-600 focus:ring-orange-500 shadow-lg hover:shadow-2xl border-0',
    outline: 'border-2 border-blue-400/50 text-blue-300 hover:bg-blue-500/20 hover:border-blue-400 focus:ring-blue-500 backdrop-blur-sm glass',
    ghost: 'text-white/80 hover:bg-white/10 hover:text-white focus:ring-white/20 backdrop-blur-sm',
    danger: 'bg-gradient-to-r from-red-500 to-red-600 text-white hover:from-red-600 hover:to-red-700 focus:ring-red-500 shadow-lg hover:shadow-2xl border-0',
    glass: 'glass text-white hover:bg-white/20 focus:ring-white/20 backdrop-blur-md border border-white/20'
  };
  
  const sizeClasses = {
    sm: 'px-4 py-2 text-sm',
    md: 'px-6 py-3 text-base',
    lg: 'px-8 py-4 text-lg'
  };
  
  return (
    <motion.button
      whileHover={{ 
        scale: 1.05,
        boxShadow: glow ? '0 0 30px rgba(96, 165, 250, 0.5)' : undefined
      }}
      whileTap={{ scale: 0.95 }}
      transition={{ type: "spring", stiffness: 400, damping: 17 }}
      className={clsx(
        baseClasses,
        variantClasses[variant],
        sizeClasses[size],
        glow && 'animate-glow',
        className
      )}
      disabled={disabled || loading}
      {...props}
    >
      {loading && (
        <div className="w-4 h-4 mr-2 border-2 border-current border-t-transparent rounded-full animate-spin" />
      )}
      {children}
    </motion.button>
  );
};