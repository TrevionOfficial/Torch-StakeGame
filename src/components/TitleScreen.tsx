import React, { useEffect, useState } from 'react';
import { BookOpen, Compass, Play } from 'lucide-react';
import { formatMoney } from '../services/rgsClient';
import { RgsConfig } from '../types/game';

interface TitleScreenProps {
  balance: number;
  rgsConfig: RgsConfig;
  authLoading: boolean;
  onPlay: () => void;
  onOpenRules: () => void;
}

const VAULT_BACKDROP_SRC =
  './assets/aistudio/Gemini_Generated_Image_9mobc99mobc99mob_4b25c41a.jpeg';
const KNIGHT_SPRITE_SRC =
  './assets/aistudio/Gemini_Generated_Image_k1yah9k1yah9k1ya_74ba8201.jpeg';
const FALLBACK_COVER_SRC =
  './assets/aistudio/Torch_CoverArt__1__7bc8ec95.jpeg';
const COMPASS_LOGO_SRC =
  './assets/aistudio/Gemini_Generated_Image_y5spcxy5spcxy5sp-removebg-preview_40cf27e5.png';

let cachedKnightSpriteUrl: string | null = null;
let cachedCompassLogoUrl: string | null = null;

function extractTransparentKnight(src: string): Promise<string> {
  if (cachedKnightSpriteUrl) {
    return Promise.resolve(cachedKnightSpriteUrl);
  }

  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      try {
        const maxDim = 960;
        const scale = Math.min(1, maxDim / Math.max(img.width, img.height));
        const w = Math.max(1, Math.round(img.width * scale));
        const h = Math.max(1, Math.round(img.height * scale));

        const canvas = document.createElement('canvas');
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext('2d', { willReadFrequently: true });
        if (!ctx) {
          reject(new Error('Canvas 2D context unavailable'));
          return;
        }

        ctx.drawImage(img, 0, 0, w, h);
        const imageData = ctx.getImageData(0, 0, w, h);
        const data = imageData.data;

        const sampleIndices = [0, (w - 1) * 4, (h - 1) * w * 4, (w * h - 1) * 4];
        let bgR = 0;
        let bgG = 0;
        let bgB = 0;
        for (const idx of sampleIndices) {
          bgR += data[idx];
          bgG += data[idx + 1];
          bgB += data[idx + 2];
        }
        bgR /= sampleIndices.length;
        bgG /= sampleIndices.length;
        bgB /= sampleIndices.length;

        const visited = new Uint8Array(w * h);
        const removed = new Uint8Array(w * h);
        const queue = new Int32Array(w * h);
        let head = 0;
        let tail = 0;

        const isPaperPixel = (pixelIdx: number): boolean => {
          const offset = pixelIdx * 4;
          const r = data[offset];
          const g = data[offset + 1];
          const b = data[offset + 2];
          const dist = Math.hypot(r - bgR, g - bgG, b - bgB);
          const chroma = Math.max(r, g, b) - Math.min(r, g, b);
          return dist < 52 && chroma < 32 && r > 180 && g > 175 && b > 165;
        };

        const enqueueEdge = (x: number, y: number) => {
          const idx = y * w + x;
          if (!visited[idx] && isPaperPixel(idx)) {
            visited[idx] = 1;
            queue[tail++] = idx;
          }
        };

        for (let x = 0; x < w; x++) {
          enqueueEdge(x, 0);
          enqueueEdge(x, h - 1);
        }
        for (let y = 1; y < h - 1; y++) {
          enqueueEdge(0, y);
          enqueueEdge(w - 1, y);
        }

        while (head < tail) {
          const idx = queue[head++];
          removed[idx] = 1;
          data[idx * 4 + 3] = 0;

          const x = idx % w;
          const y = (idx - x) / w;

          if (x > 0) {
            const left = idx - 1;
            if (!visited[left] && isPaperPixel(left)) {
              visited[left] = 1;
              queue[tail++] = left;
            }
          }
          if (x < w - 1) {
            const right = idx + 1;
            if (!visited[right] && isPaperPixel(right)) {
              visited[right] = 1;
              queue[tail++] = right;
            }
          }
          if (y > 0) {
            const up = idx - w;
            if (!visited[up] && isPaperPixel(up)) {
              visited[up] = 1;
              queue[tail++] = up;
            }
          }
          if (y < h - 1) {
            const down = idx + w;
            if (!visited[down] && isPaperPixel(down)) {
              visited[down] = 1;
              queue[tail++] = down;
            }
          }
        }

        for (let y = 1; y < h - 1; y++) {
          for (let x = 1; x < w - 1; x++) {
            const idx = y * w + x;
            if (removed[idx]) continue;
            const hasRemovedNeighbor =
              removed[idx - 1] ||
              removed[idx + 1] ||
              removed[idx - w] ||
              removed[idx + w];
            if (!hasRemovedNeighbor) continue;

            const offset = idx * 4;
            const r = data[offset];
            const g = data[offset + 1];
            const b = data[offset + 2];
            const dist = Math.hypot(r - bgR, g - bgG, b - bgB);
            if (dist < 85 && r > 135 && g > 130 && b > 120) {
              data[offset + 3] = Math.round(Math.min(255, (dist / 85) * 210));
            }
          }
        }

        ctx.putImageData(imageData, 0, 0);

        // Trim transparent padding so knight scales accurately from plume tip to boot sole
        let minX = w;
        let minY = h;
        let maxX = 0;
        let maxY = 0;
        for (let y = 0; y < h; y++) {
          for (let x = 0; x < w; x++) {
            if (data[(y * w + x) * 4 + 3] > 12) {
              if (x < minX) minX = x;
              if (x > maxX) maxX = x;
              if (y < minY) minY = y;
              if (y > maxY) maxY = y;
            }
          }
        }

        const cropW = Math.max(1, maxX - minX + 1);
        const cropH = Math.max(1, maxY - minY + 1);
        const cropped = document.createElement('canvas');
        cropped.width = cropW;
        cropped.height = cropH;
        const cCtx = cropped.getContext('2d');
        if (cCtx) {
          cCtx.drawImage(canvas, minX, minY, cropW, cropH, 0, 0, cropW, cropH);
          const resultUrl = cropped.toDataURL('image/png');
          cachedKnightSpriteUrl = resultUrl;
          resolve(resultUrl);
        } else {
          const resultUrl = canvas.toDataURL('image/png');
          cachedKnightSpriteUrl = resultUrl;
          resolve(resultUrl);
        }
      } catch (err) {
        reject(err);
      }
    };
    img.onerror = () => reject(new Error('Failed to load knight artwork'));
    img.src = src;
  });
}

