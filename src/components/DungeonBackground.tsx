import React from 'react';

export interface BiomeTheme {
  id: 'crypt' | 'catacombs' | 'blood_sanctum' | 'abyssal_rift' | 'inferno';
  name: string;
  bgGradient: string;
  pillarColor: string;
  archStroke: string;
  glowPrimary: string;
  glowSecondary: string;
  emberColors: string[];
  accentBadge: string;
}

export function getBiomeForFloor(floor: number): BiomeTheme {
  if (floor >= 20) {
    return {
      id: 'inferno',
      name: "Dragon's Inferno",
      bgGradient: 'from-[#1a0505] via-[#2b0907] to-[#0a0202]',
      pillarColor: '#1f0806',
      archStroke: '#f97316',
      glowPrimary: '#ef4444',
      glowSecondary: '#f59e0b',
      emberColors: ['#fde047', '#fb923c', '#ef4444', '#dc2626'],
      accentBadge: 'border-orange-500/70 bg-red-950/80 text-amber-300',
    };
  }
  if (floor >= 15) {
    return {
      id: 'abyssal_rift',
      name: 'The Abyssal Rift',
      bgGradient: 'from-[#0d061c] via-[#1b0b2e] to-[#070310]',
      pillarColor: '#110721',
      archStroke: '#a855f7',
      glowPrimary: '#9333ea',
      glowSecondary: '#ec4899',
      emberColors: ['#c084fc', '#e879f9', '#fb7185', '#f59e0b'],
      accentBadge: 'border-purple-400/70 bg-purple-950/80 text-purple-200',
    };
  }
  if (floor >= 10) {
    return {
      id: 'blood_sanctum',
      name: 'The Blood Sanctum',
      bgGradient: 'from-[#17060b] via-[#260911] to-[#090306]',
      pillarColor: '#1a070d',
      archStroke: '#e11d48',
      glowPrimary: '#be123c',
      glowSecondary: '#f97316',
      emberColors: ['#fb7185', '#e11d48', '#fb923c', '#fbbf24'],
      accentBadge: 'border-rose-500/70 bg-rose-950/80 text-rose-200',
    };
  }
  if (floor >= 5) {
    return {
      id: 'catacombs',
      name: 'Torchlit Catacombs',
      bgGradient: 'from-[#140d08] via-[#1f130b] to-[#090705]',
      pillarColor: '#17100b',
      archStroke: '#d97706',
      glowPrimary: '#ea580c',
      glowSecondary: '#fbbf24',
      emberColors: ['#fb923c', '#f59e0b', '#fde047'],
      accentBadge: 'border-amber-500/60 bg-amber-950/75 text-amber-200',
    };
  }
  return {
    id: 'crypt',
    name: 'The Obsidian Crypt',
    bgGradient: 'from-[#07131c] via-[#0c1b26] to-[#07090f]',
    pillarColor: '#0b151e',
    archStroke: '#2dd4bf',
    glowPrimary: '#0d9488',
    glowSecondary: '#f97316',
    emberColors: ['#fb923c', '#f97316', '#fbbf24', '#2dd4bf'],
    accentBadge: 'border-teal-500/50 bg-slate-900/80 text-teal-200',
  };
}

interface DungeonBackgroundProps {
  floor: number;
  isTitle?: boolean;
}

