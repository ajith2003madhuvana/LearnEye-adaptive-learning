
import React from 'react';
import { Icons, COLORS } from '../constants';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  animated?: boolean;
}

export const Logo: React.FC<LogoProps> = ({ size = 'md', animated = true }) => {
  const sizeClasses = {
    sm: 'w-10 h-10',
    md: 'w-20 h-20',
    lg: 'w-40 h-40',
    xl: 'w-60 h-60',
  };

  return (
    <div className={`relative flex items-center justify-center ${sizeClasses[size]} group`}>
      {/* Brand story: Eye + Brain + Learning Path */}
      {/* Eye represents vision/focus, Brain represents intelligence, Path represents growth */}
      
      {/* Outer Rotating Ring */}
      {animated && (
        <div className="absolute inset-0 border-[3px] border-dashed border-cyan-500/20 rounded-full animate-rotate-slow" />
      )}
      
      {/* Inner Glow Aura */}
      <div className={`absolute inset-0 bg-gradient-to-br from-indigo-600/20 to-purple-600/20 rounded-full blur-3xl ${animated ? 'animate-pulse-soft' : ''}`} />
      
      {/* Logo Body */}
      <div className={`relative flex items-center justify-center text-cyan-400 w-full h-full drop-shadow-[0_0_15px_rgba(34,211,238,0.4)] ${animated ? 'animate-eye-glitch' : ''}`}>
        <Icons.Eye className="w-full h-full stroke-[1.5]" />
        <div className="absolute inset-0 flex items-center justify-center">
           <Icons.Brain className="w-1/2 h-1/2 text-white/40 group-hover:text-white/60 transition-colors" />
        </div>
        
        {/* Scanning beam effect */}
        {animated && (
          <div className="absolute w-full h-0.5 bg-cyan-400/50 blur-[2px] top-0 animate-[scan-line_4s_linear_infinite]" />
        )}
      </div>
    </div>
  );
};
