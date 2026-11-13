import React, { useEffect, useRef } from 'react';
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
}

interface DungeonEmberCanvasProps {
  burst: ParticleBurstRequest | null;
  intense?: boolean;
  palette?: string[];
  speedFactor?: number;
}

const DEFAULT_COLORS = ['#fb923c', '#f97316', '#fbbf24', '#ef4444'];

export const DungeonEmberCanvas: React.FC<DungeonEmberCanvasProps> = ({
  burst,
  intense = false,
  palette = DEFAULT_COLORS,
  speedFactor = 1,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const particlesRef = useRef<Ember[]>([]);
  const paletteRef = useRef<string[]>(palette);
  const speedRef = useRef<number>(speedFactor);

  useEffect(() => {
    paletteRef.current = palette;
  }, [palette]);

  useEffect(() => {
    speedRef.current = speedFactor;
  }, [speedFactor]);

  useEffect(() => {
    if (!burst || !canvasRef.current) return;
    const width = canvasRef.current.clientWidth || window.innerWidth;
    const height = canvasRef.current.clientHeight || window.innerHeight;
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
      const maxAmbient = intense ? 42 : 22;
      if (particlesRef.current.filter((p) => !p.isBurst).length >= maxAmbient) return;

      const colors = paletteRef.current;
      const sf = speedRef.current;
      particlesRef.current.push({
        x: Math.random() * width,
        y: height + 10,
        vx: (Math.random() - 0.5) * 0.45,
        vy: -(0.4 + Math.random() * (intense ? 1.15 : 0.75)) * sf,
        radius: 1.1 + Math.random() * 2.1,
        alpha: 0.25 + Math.random() * 0.5,
        life: 0,
        maxLife: 180 + Math.random() * 140,
        color: colors[Math.floor(Math.random() * colors.length)],
        isBurst: false,
      });
    };

    const tick = () => {
      ctx.clearRect(0, 0, width, height);

      if (Math.random() < (intense ? 0.34 : 0.16)) {
        spawnAmbient();
      }

      const nextParticles: Ember[] = [];
      for (const p of particlesRef.current) {
        p.life += 1;
        if (p.life >= p.maxLife) continue;

        p.x += p.vx;
        p.y += p.vy;
        if (p.isBurst) {
          p.vy += 0.08;
          p.vx *= 0.97;
        } else {
          p.vx += Math.sin(p.life * 0.05) * 0.015;
        }

        const progress = p.life / p.maxLife;
        const opacity = p.alpha * (1 - progress);

        ctx.save();
        ctx.globalAlpha = Math.max(0, opacity);
        ctx.fillStyle = p.color;
        ctx.shadowColor = p.color;
        ctx.shadowBlur = p.isBurst ? 10 : 6;
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
      className="pointer-events-none fixed inset-0 z-0"
      aria-hidden="true"
    />
  );
};
