
import React from 'react';
import { Icons } from '../constants';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  animated?: boolean;
}

export const Logo: React.FC<LogoProps> = ({ size = 'md', animated = true }) => {
  const sizeClasses = {
    sm: 'w-10 h-10',
    md: 'w-20 h-20',
    lg: 'w-40 h-40',
    xl: 'w-64 h-64',
  };

  return (
    <div className={`relative flex items-center justify-center ${sizeClasses[size]} group`}>
      {/* Outer Glow */}
      <div className={`absolute inset-0 bg-indigo-500/10 rounded-full blur-[80px] ${animated ? 'animate-pulse-soft' : ''}`} />
      
      {/* Decorative Rotating Ring */}
      {animated && (
        <div className="absolute inset-0 border-[2px] border-dashed border-cyan-500/20 rounded-full animate-rotate-slow" />
      )}
      
      {/* Logo Body */}
      <div className={`relative flex items-center justify-center text-cyan-400 w-full h-full drop-shadow-[0_0_20px_rgba(34,211,238,0.4)] ${animated ? 'animate-eye-glitch' : ''}`}>
        <Icons.Eye className="w-full h-full stroke-[1.2]" />
        <div className="absolute inset-0 flex items-center justify-center">
           <Icons.Brain className="w-[45%] h-[45%] text-white/40 group-hover:text-white/80 transition-all" />
        </div>
        
        {/* Scanning Effect */}
        {animated && (
          <div className="logo-scan-line" />
        )}
      </div>
    </div>
  );
};
