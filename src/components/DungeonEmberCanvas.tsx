import React, { useEffect, useRef, useState } from 'react';
import { ParticleBurstRequest } from '../types/game';

interface Ember {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  alpha: number;
  life: number;
  maxLife: number;
  color: string;
  isBurst: boolean;
  gravity?: number;
}

interface DungeonEmberCanvasProps {
  burst: ParticleBurstRequest | null;
  intense?: boolean;
  palette?: string[];
  speedFactor?: number;
  interactive?: boolean;
  titleOverlay?: boolean;
}

const DEFAULT_COLORS = ['#fb923c', '#f97316', '#fbbf24', '#ef4444'];
const VICTORY_COLORS = [
  '#fbbf24',
  '#f59e0b',
  '#fde68a',
  '#10b981',
  '#f97316',
  '#c084fc',
];

export const DungeonEmberCanvas: React.FC<DungeonEmberCanvasProps> = ({
  burst,
  intense = false,
  palette = DEFAULT_COLORS,
  speedFactor = 1,
  interactive = false,
  titleOverlay = false,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const particlesRef = useRef<Ember[]>([]);
  const paletteRef = useRef<string[]>(palette);
  const speedRef = useRef<number>(speedFactor);
  const interactiveRef = useRef<boolean>(interactive);
  const pointerRef = useRef<{
    x: number;
    y: number;
    vx: number;
    vy: number;
    active: boolean;
  }>({ x: 0, y: 0, vx: 0, vy: 0, active: false });
  const [celebrating, setCelebrating] = useState(false);

  useEffect(() => {
    paletteRef.current = palette;
  }, [palette]);

  useEffect(() => {
    speedRef.current = speedFactor;
  }, [speedFactor]);

  useEffect(() => {
    interactiveRef.current = interactive;
  }, [interactive]);

  useEffect(() => {
    if (!interactive) {
      pointerRef.current.active = false;
      return;
    }

    const prefersReducedMotion =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) return;

    let lastSpawnAt = 0;

    const handlePointerMove = (e: PointerEvent) => {
      const prev = pointerRef.current;
      const dx = prev.active ? e.clientX - prev.x : 0;
      const dy = prev.active ? e.clientY - prev.y : 0;
      pointerRef.current = {
        x: e.clientX,
        y: e.clientY,
        vx: Math.max(-12, Math.min(12, dx)),
        vy: Math.max(-12, Math.min(12, dy)),
        active: true,
      };

      const now = performance.now();
      if (now - lastSpawnAt < 24) return;
      lastSpawnAt = now;

      const colors = paletteRef.current;
      const sparkCount = Math.hypot(dx, dy) > 8 ? 2 : 1;
      for (let i = 0; i < sparkCount; i++) {
        particlesRef.current.push({
          x: e.clientX + (Math.random() - 0.5) * 14,
          y: e.clientY + (Math.random() - 0.5) * 14,
          vx: dx * 0.12 + (Math.random() - 0.5) * 1.4,
          vy: dy * 0.08 - (0.9 + Math.random() * 1.4),
          radius: 1.5 + Math.random() * 2.4,
          alpha: 0.85,
          life: 0,
          maxLife: 34 + Math.random() * 22,
          color: colors[Math.floor(Math.random() * colors.length)],
          isBurst: true,
          gravity: -0.015,
        });
      }
    };

    const handlePointerLeave = () => {
      pointerRef.current.active = false;
    };

    window.addEventListener('pointermove', handlePointerMove, { passive: true });
    window.addEventListener('pointerleave', handlePointerLeave);
    return () => {
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerleave', handlePointerLeave);
    };
  }, [interactive]);

  useEffect(() => {
    if (!burst || !canvasRef.current) return;
    const width = canvasRef.current.clientWidth || window.innerWidth;
    const height = canvasRef.current.clientHeight || window.innerHeight;

    if (burst.celebration) {
      setCelebrating(true);
      const colors =
        burst.palette && burst.palette.length > 0 ? burst.palette : VICTORY_COLORS;

      const origins = [
        { x: 0.14 * width, y: 0.85 * height, baseVy: -6.5, spreadVx: 6.2 },
        { x: 0.86 * width, y: 0.85 * height, baseVy: -6.5, spreadVx: 6.2 },
        { x: 0.5 * width, y: 0.24 * height, baseVy: -3.2, spreadVx: 8.4 },
      ];

      for (let i = 0; i < burst.count; i++) {
        const color = colors[i % colors.length];
        if (i < burst.count * 0.7) {
          const origin = origins[i % origins.length];
          const angle = Math.random() * Math.PI * 2;
          const speed = 2.4 + Math.random() * 6.8;
          particlesRef.current.push({
            x: origin.x + (Math.random() - 0.5) * 40,
            y: origin.y + (Math.random() - 0.5) * 30,
            vx: Math.cos(angle) * (origin.spreadVx * 0.65) + (Math.random() - 0.5) * 2.5,
            vy: Math.sin(angle) * speed * 0.65 + origin.baseVy * 0.45,
            radius: 2.2 + Math.random() * 3.4,
            alpha: 1,
            life: 0,
            maxLife: 62 + Math.random() * 44,
            color,
            isBurst: true,
            gravity: 0.11,
          });
        } else {
          // Screen-wide raining Victory sparks
          particlesRef.current.push({
            x: Math.random() * width,
            y: Math.random() * (height * 0.55),
            vx: (Math.random() - 0.5) * 3.4,
            vy: -1.8 + Math.random() * 3.2,
            radius: 2.0 + Math.random() * 3.0,
            alpha: 0.95,
            life: 0,
            maxLife: 56 + Math.random() * 40,
            color,
            isBurst: true,
            gravity: 0.06,
          });
        }
      }

      const timer = window.setTimeout(() => {
        setCelebrating(false);
      }, 2200);
      return () => window.clearTimeout(timer);
    }

    const originX = burst.xRatio * width;
    const originY = burst.yRatio * height;

    for (let i = 0; i < burst.count; i++) {
      const angle = (Math.PI * 2 * i) / burst.count + (Math.random() - 0.5) * 0.6;
      const speed = 1.6 + Math.random() * 4.2;
      particlesRef.current.push({
        x: originX,
        y: originY,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 1.2,
        radius: 1.8 + Math.random() * 3.0,
        alpha: 1,
        life: 0,
        maxLife: 24 + Math.random() * 20,
        color: burst.color,
        isBurst: true,
        gravity: 0.08,
      });
    }
  }, [burst]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const prefersReducedMotion =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    let animId = 0;
    let width = 0;
    let height = 0;

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    resize();
    window.addEventListener('resize', resize);

    const spawnAmbient = () => {
      if (prefersReducedMotion) return;
      const maxAmbient = intense ? 48 : 22;
      if (particlesRef.current.filter((p) => !p.isBurst).length >= maxAmbient) return;

      const colors = paletteRef.current;
      const sf = speedRef.current;
      particlesRef.current.push({
        x: Math.random() * width,
        y: height + 10,
        vx: (Math.random() - 0.5) * 0.45,
        vy: -(0.4 + Math.random() * (intense ? 1.15 : 0.75)) * sf,
        radius: 1.1 + Math.random() * 2.2,
        alpha: 0.28 + Math.random() * 0.52,
        life: 0,
        maxLife: 180 + Math.random() * 140,
        color: colors[Math.floor(Math.random() * colors.length)],
        isBurst: false,
      });
    };

    const tick = () => {
      ctx.clearRect(0, 0, width, height);

      if (Math.random() < (intense ? 0.36 : 0.16)) {
        spawnAmbient();
      }

      const pointer = pointerRef.current;
      const nextParticles: Ember[] = [];
      for (const p of particlesRef.current) {
        p.life += 1;
        if (p.life >= p.maxLife) continue;

        if (interactiveRef.current && pointer.active && !p.isBurst) {
          const dx = p.x - pointer.x;
          const dy = p.y - pointer.y;
          const distSq = dx * dx + dy * dy;
          if (distSq > 1 && distSq < 12100) {
            const dist = Math.sqrt(distSq);
            const force = (1 - dist / 110) * 0.24;
            p.vx += (dx / dist) * force + pointer.vx * 0.012;
            p.vy += (dy / dist) * force * 0.6;
          }
        }

        p.x += p.vx;
        p.y += p.vy;
        if (p.isBurst) {
          p.vy += p.gravity ?? 0.08;
          p.vx *= 0.975;
        } else {
          p.vx *= 0.99;
          p.vx += Math.sin(p.life * 0.05) * 0.015;
        }

        const progress = p.life / p.maxLife;
        const opacity = p.alpha * (1 - progress);

        ctx.save();
        ctx.globalAlpha = Math.max(0, opacity);
        ctx.fillStyle = p.color;
        ctx.shadowColor = p.color;
        ctx.shadowBlur = p.isBurst ? 12 : 7;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();

        nextParticles.push(p);
      }

      particlesRef.current = nextParticles;
      animId = requestAnimationFrame(tick);
    };

    animId = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', resize);
    };
  }, [intense]);

  return (
    <canvas
      ref={canvasRef}
      className={`pointer-events-none fixed inset-0 ${
        celebrating ? 'z-[55]' : titleOverlay ? 'z-[15]' : 'z-0'
      }`}
      aria-hidden="true"
    />
  );
};