export const DungeonBackground: React.FC<DungeonBackgroundProps> = ({
  floor,
  isTitle = false,
}) => {
  const biome = isTitle ? getBiomeForFloor(5) : getBiomeForFloor(floor);

  return (
    <div
      className={`pointer-events-none fixed inset-0 z-0 bg-gradient-to-b transition-all duration-1000 ${biome.bgGradient}`}
      aria-hidden="true"
    >
      {/* Layered Atmospheric Dungeon Architecture SVG */}
      <svg
        viewBox="0 0 1440 900"
        className="h-full w-full object-cover opacity-80 transition-opacity duration-700"
        preserveAspectRatio="xMidYMid slice"
      >
        <defs>
          <radialGradient id="biomeGlowTop" cx="50%" cy="22%" r="55%">
            <stop offset="0%" stopColor={biome.glowPrimary} stopOpacity="0.34" />
            <stop offset="55%" stopColor={biome.glowSecondary} stopOpacity="0.12" />
            <stop offset="100%" stopColor="#000000" stopOpacity="0" />
          </radialGradient>
          <radialGradient id="biomeGlowFloor" cx="50%" cy="88%" r="50%">
            <stop offset="0%" stopColor={biome.glowSecondary} stopOpacity="0.24" />
            <stop offset="100%" stopColor="#000000" stopOpacity="0" />
          </radialGradient>
          <linearGradient id="stoneWallGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={biome.pillarColor} stopOpacity="0.95" />
            <stop offset="100%" stopColor="#040508" stopOpacity="0.98" />
          </linearGradient>
        </defs>

        {/* Atmospheric Haze */}
        <rect width="1440" height="900" fill="url(#biomeGlowTop)" />
        <rect width="1440" height="900" fill="url(#biomeGlowFloor)" />

        {/* Distant Midground Gothic Vault Arches */}
        <g opacity="0.55">
          <path
            d="M240 900 L240 240 Q430 60 620 240 L620 900"
            stroke={biome.archStroke}
            strokeOpacity="0.22"
            strokeWidth="4"
            fill="none"
          />
          <path
            d="M820 900 L820 240 Q1010 60 1200 240 L1200 900"
            stroke={biome.archStroke}
            strokeOpacity="0.22"
            strokeWidth="4"
            fill="none"
          />
          <path
            d="M460 900 L460 170 Q720 -30 980 170 L980 900"
            stroke={biome.archStroke}
            strokeOpacity="0.32"
            strokeWidth="6"
            fill="none"
          />
        </g>

        {/* Foreground Stone Pillars & Carved Masonry Blocks */}
        <g fill="url(#stoneWallGrad)">
          <rect x="0" y="0" width="125" height="900" />
          <rect x="1315" y="0" width="125" height="900" />
          <path d="M125 0 L245 0 L195 160 L125 220 Z" opacity="0.85" />
          <path d="M1315 0 L1195 0 L1245 160 L1315 220 Z" opacity="0.85" />
        </g>

        {/* Subtle Stone Block Mortar Lines */}
        <g stroke="#ffffff" strokeOpacity="0.04" strokeWidth="2">
          <path d="M0 150 H125 M0 300 H125 M0 450 H125 M0 600 H125 M0 750 H125" />
          <path d="M1315 150 H1440 M1315 300 H1440 M1315 450 H1440 M1315 600 H1440 M1315 750 H1440" />
        </g>

        {/* Wall Torch Sconces on Left & Right Pillars */}
        <g>
          {/* Left Sconce */}
          <path d="M120 330 L146 318 L140 355 L120 355 Z" fill="#44403c" />
          <circle cx="138" cy="295" r="46" fill={biome.glowSecondary} opacity="0.18" />
          <path d="M138 268 C150 282, 152 300, 140 312 L134 312 C122 300, 126 282, 138 268 Z" fill="#f97316" opacity="0.85" />
          <path d="M138 280 C144 288, 144 298, 138 306 C132 298, 132 288, 138 280 Z" fill="#fde047" opacity="0.9" />

          {/* Right Sconce */}
          <path d="M1320 330 L1294 318 L1300 355 L1320 355 Z" fill="#44403c" />
          <circle cx="1302" cy="295" r="46" fill={biome.glowSecondary} opacity="0.18" />
          <path d="M1302 268 C1314 282, 1316 300, 1304 312 L1298 312 C1286 300, 1290 282, 1302 268 Z" fill="#f97316" opacity="0.85" />
          <path d="M1302 280 C1308 288, 1308 298, 1302 306 C1296 298, 1296 288, 1302 280 Z" fill="#fde047" opacity="0.9" />
        </g>

        {/* Higher-Level Biome Details: Blood Sanctum Runes (10+), Rift Fractures (15+), Magma Fissures (20+) */}
        {!isTitle && floor >= 10 && (
          <g stroke={biome.archStroke} strokeOpacity="0.35" fill="none">
            <circle cx="720" cy="360" r="175" strokeDasharray="10 8" strokeWidth="2.5" />
            <circle cx="720" cy="360" r="140" strokeDasharray="4 10" strokeWidth="1.5" />
          </g>
        )}

        {!isTitle && floor >= 15 && (
          <g stroke="#c084fc" strokeOpacity="0.4" strokeWidth="2.5" fill="none">
            <path d="M360 120 L400 220 L375 300 L420 410" />
            <path d="M1080 120 L1040 230 L1065 315 L1015 430" />
          </g>
        )}

        {!isTitle && floor >= 20 && (
          <g stroke="#fb923c" strokeOpacity="0.55" strokeWidth="3.5" fill="none">
            <path d="M180 890 L250 810 L290 830 L370 760" />
            <path d="M1260 890 L1185 805 L1145 830 L1065 755" />
          </g>
        )}
      </svg>
    </div>
  );
};