function trimTransparentLogo(src: string): Promise<string> {
  if (cachedCompassLogoUrl) {
    return Promise.resolve(cachedCompassLogoUrl);
  }

  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      try {
        const w = img.width;
        const h = img.height;
        const canvas = document.createElement('canvas');
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext('2d', { willReadFrequently: true });
        if (!ctx) {
          reject(new Error('Canvas 2D context unavailable'));
          return;
        }
        ctx.drawImage(img, 0, 0);
        const { data } = ctx.getImageData(0, 0, w, h);

        let minX = w;
        let minY = h;
        let maxX = 0;
        let maxY = 0;
        for (let y = 0; y < h; y++) {
          for (let x = 0; x < w; x++) {
            if (data[(y * w + x) * 4 + 3] > 10) {
              if (x < minX) minX = x;
              if (x > maxX) maxX = x;
              if (y < minY) minY = y;
              if (y > maxY) maxY = y;
            }
          }
        }

        const cropW = Math.max(1, maxX - minX + 1);
        const cropH = Math.max(1, maxY - minY + 1);
        const cropped = document.createElement('canvas');
        cropped.width = cropW;
        cropped.height = cropH;
        const cCtx = cropped.getContext('2d');
        if (!cCtx) {
          resolve(src);
          return;
        }
        cCtx.drawImage(canvas, minX, minY, cropW, cropH, 0, 0, cropW, cropH);
        const resultUrl = cropped.toDataURL('image/png');
        cachedCompassLogoUrl = resultUrl;
        resolve(resultUrl);
      } catch (err) {
        reject(err);
      }
    };
    img.onerror = () => reject(new Error('Failed to load logo'));
    img.src = src;
  });
}

