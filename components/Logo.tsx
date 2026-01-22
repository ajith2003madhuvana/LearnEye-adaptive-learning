import React from 'react';
import { Icons } from '../constants';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  animated?: boolean;
}

export const Logo: React.FC<LogoProps> = ({ size = 'md', animated = true }) => {
  const sizeClasses = {
    sm: 'w-12 h-12', // Increased size
    md: 'w-20 h-20', // Increased size
    lg: 'w-36 h-36', // Increased size
    xl: 'w-52 h-52', // Increased size
  };

  return (
    <div className={`relative flex items-center justify-center ${sizeClasses[size]} transition-all duration-500`}>
      {/* Outer Rotating Ring */}
      {animated && (
        <div className="absolute inset-0 border-2 border-dashed border-cyan-400/30 rounded-full animate-rotate-slow" />
      )}
      
      {/* Inner Glow Aura */}
      <div className={`absolute inset-0 bg-gradient-to-tr from-cyan-500/10 to-blue-500/10 rounded-full blur-2xl ${animated ? 'animate-pulse-soft' : ''}`} />
      
      {/* Holographic Scan Effect */}
      {animated && <div className="logo-scan-line" />}

      {/* Logo Content */}
      <div className={`relative flex items-center justify-center text-cyan-400 w-full h-full p-1 ${animated ? 'animate-eye-glitch' : ''}`}>
        <Icons.Eye className="w-full h-full drop-shadow-[0_0_20px_rgba(34,211,238,0.6)]" />
        <div className="absolute inset-0 flex items-center justify-center opacity-40">
           <Icons.Brain className="w-2/3 h-2/3 text-white" />
        </div>
      </div>
    </div>
  );
};