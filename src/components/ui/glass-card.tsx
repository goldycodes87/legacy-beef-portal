'use client';

import React from 'react';

interface GlassCardProps {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
  onMouseEnter?: () => void;
  onMouseLeave?: () => void;
}

export function GlassCard({
  children,
  className = '',
  onClick,
  onMouseEnter,
  onMouseLeave,
}: GlassCardProps) {
  return (
    <div
      onClick={onClick}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      className={`relative overflow-hidden cursor-pointer transition-all duration-700 ${className}`}
      style={{
        boxShadow:
          '0 6px 6px rgba(0,0,0,0.3), 0 0 20px rgba(0,0,0,0.2)',
        transitionTimingFunction: 'cubic-bezier(0.175, 0.885, 0.32, 2.2)',
      }}
    >
      {/* Blur + distortion layer */}
      <div
        className="absolute inset-0 z-0 rounded-inherit"
        style={{
          backdropFilter: 'blur(12px)',
          filter: 'url(#glass-distortion)',
          isolation: 'isolate',
        }}
      />

      {/* White tint */}
      <div
        className="absolute inset-0 z-10"
        style={{ background: 'rgba(255,255,255,0.06)' }}
      />

      {/* Inner border highlight */}
      <div
        className="absolute inset-0 z-20"
        style={{
          boxShadow:
            'inset 1px 1px 1px 0 rgba(255,255,255,0.3), inset -1px -1px 1px 0 rgba(255,255,255,0.1)',
          borderRadius: 'inherit',
        }}
      />

      {/* Content */}
      <div className="relative z-30">{children}</div>
    </div>
  );
}
