import React from 'react';

export default function AmbientGlow() {
  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden -z-10 select-none">
      {/* Deep Indigo Orb - Top Left */}
      <div
        className="absolute -top-32 -left-32 w-[550px] h-[550px] rounded-full bg-gradient-to-br from-indigo-600/10 via-purple-600/5 to-transparent blur-[140px] animate-pulse-subtle"
        style={{ animationDuration: '8s' }}
      />

      {/* Electric Amber / Studio Orange Orb - Top Right */}
      <div
        className="absolute top-1/4 -right-36 w-[600px] h-[600px] rounded-full bg-gradient-to-bl from-amber-500/10 via-orange-600/5 to-transparent blur-[150px] animate-pulse-subtle"
        style={{ animationDuration: '10s', animationDelay: '2s' }}
      />

      {/* Cyber Cyan / Emerald Orb - Bottom Center */}
      <div
        className="absolute -bottom-40 left-1/3 w-[650px] h-[650px] rounded-full bg-gradient-to-tr from-cyan-500/8 via-emerald-500/4 to-transparent blur-[160px] animate-pulse-subtle"
        style={{ animationDuration: '12s', animationDelay: '4s' }}
      />

      {/* Ultra-fine Noise / Specular Grid Overlay (Optional Subtle Texture) */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-white/[0.015] via-transparent to-transparent" />
    </div>
  );
}
