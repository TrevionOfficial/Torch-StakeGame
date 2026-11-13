import React from 'react';
import { CardType } from '../types/game';

interface CardArtworkSVGProps {
  type: CardType | 'HERO' | 'CARDBACK' | 'GAUNTLET' | 'CHEST_HUD';
  variant?: string;
  className?: string;
}

export const CardArtworkSVG: React.FC<CardArtworkSVGProps> = ({
  type,
  variant,
  className = 'w-20 h-20',
}) => {
  if (type === 'CARDBACK') {
    return (
      <svg viewBox="0 0 100 130" className={className} fill="none" aria-hidden="true">
        <defs>
          <linearGradient id="cbGrad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#1e3a4c" />
            <stop offset="50%" stopColor="#134e4a" />
            <stop offset="100%" stopColor="#0f2936" />
          </linearGradient>
        </defs>
        <rect x="4" y="4" width="92" height="122" rx="10" fill="url(#cbGrad)" stroke="#94a3b8" strokeWidth="3" />
        <rect x="12" y="12" width="76" height="106" rx="6" stroke="#2dd4bf" strokeWidth="1.5" strokeOpacity="0.45" />
        <path d="M12 30 L88 100 M88 30 L12 100" stroke="#2dd4bf" strokeWidth="1" strokeOpacity="0.18" />
        <circle cx="50" cy="65" r="24" fill="#0d262c" stroke="#fbbf24" strokeWidth="1.5" strokeOpacity="0.6" />
        <path d="M46 66 L54 66 L52 93 L48 93 Z" fill="#92400e" stroke="#fbbf24" strokeWidth="1.4" />
        <rect x="44" y="63" width="12" height="4.5" rx="1.5" fill="#78716c" />
        <path d="M50 37 C59 46, 61 57, 53 63 L47 63 C39 57, 41 46, 50 37 Z" fill="#f97316" />
        <path d="M50 44 C54 49, 55 56, 51 60 L49 60 C45 56, 46 49, 50 44 Z" fill="#fde047" />
      </svg>
    );
  }

  if (type === 'GAUNTLET') {
    return (
      <svg viewBox="0 0 80 100" className={className} fill="none" aria-hidden="true">
        <g stroke="#78716c" strokeWidth="2" fill="#292524" fillOpacity="0.7">
          <rect x="23" y="16" width="7" height="24" rx="3.5" />
          <rect x="32" y="11" width="7.5" height="28" rx="3.5" />
          <rect x="41.5" y="13" width="7.5" height="26" rx="3.5" />
          <rect x="51" y="20" width="6.5" height="21" rx="3.2" />
          <path d="M22 46 L13 38 C11 36, 14 31, 18 33 L26 40 Z" />
          <rect x="22" y="37" width="36" height="26" rx="6" fill="#3f3f46" />
          <path d="M24 63 L56 63 L59 83 L21 83 Z" fill="#27272a" />
          <path d="M26 47 L54 47 M25 71 L55 71" stroke="#a8a29e" strokeWidth="1.5" strokeOpacity="0.5" />
        </g>
      </svg>
    );
  }

  if (type === 'CHEST_HUD') {
    return (
      <svg viewBox="0 0 80 70" className={className} fill="none" aria-hidden="true">
        <path d="M12 24 L26 8 L68 12 L58 28 Z" fill="#78350f" stroke="#fbbf24" strokeWidth="2" />
        <path d="M12 24 L58 28 L56 58 L14 54 Z" fill="#92400e" stroke="#fbbf24" strokeWidth="2" />
        <circle cx="32" cy="21" r="5.5" fill="#fbbf24" stroke="#fef08a" strokeWidth="1.2" />
        <circle cx="42" cy="22" r="5.5" fill="#f59e0b" stroke="#fef08a" strokeWidth="1.2" />
        <circle cx="51" cy="23" r="5.5" fill="#fbbf24" stroke="#fef08a" strokeWidth="1.2" />
        <rect x="30" y="31" width="10" height="12" rx="2" fill="#fbbf24" stroke="#78350f" strokeWidth="1.5" />
      </svg>
    );
  }

  if (type === 'HERO') {
    return (
      <svg viewBox="0 0 100 110" className={className} fill="none" aria-hidden="true">
        <defs>
          <radialGradient id="heroFlameBg" cx="50%" cy="45%" r="55%">
            <stop offset="0%" stopColor="#fde047" stopOpacity="0.95" />
            <stop offset="45%" stopColor="#f97316" stopOpacity="0.85" />
            <stop offset="100%" stopColor="#7c2d12" stopOpacity="0.2" />
          </radialGradient>
          <linearGradient id="knightArmor" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#e2e8f0" />
            <stop offset="45%" stopColor="#64748b" />
            <stop offset="100%" stopColor="#1e293b" />
          </linearGradient>
        </defs>
        <rect x="6" y="4" width="88" height="102" rx="10" fill="url(#heroFlameBg)" />
        <path d="M20 80 C12 56, 26 30, 34 16 C33 34, 42 36, 50 10 C56 32, 68 34, 67 16 C78 32, 86 58, 78 80 Z" fill="#fb923c" opacity="0.65" />
        <path d="M14 96 C15 70, 26 62, 50 62 C74 62, 85 70, 86 96 Z" fill="#1e293b" stroke="#fbbf24" strokeWidth="2.5" />
        <path d="M16 74 C22 60, 35 58, 38 72 L24 84 Z" fill="url(#knightArmor)" stroke="#fbbf24" strokeWidth="2" />
        <path d="M84 74 C78 60, 65 58, 62 72 L76 84 Z" fill="url(#knightArmor)" stroke="#fbbf24" strokeWidth="2" />
        <path d="M35 60 Q50 70 65 60 L60 72 Q50 78 40 72 Z" fill="#be123c" stroke="#fb7185" strokeWidth="1.2" />
        <path d="M34 33 C34 17, 66 17, 66 33 L64 56 C59 64, 41 64, 36 56 Z" fill="url(#knightArmor)" stroke="#fbbf24" strokeWidth="2.2" />
        <path d="M50 19 L50 62" stroke="#fbbf24" strokeWidth="2" />
        <path d="M38 41 L48 44 L48 47 L38 45 Z" fill="#09090d" />
        <path d="M62 41 L52 44 L52 47 L62 45 Z" fill="#09090d" />
        <circle cx="43" cy="43.5" r="2" fill="#f97316" />
        <circle cx="57" cy="43.5" r="2" fill="#f97316" />
      </svg>
    );
  }

  /* HIGH-DETAIL DARK-FANTASY BOSS ARTWORK */
  if (type === 'BOSS') {
    const isDragonBoss = variant === 'inferno_wyrm';
    const isVoidBoss = variant === 'abyssal_sovereign';
    const isBloodBoss = variant === 'blood_lord';
    const auraCore = isVoidBoss
      ? '#c084fc'
      : isDragonBoss
      ? '#fb923c'
      : isBloodBoss
      ? '#f43f5e'
      : '#f59e0b';
    const auraMid = isVoidBoss ? '#581c87' : isDragonBoss ? '#9a3412' : '#7f1d1d';
    const plateTop = isVoidBoss ? '#3b0764' : isDragonBoss ? '#7f1d1d' : '#292524';
    const plateBot = isVoidBoss ? '#170529' : isDragonBoss ? '#2c0707' : '#0c0a09';
    const eyeGlow = isVoidBoss ? '#e879f9' : '#fde047';
    const uid = `boss-${variant ?? 'warden'}`;

    return (
      <svg viewBox="0 0 120 120" className={className} fill="none" aria-hidden="true">
        <defs>
          <radialGradient id={`${uid}-aura`} cx="50%" cy="48%" r="54%">
            <stop offset="0%" stopColor={auraCore} stopOpacity="0.88" />
            <stop offset="52%" stopColor={auraMid} stopOpacity="0.38" />
            <stop offset="100%" stopColor="#000000" stopOpacity="0" />
          </radialGradient>
          <linearGradient id={`${uid}-armor`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={plateTop} />
            <stop offset="100%" stopColor={plateBot} />
          </linearGradient>
          <linearGradient id={`${uid}-gold`} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#fef08a" />
            <stop offset="55%" stopColor="#f59e0b" />
            <stop offset="100%" stopColor="#92400e" />
          </linearGradient>
          <linearGradient id={`${uid}-horn`} x1="0" y1="1" x2="0" y2="0">
            <stop offset="0%" stopColor="#451a03" />
            <stop offset="55%" stopColor="#d97706" />
            <stop offset="100%" stopColor="#fef08a" />
          </linearGradient>
        </defs>

        <circle cx="60" cy="60" r="56" fill={`url(#${uid}-aura)`} />
        {/* Floating Embers */}
        <circle cx="20" cy="36" r="1.8" fill={auraCore} opacity="0.8" />
        <circle cx="100" cy="34" r="2" fill="#fde047" opacity="0.75" />
        <circle cx="26" cy="96" r="1.5" fill="#fb923c" opacity="0.7" />
        <circle cx="95" cy="94" r="1.7" fill={auraCore} opacity="0.7" />

        {/* Tattered Royal Mantle & Spiked Pauldrons */}
        <path d="M12 112 L22 66 L60 74 L98 66 L108 112 L88 106 L74 114 L60 106 L46 114 L32 106 Z" fill={`url(#${uid}-armor)`} stroke={`url(#${uid}-gold)`} strokeWidth="2.4" />
        <path d="M14 78 L4 54 L26 60 L36 74 Z" fill={plateTop} stroke={`url(#${uid}-gold)`} strokeWidth="2" />
        <path d="M106 78 L116 54 L94 60 L84 74 Z" fill={plateTop} stroke={`url(#${uid}-gold)`} strokeWidth="2" />
        <path d="M22 66 L18 50 L30 62 M98 66 L102 50 L90 62" stroke="#fde047" strokeWidth="2.2" strokeLinecap="round" />

        {/* Sweeping Ribbed Horns */}
        <path d="M38 38 C16 32, 10 12, 24 6 C22 18, 28 26, 42 30 Z" fill={`url(#${uid}-horn)`} stroke="#451a03" strokeWidth="1.4" />
        <path d="M82 38 C104 32, 110 12, 96 6 C98 18, 92 26, 78 30 Z" fill={`url(#${uid}-horn)`} stroke="#451a03" strokeWidth="1.4" />

        {/* Sovereign Crown */}
        <path d="M40 28 L42 13 L51 22 L60 8 L69 22 L78 13 L80 28 Z" fill={`url(#${uid}-gold)`} stroke="#78350f" strokeWidth="1.6" />
        <circle cx="60" cy="20" r="3" fill={eyeGlow} />

        {/* Armored Skull / Dragon Helm */}
        <path
          d={
            isDragonBoss
              ? 'M36 33 L60 25 L84 33 L79 67 L66 82 L54 82 L41 67 Z'
              : 'M37 35 C37 22, 83 22, 83 35 L78 69 C70 80, 50 80, 42 69 Z'
          }
          fill={`url(#${uid}-armor)`}
          stroke={`url(#${uid}-gold)`}
          strokeWidth="2.5"
        />
        {/* Helm Brow Ridge & Cheek Plates */}
        <path d="M41 43 L60 49 L79 43" stroke={`url(#${uid}-gold)`} strokeWidth="2.2" strokeLinecap="round" />
        <path d="M60 27 L60 48" stroke={`url(#${uid}-gold)`} strokeWidth="1.8" opacity="0.7" />

        {/* Glowing Eye Sockets */}
        <path d="M43 46 L55 51 L52 56 L42 52 Z" fill="#050507" />
        <path d="M77 46 L65 51 L68 56 L78 52 Z" fill="#050507" />
        <ellipse cx="49" cy="51" rx="3.4" ry="2.2" fill={eyeGlow} />
        <ellipse cx="71" cy="51" rx="3.4" ry="2.2" fill={eyeGlow} />
        <circle cx="49" cy="51" r="1.2" fill="#ffffff" />
        <circle cx="71" cy="51" r="1.2" fill="#ffffff" />

        {/* Fanged Jaw & Chest Core */}
        <path d="M47 64 L73 64 L69 75 L51 75 Z" fill="#09070a" stroke="#78350f" strokeWidth="1.2" />
        <path d="M49 64 L52 71 L55 64 L58 72 L60 64 L62 72 L65 64 L68 71 L71 64" stroke="#f8fafc" strokeWidth="2" strokeLinejoin="round" />
        <polygon points="60,84 68,94 60,104 52,94" fill={auraCore} stroke="#fef08a" strokeWidth="1.8" />
      </svg>
    );
  }

  /* HIGH-DETAIL MONSTER ARTWORK FOR EVERY ENEMY TYPE */
  if (type === 'MONSTER') {
    if (variant === 'hound') {
      // Bone Hound: fierce layered dire-wolf skull, curled spine, collar & glowing red eye
      return (
        <svg viewBox="0 0 120 120" className={className} fill="none" aria-hidden="true">
          <defs>
            <radialGradient id="houndAura2" cx="50%" cy="48%" r="52%">
              <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.62" />
              <stop offset="60%" stopColor="#7c2d12" stopOpacity="0.22" />
              <stop offset="100%" stopColor="#000000" stopOpacity="0" />
            </radialGradient>
            <linearGradient id="houndBone" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#fafaf9" />
              <stop offset="55%" stopColor="#d6d3d1" />
              <stop offset="100%" stopColor="#78716c" />
            </linearGradient>
          </defs>
          <circle cx="60" cy="60" r="54" fill="url(#houndAura2)" />
          {/* Ribbed Neck & Spine */}
          <path d="M22 104 C25 78, 40 66, 65 68 L85 104 Z" fill="#1c1917" stroke="#57534e" strokeWidth="2.2" />
          <path d="M32 76 C44 74, 56 76, 68 82 M29 86 C43 84, 58 86, 72 93 M27 96 C42 94, 60 96, 76 102" stroke="url(#houndBone)" strokeWidth="3.5" strokeLinecap="round" />
          {/* Spiked Iron Collar */}
          <path d="M36 65 Q58 76 74 63" stroke="#b45309" strokeWidth="5" strokeLinecap="round" />
          <path d="M40 62 L35 55 L45 63 M55 68 L55 59 L60 69 M70 64 L76 56 L66 66" fill="#e7e5e4" />
          {/* Back & Front Pointed Ears */}
          <path d="M40 38 L28 12 L52 28 Z" fill="#a8a29e" stroke="#44403c" strokeWidth="2" />
          <path d="M64 30 L74 11 L78 34 Z" fill="url(#houndBone)" stroke="#44403c" strokeWidth="2" />
          {/* Cranium & Snout with Bone Shading */}
          <path d="M36 36 C40 22, 74 22, 82 37 L104 49 L98 59 L74 59 L63 68 L38 58 Z" fill="url(#houndBone)" stroke="#44403c" strokeWidth="2.4" strokeLinejoin="round" />
          {/* Cheekbone Hollow & Nasal Cavity */}
          <path d="M44 50 Q56 54 66 47" stroke="#78716c" strokeWidth="2.2" strokeLinecap="round" />
          <path d="M95 47 L102 51 L96 54 Z" fill="#1c1917" />
          {/* Snarling Lower Jaw & Razor Fangs */}
          <path d="M66 59 L97 65 L91 74 L60 68 Z" fill="#d6d3d1" stroke="#44403c" strokeWidth="2" />
          <path d="M74 59 L76 67 L79 59 M82 59 L84 68 L87 59 M90 59 L92 67 L95 59" fill="#ffffff" stroke="#44403c" strokeWidth="0.9" />
          <path d="M78 69 L80 63 L82 69 M86 70 L88 64 L90 70" fill="#ffffff" />
          {/* Fierce Glowing Eye */}
          <path d="M55 41 L69 39 L67 48 L56 47 Z" fill="#09090b" />
          <circle cx="63" cy="43" r="2.8" fill="#ef4444" />
          <circle cx="64" cy="42.5" r="1.1" fill="#fde047" />
        </svg>
      );
    }

    if (variant === 'cultist') {
      // Crypt Cultist: draped velvet hood, bone half-mask, glowing crimson eyes & ritual rune orb
      return (
        <svg viewBox="0 0 120 120" className={className} fill="none" aria-hidden="true">
          <defs>
            <radialGradient id="cultistAura2" cx="50%" cy="46%" r="54%">
              <stop offset="0%" stopColor="#f43f5e" stopOpacity="0.68" />
              <stop offset="60%" stopColor="#701a75" stopOpacity="0.28" />
              <stop offset="100%" stopColor="#000000" stopOpacity="0" />
            </radialGradient>
            <linearGradient id="cultistRobe" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#4c0519" />
              <stop offset="60%" stopColor="#2e1065" />
              <stop offset="100%" stopColor="#0f0718" />
            </linearGradient>
            <radialGradient id="cursedOrb" cx="40%" cy="35%" r="60%">
              <stop offset="0%" stopColor="#fff1f2" />
              <stop offset="45%" stopColor="#fb7185" />
              <stop offset="100%" stopColor="#be123c" />
            </radialGradient>
          </defs>
          <circle cx="60" cy="60" r="54" fill="url(#cultistAura2)" />
          {/* Robe & Gold-Trimmed Stole */}
          <path d="M18 110 L32 58 L88 58 L102 110 Z" fill="url(#cultistRobe)" stroke="#fb7185" strokeWidth="2.2" />
          <path d="M38 60 L50 108 M82 60 L70 108" stroke="#f59e0b" strokeWidth="2.2" strokeOpacity="0.7" />
          {/* Draped Pointed Hood */}
          <path d="M29 61 C28 30, 46 13, 60 9 C74 13, 92 30, 91 61 Q60 68 29 61 Z" fill="#1f081e" stroke="#f43f5e" strokeWidth="2.4" />
          <path d="M37 56 C38 35, 50 20, 60 17 C70 20, 82 35, 83 56" stroke="#fda4af" strokeWidth="1.2" strokeOpacity="0.4" />
          {/* Shadowed Cowl & Skull Mask */}
          <ellipse cx="60" cy="43" rx="16" ry="18" fill="#08030a" />
          <path d="M47 46 L60 54 L73 46 L70 59 L60 63 L50 59 Z" fill="#e7e5e4" stroke="#44403c" strokeWidth="1.5" />
          <path d="M54 55 L54 61 M60 56 L60 62 M66 55 L66 61" stroke="#44403c" strokeWidth="1.4" />
          {/* Piercing Glowing Eyes */}
          <path d="M47 38 L56 42 L48 44 Z" fill="#fb7185" />
          <path d="M73 38 L64 42 L72 44 Z" fill="#fb7185" />
          <circle cx="51" cy="41" r="1.4" fill="#fef08a" />
          <circle cx="69" cy="41" r="1.4" fill="#fef08a" />
          {/* Floating Cursed Orb & Arcane Sparks */}
          <circle cx="60" cy="84" r="16" fill="#f43f5e" opacity="0.28" />
          <circle cx="60" cy="84" r="11" fill="url(#cursedOrb)" stroke="#fde047" strokeWidth="2" />
          <path d="M44 76 Q52 70 49 63 M76 76 Q68 70 71 63" stroke="#fda4af" strokeWidth="1.6" strokeLinecap="round" />
        </svg>
      );
    }

    if (variant === 'golem') {
      // Obsidian Golem: beveled basalt monoliths, molten magma fissures & furnace eyes
      return (
        <svg viewBox="0 0 120 120" className={className} fill="none" aria-hidden="true">
          <defs>
            <radialGradient id="golemAura2" cx="50%" cy="50%" r="54%">
              <stop offset="0%" stopColor="#f97316" stopOpacity="0.65" />
              <stop offset="55%" stopColor="#7c2d12" stopOpacity="0.25" />
              <stop offset="100%" stopColor="#000000" stopOpacity="0" />
            </radialGradient>
            <linearGradient id="basaltGrad" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#57534e" />
              <stop offset="50%" stopColor="#292524" />
              <stop offset="100%" stopColor="#141210" />
            </linearGradient>
            <linearGradient id="lavaCore" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#fef08a" />
              <stop offset="55%" stopColor="#f97316" />
              <stop offset="100%" stopColor="#dc2626" />
            </linearGradient>
          </defs>
          <circle cx="60" cy="60" r="54" fill="url(#golemAura2)" />
          {/* Massive Chiseled Shoulder Boulders */}
          <path d="M10 106 L16 50 L38 36 L82 36 L104 50 L110 106 Z" fill="url(#basaltGrad)" stroke="#a8a29e" strokeWidth="2.4" strokeLinejoin="round" />
          <path d="M16 50 L38 60 L34 106 M104 50 L82 60 L86 106" stroke="#78716c" strokeWidth="1.6" opacity="0.7" />
          {/* Jagged Monolith Head */}
          <path d="M40 40 L43 16 L60 9 L77 16 L80 40 L60 46 Z" fill="url(#basaltGrad)" stroke="#d6d3d1" strokeWidth="2.2" strokeLinejoin="round" />
          <path d="M60 9 L60 46" stroke="#78716c" strokeWidth="1.4" opacity="0.6" />
          {/* Glowing Magma Cracks & Heart Core */}
          <path d="M60 56 L48 76 L62 86 L55 104" stroke="#f97316" strokeWidth="4.2" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M60 56 L48 76 L62 86 L55 104" stroke="#fde047" strokeWidth="1.6" strokeLinecap="round" />
          <path d="M26 64 L42 72 L34 92 M94 64 L78 72 L86 92" stroke="#fb923c" strokeWidth="2.6" strokeLinecap="round" />
          <polygon points="60,54 71,67 60,80 49,67" fill="url(#lavaCore)" stroke="#fed7aa" strokeWidth="2" />
          {/* Furnace Visor Eyes */}
          <rect x="44" y="23" width="12" height="5.5" rx="1.5" fill="#09090b" />
          <rect x="64" y="23" width="12" height="5.5" rx="1.5" fill="#09090b" />
          <rect x="46" y="24.5" width="8" height="2.8" rx="1" fill="#fde047" />
          <rect x="66" y="24.5" width="8" height="2.8" rx="1" fill="#fde047" />
        </svg>
      );
    }

    if (variant === 'demon') {
      // Abyssal Fiend: flared bat-wings, banded obsidian horns, fierce demonic visage & fangs
      return (
        <svg viewBox="0 0 120 120" className={className} fill="none" aria-hidden="true">
          <defs>
            <radialGradient id="demonAura2" cx="50%" cy="48%" r="54%">
              <stop offset="0%" stopColor="#a855f7" stopOpacity="0.72" />
              <stop offset="55%" stopColor="#581c87" stopOpacity="0.32" />
              <stop offset="100%" stopColor="#000000" stopOpacity="0" />
            </radialGradient>
            <linearGradient id="demonSkin" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#be123c" />
              <stop offset="65%" stopColor="#881337" />
              <stop offset="100%" stopColor="#3b0764" />
            </linearGradient>
          </defs>
          <circle cx="60" cy="60" r="54" fill="url(#demonAura2)" />
          {/* Spiked Bat Wings */}
          <path d="M8 86 L24 44 L44 64 L76 64 L96 44 L112 86 L88 106 L32 106 Z" fill="#2e1065" stroke="#c084fc" strokeWidth="2.2" />
          <path d="M24 44 L36 92 M96 44 L84 92" stroke="#a855f7" strokeWidth="1.5" opacity="0.6" />
          {/* Curved Horns */}
          <path d="M41 36 C21 30, 15 12, 28 6 C26 17, 33 25, 47 28 Z" fill="#1f091c" stroke="#fda4af" strokeWidth="1.6" />
          <path d="M79 36 C99 30, 105 12, 92 6 C94 17, 87 25, 73 28 Z" fill="#1f091c" stroke="#fda4af" strokeWidth="1.6" />
          <path d="M27 18 L34 23 M93 18 L86 23" stroke="#fbbf24" strokeWidth="2" strokeLinecap="round" />
          {/* Chiseled Fiend Head */}
          <path d="M39 30 L60 25 L81 30 L77 65 L60 79 L43 65 Z" fill="url(#demonSkin)" stroke="#fb7185" strokeWidth="2.3" />
          <path d="M45 37 L60 44 L75 37" stroke="#4c0519" strokeWidth="2.4" strokeLinecap="round" />
          {/* Glowing Eyes */}
          <path d="M44 42 L56 48 L46 50 Z" fill="#fde047" />
          <path d="M76 42 L64 48 L74 50 Z" fill="#fde047" />
          <circle cx="50" cy="46.5" r="1.2" fill="#ffffff" />
          <circle cx="70" cy="46.5" r="1.2" fill="#ffffff" />
          {/* Snarling Maw & Fangs */}
          <path d="M47 59 L73 59 L68 70 L52 70 Z" fill="#09050c" />
          <path d="M50 59 L53 66 L56 59 M64 59 L67 66 L70 59" fill="#f8fafc" />
          <path d="M55 70 L58 64 L60 70 L62 64 L65 70" fill="#e2e8f0" />
          {/* Chest Sigil */}
          <polygon points="60,82 67,92 60,102 53,92" fill="#c084fc" stroke="#f5d0fe" strokeWidth="1.6" />
        </svg>
      );
    }

    if (variant === 'dragon') {
      // Ember Wyrm: armored crimson wyrm, flared wing claws, golden horns & roaring fire breath
      return (
        <svg viewBox="0 0 120 120" className={className} fill="none" aria-hidden="true">
          <defs>
            <radialGradient id="dragonAura2" cx="50%" cy="48%" r="54%">
              <stop offset="0%" stopColor="#f97316" stopOpacity="0.82" />
              <stop offset="55%" stopColor="#991b1b" stopOpacity="0.34" />
              <stop offset="100%" stopColor="#000000" stopOpacity="0" />
            </radialGradient>
            <linearGradient id="wyrmScale" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#ef4444" />
              <stop offset="55%" stopColor="#991b1b" />
              <stop offset="100%" stopColor="#450a0a" />
            </linearGradient>
          </defs>
          <circle cx="60" cy="60" r="54" fill="url(#dragonAura2)" />
          {/* Wing Silhouettes */}
          <path d="M8 70 L24 24 L44 50 L26 86 Z" fill="#450a0a" stroke="#fb923c" strokeWidth="2.2" />
          <path d="M112 70 L96 24 L76 50 L94 86 Z" fill="#450a0a" stroke="#fb923c" strokeWidth="2.2" />
          {/* Scaled Neck */}
          <path d="M40 106 L44 64 L76 64 L80 106 Z" fill="url(#wyrmScale)" stroke="#f97316" strokeWidth="2" />
          <path d="M48 76 Q60 80 72 76 M46 88 Q60 92 74 88" stroke="#fbbf24" strokeWidth="1.8" opacity="0.7" />
          {/* Dual Crest Horns */}
          <path d="M44 33 L27 8 L53 23 Z" fill="#fbbf24" stroke="#78350f" strokeWidth="1.6" />
          <path d="M76 33 L93 8 L67 23 Z" fill="#fbbf24" stroke="#78350f" strokeWidth="1.6" />
          {/* Armored Dragon Head */}
          <path d="M38 33 L60 20 L82 33 L77 63 L60 75 L43 63 Z" fill="url(#wyrmScale)" stroke="#fde047" strokeWidth="2.3" strokeLinejoin="round" />
          <path d="M45 36 L60 44 L75 36" stroke="#7f1d1d" strokeWidth="2.2" />
          {/* Fiery Eyes */}
          <path d="M44 41 L56 46 L46 49 Z" fill="#fef08a" />
          <path d="M76 41 L64 46 L74 49 Z" fill="#fef08a" />
          {/* Roaring Fire Breath */}
          <path d="M51 70 C44 86, 52 100, 60 112 C68 100, 76 86, 69 70 Z" fill="#f97316" />
          <path d="M55 72 C52 84, 56 94, 60 102 C64 94, 68 84, 65 72 Z" fill="#fde047" />
          <circle cx="60" cy="82" r="3.5" fill="#ffffff" opacity="0.8" />
        </svg>
      );
    }

    // Default: Crypt Skeleton with layered cranium, cracked bone, pauldrons & glowing eyes
    return (
      <svg viewBox="0 0 120 120" className={className} fill="none" aria-hidden="true">
        <defs>
          <radialGradient id="skelAura2" cx="50%" cy="46%" r="54%">
            <stop offset="0%" stopColor="#f43f5e" stopOpacity="0.58" />
            <stop offset="60%" stopColor="#31102f" stopOpacity="0.22" />
            <stop offset="100%" stopColor="#000000" stopOpacity="0" />
          </radialGradient>
          <linearGradient id="skullGrad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#ffffff" />
            <stop offset="55%" stopColor="#e2e8f0" />
            <stop offset="100%" stopColor="#64748b" />
          </linearGradient>
        </defs>
        <circle cx="60" cy="60" r="54" fill="url(#skelAura2)" />
        {/* Rusted Crypt Armor & Ribcage */}
        <path d="M20 108 C22 80, 38 71, 60 71 C82 71, 98 80, 100 108 Z" fill="#1e293b" stroke="#64748b" strokeWidth="2.2" />
        <path d="M22 84 L38 72 L43 86 Z M98 84 L82 72 L77 86 Z" fill="#334155" stroke="#94a3b8" strokeWidth="1.8" />
        <path d="M44 80 L76 80 M46 90 L74 90 M49 100 L71 100" stroke="#e2e8f0" strokeWidth="3.6" strokeLinecap="round" />
        <path d="M60 72 L60 106" stroke="#cbd5e1" strokeWidth="3.4" />
        {/* Shaded Cranium & Jaw */}
        <path
          d="M36 40 C36 20, 84 20, 84 40 C84 52, 75 58, 72 67 L72 74 L48 74 L48 67 C45 58, 36 52, 36 40 Z"
          fill="url(#skullGrad)"
          stroke="#334155"
          strokeWidth="2.4"
        />
        {/* Cranium Fracture & Brow Shadow */}
        <path d="M69 24 L64 33 L68 37" stroke="#64748b" strokeWidth="1.8" strokeLinecap="round" />
        <path d="M41 39 Q60 44 79 39" stroke="#94a3b8" strokeWidth="1.4" opacity="0.6" />
        {/* Recessed Eye Sockets & Crimson Glow */}
        <ellipse cx="49" cy="45" rx="6.5" ry="7" fill="#09090b" />
        <ellipse cx="71" cy="45" rx="6.5" ry="7" fill="#09090b" />
        <circle cx="49" cy="45" r="2.8" fill="#ef4444" />
        <circle cx="71" cy="45" r="2.8" fill="#ef4444" />
        <circle cx="49" cy="44.5" r="1.1" fill="#fde047" />
        <circle cx="71" cy="44.5" r="1.1" fill="#fde047" />
        {/* Nasal Cavity & Teeth */}
        <path d="M60 50 L56 58 L64 58 Z" fill="#0f172a" />
        <path d="M52 65 L52 74 M57 65 L57 74 M63 65 L63 74 M68 65 L68 74" stroke="#334155" strokeWidth="2" />
      </svg>
    );
  }

  /* MERCHANT ITEM ARTWORK */
  if (type === 'MERCHANT_ITEM') {
    return (
      <svg viewBox="0 0 100 100" className={className} fill="none" aria-hidden="true">
        <defs>
          <radialGradient id="merchAura" cx="50%" cy="48%" r="52%">
            <stop offset="0%" stopColor="#fbbf24" stopOpacity="0.65" />
            <stop offset="100%" stopColor="#78350f" stopOpacity="0" />
          </radialGradient>
        </defs>
        <circle cx="50" cy="50" r="44" fill="url(#merchAura)" />
        <path d="M50 18 L50 76" stroke="#fde68a" strokeWidth="3.5" strokeLinecap="round" />
        <path d="M22 32 L78 32" stroke="#fbbf24" strokeWidth="3.5" strokeLinecap="round" />
        <path d="M36 78 L64 78 L60 85 L40 85 Z" fill="#b45309" stroke="#fde68a" strokeWidth="1.8" />
        <path d="M24 32 L16 54 M24 32 L32 54" stroke="#fcd34d" strokeWidth="1.6" />
        <path d="M13 54 Q24 64 35 54 Z" fill="#f59e0b" stroke="#fef08a" strokeWidth="1.8" />
        <path d="M76 32 L68 54 M76 32 L84 54" stroke="#fcd34d" strokeWidth="1.6" />
        <path d="M65 54 Q76 64 87 54 Z" fill="#f59e0b" stroke="#fef08a" strokeWidth="1.8" />
        <circle cx="50" cy="28" r="5" fill="#fbbf24" stroke="#ffffff" strokeWidth="1.5" />
      </svg>
    );
  }

  /* ANCIENT SHRINE ARTWORK */
  if (type === 'SHRINE_BOON') {
    return (
      <svg viewBox="0 0 100 100" className={className} fill="none" aria-hidden="true">
        <defs>
          <radialGradient id="shrineAura" cx="50%" cy="48%" r="54%">
            <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.7" />
            <stop offset="55%" stopColor="#8b5cf6" stopOpacity="0.35" />
            <stop offset="100%" stopColor="#1e1b4b" stopOpacity="0" />
          </radialGradient>
        </defs>
        <circle cx="50" cy="50" r="44" fill="url(#shrineAura)" />
        <polygon points="50,14 63,34 50,54 37,34" fill="#38bdf8" stroke="#e0f2fe" strokeWidth="2.2" />
        <polygon points="50,18 57,34 50,50 43,34" fill="#bae6fd" opacity="0.65" />
        <path d="M26 62 L74 62 L68 72 L32 72 Z" fill="#475569" stroke="#cbd5e1" strokeWidth="2" />
        <rect x="34" y="72" width="32" height="14" fill="#334155" stroke="#94a3b8" strokeWidth="2" />
        <path d="M24 86 L76 86" stroke="#c084fc" strokeWidth="3" strokeLinecap="round" />
      </svg>
    );
  }

  /* DESCEND EXIT STAIRS ARTWORK */
  if (type === 'EXIT') {
    return (
      <svg viewBox="0 0 100 100" className={className} fill="none" aria-hidden="true">
        <defs>
          <radialGradient id="exitAura" cx="50%" cy="50%" r="52%">
            <stop offset="0%" stopColor="#10b981" stopOpacity="0.6" />
            <stop offset="100%" stopColor="#064e3b" stopOpacity="0" />
          </radialGradient>
        </defs>
        <circle cx="50" cy="50" r="44" fill="url(#exitAura)" />
        <path d="M22 84 L22 44 Q50 14 78 44 L78 84 Z" fill="#0f172a" stroke="#6ee7b7" strokeWidth="3" />
        <rect x="30" y="54" width="40" height="7" rx="1.5" fill="#334155" stroke="#94a3b8" strokeWidth="1.2" />
        <rect x="27" y="64" width="46" height="8" rx="1.5" fill="#475569" stroke="#94a3b8" strokeWidth="1.2" />
        <rect x="24" y="75" width="52" height="9" rx="1.5" fill="#64748b" stroke="#cbd5e1" strokeWidth="1.2" />
        <path d="M50 28 L50 48 M43 41 L50 48 L57 41" stroke="#34d399" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    );
  }

  if (type === 'GOLD') {
    return (
      <svg viewBox="0 0 100 100" className={className} fill="none" aria-hidden="true">
        <defs>
          <radialGradient id="chestGlow" cx="50%" cy="48%" r="52%">
            <stop offset="0%" stopColor="#fef08a" stopOpacity="0.65" />
            <stop offset="100%" stopColor="#d97706" stopOpacity="0" />
          </radialGradient>
        </defs>
        <circle cx="50" cy="50" r="44" fill="url(#chestGlow)" />
        <path d="M22 42 L30 18 L72 22 L76 46 Z" fill="#78350f" stroke="#fbbf24" strokeWidth="2.4" />
        <circle cx="38" cy="40" r="7" fill="#fbbf24" stroke="#fef08a" strokeWidth="1.4" />
        <circle cx="49" cy="37" r="7.5" fill="#f59e0b" stroke="#fef08a" strokeWidth="1.4" />
        <circle cx="60" cy="41" r="7" fill="#fbbf24" stroke="#fef08a" strokeWidth="1.4" />
        <circle cx="44" cy="46" r="7" fill="#f59e0b" stroke="#fef08a" strokeWidth="1.4" />
        <circle cx="55" cy="46" r="7" fill="#fbbf24" stroke="#fef08a" strokeWidth="1.4" />
        <path d="M20 46 L78 46 L74 82 L24 82 Z" fill="#92400e" stroke="#fbbf24" strokeWidth="2.5" />
        <path d="M22 60 L76 60" stroke="#78350f" strokeWidth="2" />
        <rect x="43" y="48" width="12" height="15" rx="2.5" fill="#fbbf24" stroke="#78350f" strokeWidth="1.6" />
        <circle cx="49" cy="55" r="2.2" fill="#78350f" />
      </svg>
    );
  }

  if (type === 'SHIELD') {
    return (
      <svg viewBox="0 0 100 100" className={className} fill="none" aria-hidden="true">
        <defs>
          <radialGradient id="shdAura" cx="50%" cy="48%" r="50%">
            <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.55" />
            <stop offset="100%" stopColor="#0284c7" stopOpacity="0" />
          </radialGradient>
          <linearGradient id="shdFace" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#60a5fa" />
            <stop offset="50%" stopColor="#1d4ed8" />
            <stop offset="100%" stopColor="#0f172a" />
          </linearGradient>
        </defs>
        <circle cx="50" cy="50" r="44" fill="url(#shdAura)" />
        <path
          d="M22 24 L50 14 L78 24 L75 54 C72 70, 58 80, 50 86 C42 80, 28 70, 25 54 Z"
          fill="url(#shdFace)"
          stroke="#fbbf24"
          strokeWidth="3.5"
        />
        <path
          d="M30 30 L50 22 L70 30 L68 52 C65 65, 55 73, 50 77 C45 73, 35 65, 32 52 Z"
          fill="#1e3a8a"
          stroke="#93c5fd"
          strokeWidth="1.5"
        />
        <path d="M50 22 L50 77 M32 45 L68 45" stroke="#fbbf24" strokeWidth="2.5" />
        <circle cx="50" cy="45" r="7" fill="#fbbf24" stroke="#fef08a" strokeWidth="1.5" />
      </svg>
    );
  }

  if (type === 'SPELL') {
    return (
      <svg viewBox="0 0 100 100" className={className} fill="none" aria-hidden="true">
        <defs>
          <radialGradient id="spellAura" cx="50%" cy="55%" r="50%">
            <stop offset="0%" stopColor="#fde047" stopOpacity="0.9" />
            <stop offset="45%" stopColor="#f97316" stopOpacity="0.65" />
            <stop offset="100%" stopColor="#be185d" stopOpacity="0" />
          </radialGradient>
        </defs>
        <circle cx="50" cy="55" r="42" fill="url(#spellAura)" />
        <path d="M22 92 C24 68, 34 62, 50 62 C66 62, 76 68, 78 92 Z" fill="#334155" stroke="#fb923c" strokeWidth="2" />
        <path d="M36 32 C36 18, 64 18, 64 32 L62 50 C57 57, 43 57, 38 50 Z" fill="#475569" stroke="#cbd5e1" strokeWidth="2" />
        <path d="M40 38 L60 38 L58 43 L42 43 Z" fill="#0f172a" />
        <circle cx="45" cy="40.5" r="1.8" fill="#fde047" />
        <circle cx="55" cy="40.5" r="1.8" fill="#fde047" />
        <circle cx="50" cy="68" r="13" fill="#fde047" stroke="#f97316" strokeWidth="3" />
        <circle cx="50" cy="68" r="7" fill="#ffffff" opacity="0.85" />
      </svg>
    );
  }

  if (type === 'WEAPON') {
    const isTorch = variant === 'torch';
    return (
      <svg viewBox="0 0 100 100" className={className} fill="none" aria-hidden="true">
        <defs>
          <radialGradient id="wpnAura" cx="50%" cy="40%" r="50%">
            <stop offset="0%" stopColor="#fb923c" stopOpacity="0.6" />
            <stop offset="100%" stopColor="#ea580c" stopOpacity="0" />
          </radialGradient>
        </defs>
        <circle cx="50" cy="46" r="42" fill="url(#wpnAura)" />
        {isTorch ? (
          <>
            <path d="M45 48 L55 48 L53 88 L47 88 Z" fill="#78350f" stroke="#fbbf24" strokeWidth="2" />
            <rect x="42" y="44" width="16" height="6" rx="2" fill="#57534e" />
            <path d="M50 12 C63 23, 66 37, 56 44 L44 44 C34 37, 37 23, 50 12 Z" fill="#f97316" />
            <path d="M50 20 C56 27, 57 35, 52 41 L48 41 C43 35, 44 27, 50 20 Z" fill="#fde047" />
          </>
        ) : (
          <>
            <path d="M50 12 L59 27 L55 64 L45 64 L41 27 Z" fill="#fed7aa" stroke="#f97316" strokeWidth="2.4" />
            <path d="M50 16 L50 62" stroke="#f97316" strokeWidth="2" />
            <path d="M30 64 L70 64 L65 69 L35 69 Z" fill="#b45309" stroke="#fbbf24" strokeWidth="1.5" />
            <rect x="47" y="69" width="6" height="14" fill="#451a03" />
            <circle cx="50" cy="86" r="4.5" fill="#fbbf24" />
          </>
        )}
      </svg>
    );
  }

  if (type === 'BONUS') {
    return (
      <svg viewBox="0 0 100 100" className={className} fill="none" aria-hidden="true">
        <defs>
          <radialGradient id="bonusAura" cx="50%" cy="48%" r="52%">
            <stop offset="0%" stopColor="#fde047" stopOpacity="0.8" />
            <stop offset="45%" stopColor="#a855f7" stopOpacity="0.45" />
            <stop offset="100%" stopColor="#3b0764" stopOpacity="0" />
          </radialGradient>
        </defs>
        <circle cx="50" cy="50" r="44" fill="url(#bonusAura)" />
        <path
          d="M22 66 L18 34 L36 48 L50 22 L64 48 L82 34 L78 66 Z"
          fill="#fbbf24"
          stroke="#fef08a"
          strokeWidth="2.5"
          strokeLinejoin="round"
        />
        <rect
          x="22"
          y="66"
          width="56"
          height="11"
          rx="3"
          fill="#b45309"
          stroke="#fde68a"
          strokeWidth="2"
        />
        <circle cx="50" cy="49" r="5.5" fill="#a855f7" stroke="#f5d0fe" strokeWidth="1.5" />
        <circle cx="33" cy="56" r="3.5" fill="#38bdf8" stroke="#e0f2fe" strokeWidth="1" />
        <circle cx="67" cy="56" r="3.5" fill="#38bdf8" stroke="#e0f2fe" strokeWidth="1" />
      </svg>
    );
  }

  // POTION
  return (
    <svg viewBox="0 0 100 100" className={className} fill="none" aria-hidden="true">
      <defs>
        <radialGradient id="potAura" cx="50%" cy="54%" r="50%">
          <stop offset="0%" stopColor="#10b981" stopOpacity="0.55" />
          <stop offset="100%" stopColor="#059669" stopOpacity="0" />
        </radialGradient>
      </defs>
      <circle cx="50" cy="52" r="42" fill="url(#potAura)" />
      <rect x="44" y="15" width="12" height="9" rx="2" fill="#b45309" stroke="#fbbf24" strokeWidth="1.2" />
      <path
        d="M41 24 L59 24 L56 37 L72 55 C77 65, 70 83, 50 83 C30 83, 23 65, 28 55 L44 37 Z"
        fill="#064e3b"
        stroke="#6ee7b7"
        strokeWidth="2.5"
      />
      <path d="M32 60 C41 56, 59 64, 68 59 C70 68, 64 79, 50 79 C36 79, 30 68, 32 60 Z" fill="#10b981" />
      <path d="M50 62 L50 74 M44 68 L56 68" stroke="#ecfdf5" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
};