export const TitleScreen: React.FC<TitleScreenProps> = ({
  balance,
  rgsConfig,
  authLoading,
  onPlay,
  onOpenRules,
}) => {
  const [logoError, setLogoError] = useState(false);
  const [trimmedLogoUrl, setTrimmedLogoUrl] = useState<string>(
    () => cachedCompassLogoUrl ?? COMPASS_LOGO_SRC
  );
  const [knightUrl, setKnightUrl] = useState<string | null>(
    () => cachedKnightSpriteUrl
  );
  const [useCombinedFallback, setUseCombinedFallback] = useState(false);

  useEffect(() => {
    let cancelled = false;
    extractTransparentKnight(KNIGHT_SPRITE_SRC)
      .then((url) => {
        if (!cancelled) setKnightUrl(url);
      })
      .catch(() => {
        if (!cancelled) setUseCombinedFallback(true);
      });

    trimTransparentLogo(COMPASS_LOGO_SRC)
      .then((url) => {
        if (!cancelled) setTrimmedLogoUrl(url);
      })
      .catch(() => {
        // Keep original COMPASS_LOGO_SRC fallback
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const backdropSrc = useCombinedFallback ? FALLBACK_COVER_SRC : VAULT_BACKDROP_SRC;

  return (
    <>
      {/* Layer 1–3: Static Vault Backdrop + Torchlight Flicker + Larger Static Knight Cutout */}
      <div
        className="pointer-events-none fixed inset-0 z-[1] overflow-hidden bg-[#080a0f]"
        aria-hidden="true"
      >
        <img
          src={backdropSrc}
          alt=""
          referrerPolicy="no-referrer"
          onError={() => {
            if (!useCombinedFallback) setUseCombinedFallback(true);
          }}
          className="h-full w-full object-cover object-[50%_40%] brightness-[0.95] contrast-[1.04]"
        />

        {/* Flickering Warm Torchlight Halos matching left/right wall sconces */}
        <div
          className="animate-torch-flicker absolute left-[6%] sm:left-[14%] top-[28%] h-56 w-56 sm:h-80 sm:w-80 rounded-full mix-blend-screen"
          style={{
            background:
              'radial-gradient(circle, rgba(251, 146, 60, 0.34) 0%, rgba(245, 158, 11, 0.12) 45%, rgba(0,0,0,0) 72%)',
          }}
        />
        <div
          className="animate-torch-flicker absolute right-[6%] sm:right-[14%] top-[28%] h-56 w-56 sm:h-80 sm:w-80 rounded-full mix-blend-screen"
          style={{
            animationDelay: '1.3s',
            background:
              'radial-gradient(circle, rgba(251, 146, 60, 0.34) 0%, rgba(245, 158, 11, 0.12) 45%, rgba(0,0,0,0) 72%)',
          }}
        />

        {/* Subtle Edge Vignettes */}
        <div
          className="absolute inset-x-0 bottom-0 h-44"
          style={{
            background:
              'linear-gradient(to top, rgba(8, 10, 15, 0.92) 0%, rgba(8, 10, 15, 0.45) 55%, rgba(8, 10, 15, 0) 100%)',
          }}
        />
        <div
          className="absolute inset-x-0 top-0 h-32"
          style={{
            background:
              'linear-gradient(to bottom, rgba(8, 10, 15, 0.72) 0%, rgba(8, 10, 15, 0) 100%)',
          }}
        />

        {/* Larger Static Foreground Knight Layer */}
        {knightUrl && !useCombinedFallback && (
          <div className="absolute inset-x-0 bottom-[13dvh] sm:bottom-[15dvh] z-[4] flex justify-center">
            <img
              src={knightUrl}
              alt="Pyro-Paladin Knight"
              referrerPolicy="no-referrer"
              className="relative h-[43dvh] sm:h-[54dvh] max-h-[520px] w-auto object-contain select-none"
              style={{
                filter:
                  'drop-shadow(0 0 22px rgba(249, 115, 22, 0.32)) drop-shadow(0 18px 28px rgba(0, 0, 0, 0.9))',
              }}
            />
          </div>
        )}
      </div>

      {/* Layer 5: Top Bar (Trimmed Compass Gaming Top-Left + Guide & Balance Top-Right) + Bottom-Center PLAY */}
      <div className="relative z-20 flex h-dvh w-full flex-col justify-between overflow-hidden px-4 pt-3 pb-6 sm:px-8 sm:pt-4 sm:pb-8">
        <header className="flex items-start justify-between gap-3">
          {/* Trimmed Compass Gaming Logo positioned cleanly in upper-left stone area above the left torch */}
          <div className="shrink-0">
            {!logoError ? (
              <img
                src={trimmedLogoUrl}
                alt="Compass Gaming"
                referrerPolicy="no-referrer"
                onError={() => setLogoError(true)}
                className="h-14 sm:h-20 lg:h-24 w-auto max-w-[165px] sm:max-w-[235px] lg:max-w-[275px] object-contain drop-shadow-[0_6px_18px_rgba(0,0,0,0.95)]"
              />
            ) : (
              <Compass className="h-14 w-14 sm:h-18 sm:w-18 text-orange-400 drop-shadow-[0_4px_14px_rgba(0,0,0,0.9)]" />
            )}
          </div>

          {/* Guide & Balance shifted down ~15px */}
          <div className="mt-4 flex items-center gap-2">
            <button
              type="button"
              onClick={onOpenRules}
              className="inline-flex h-10 items-center gap-1.5 rounded-xl border border-amber-400/50 bg-stone-900/90 px-3.5 text-xs sm:text-sm font-bold text-amber-100 shadow-md transition-colors hover:border-amber-300 hover:bg-stone-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 cursor-pointer whitespace-nowrap shrink-0"
            >
              <BookOpen className="h-4 w-4 text-amber-300 shrink-0" />
              <span>Guide</span>
            </button>

            <div className="flex h-10 items-center rounded-xl border border-amber-500/45 bg-stone-950/85 px-3.5 text-xs sm:text-sm font-black text-emerald-400 tabular-nums shadow-md whitespace-nowrap shrink-0">
              {authLoading
                ? '...'
                : formatMoney(balance, rgsConfig.currency, rgsConfig.unitScale)}
            </div>
          </div>
        </header>

        {/* Standalone PLAY Button anchored at Bottom-Center */}
        <div className="flex justify-center pb-1 sm:pb-2">
          <button
            type="button"
            disabled={authLoading}
            onClick={onPlay}
            className="group relative inline-flex min-h-[54px] min-w-[220px] items-center justify-center gap-3 rounded-xl border-2 border-amber-200/80 bg-gradient-to-b from-amber-400 via-orange-500 to-amber-700 px-10 py-3.5 text-lg font-black tracking-[0.16em] text-stone-950 shadow-[0_0_32px_rgba(249,115,22,0.55),inset_0_2px_0_rgba(255,255,255,0.45)] transition-all duration-150 hover:-translate-y-0.5 hover:brightness-110 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-300 disabled:opacity-60 whitespace-nowrap shrink-0 cursor-pointer"
          >
            <Play className="h-5 w-5 fill-stone-950 transition-transform duration-150 group-hover:scale-110 shrink-0" />
            <span>{authLoading ? 'LOADING...' : 'PLAY'}</span>
          </button>
        </div>
      </div>
    </>
  );
};
