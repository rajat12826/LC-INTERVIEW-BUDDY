'use client';

import React, { useRef, useEffect, useCallback, useMemo, useState } from 'react';
import { gsap } from 'gsap';
import { InertiaPlugin } from 'gsap/InertiaPlugin';

gsap.registerPlugin(InertiaPlugin);

const throttle = (func: (...args: any[]) => void, limit: number) => {
  let lastCall = 0;
  return function (this: any, ...args: any[]) {
    const now = performance.now();
    if (now - lastCall >= limit) {
      lastCall = now;
      func.apply(this, args);
    }
  };
};

interface Dot {
  cx: number;
  cy: number;
  xOffset: number;
  yOffset: number;
  _inertiaApplied: boolean;
}

interface SpatialCell {
  dots: Dot[];
}

export interface DotGridProps {
  dotSize?: number;
  gap?: number;
  baseColor?: string;
  activeColor?: string;
  proximity?: number;
  speedTrigger?: number;
  shockRadius?: number;
  shockStrength?: number;
  maxSpeed?: number;
  resistance?: number;
  returnDuration?: number;
  className?: string;
  style?: React.CSSProperties;
}

function hexToRgb(hex: string) {
  const m = hex.match(/^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i);
  if (!m) return { r: 0, g: 0, b: 0 };
  return {
    r: parseInt(m[1], 16),
    g: parseInt(m[2], 16),
    b: parseInt(m[3], 16)
  };
}

const DotGrid: React.FC<DotGridProps> = ({
  dotSize = 16,
  gap = 32,
  baseColor = '#5227FF',
  activeColor = '#5227FF',
  proximity = 150,
  speedTrigger = 100,
  shockRadius = 250,
  shockStrength = 5,
  maxSpeed = 5000,
  resistance = 750,
  returnDuration = 1.5,
  className = '',
  style
}) => {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const dotsRef = useRef<Dot[]>([]);
  const rafIdRef = useRef<number>(0);
  const [isPaused, setIsPaused] = useState(false);
  
  // Spatial partitioning grid
  const spatialGridRef = useRef<Map<string, SpatialCell>>(new Map());
  const cellSizeRef = useRef(100);
  const canvasSizeRef = useRef({ width: 0, height: 0 });
  
  const pointerRef = useRef({
    x: 0,
    y: 0,
    vx: 0,
    vy: 0,
    speed: 0,
    lastTime: 0,
    lastX: 0,
    lastY: 0
  });

  const baseRgb = useMemo(() => hexToRgb(baseColor), [baseColor]);
  const activeRgb = useMemo(() => hexToRgb(activeColor), [activeColor]);

  const circlePath = useMemo(() => {
    if (typeof window === 'undefined' || !window.Path2D) return null;
    const p = new Path2D();
    p.arc(0, 0, dotSize / 2, 0, Math.PI * 2);
    return p;
  }, [dotSize]);

  const getCellKey = useCallback((x: number, y: number) => {
    const cellSize = cellSizeRef.current;
    const col = Math.floor(x / cellSize);
    const row = Math.floor(y / cellSize);
    return `${col},${row}`;
  }, []);

  const getNearbyDots = useCallback((x: number, y: number, radius: number) => {
    const cellSize = cellSizeRef.current;
    const nearbyDots: Dot[] = [];
    
    const minCol = Math.floor((x - radius) / cellSize);
    const maxCol = Math.floor((x + radius) / cellSize);
    const minRow = Math.floor((y - radius) / cellSize);
    const maxRow = Math.floor((y + radius) / cellSize);
    
    for (let col = minCol; col <= maxCol; col++) {
      for (let row = minRow; row <= maxRow; row++) {
        const key = `${col},${row}`;
        const cell = spatialGridRef.current.get(key);
        if (cell) {
          nearbyDots.push(...cell.dots);
        }
      }
    }
    
    return nearbyDots;
  }, []);

  const buildGrid = useCallback(() => {
    const wrap = wrapperRef.current;
    const canvas = canvasRef.current;
    if (!wrap || !canvas) return;

    const { width, height } = wrap.getBoundingClientRect();
    const dpr = Math.min(window.devicePixelRatio || 1, 2);

    canvas.width = width * dpr;
    canvas.height = height * dpr;
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    
    canvasSizeRef.current = { width, height };
    
    const ctx = canvas.getContext('2d', { 
      alpha: true,
      desynchronized: true
    });
    if (ctx) {
      ctx.scale(dpr, dpr);
      ctx.imageSmoothingEnabled = false;
    }

    const cols = Math.floor((width + gap) / (dotSize + gap));
    const rows = Math.floor((height + gap) / (dotSize + gap));
    const cell = dotSize + gap;

    const gridW = cell * cols - gap;
    const gridH = cell * rows - gap;
    const extraX = width - gridW;
    const extraY = height - gridH;
    const startX = extraX / 2 + dotSize / 2;
    const startY = extraY / 2 + dotSize / 2;

    spatialGridRef.current.clear();
    cellSizeRef.current = Math.max(proximity, 100);

    const dots: Dot[] = [];
    for (let y = 0; y < rows; y++) {
      for (let x = 0; x < cols; x++) {
        const cx = startX + x * cell;
        const cy = startY + y * cell;
        const dot: Dot = { cx, cy, xOffset: 0, yOffset: 0, _inertiaApplied: false };
        dots.push(dot);
        
        const key = getCellKey(cx, cy);
        if (!spatialGridRef.current.has(key)) {
          spatialGridRef.current.set(key, { dots: [] });
        }
        spatialGridRef.current.get(key)!.dots.push(dot);
      }
    }
    dotsRef.current = dots;
  }, [dotSize, gap, proximity, getCellKey]);

  useEffect(() => {
    if (!circlePath) return;

    const proxSq = proximity * proximity;

    const draw = () => {
      if (isPaused) {
        rafIdRef.current = requestAnimationFrame(draw);
        return;
      }

      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      
      ctx.clearRect(0, 0, canvasSizeRef.current.width, canvasSizeRef.current.height);

      const { x: px, y: py } = pointerRef.current;
      const dotsToCheck = getNearbyDots(px, py, proximity);

      for (const dot of dotsToCheck) {
        const ox = dot.cx + dot.xOffset;
        const oy = dot.cy + dot.yOffset;
        const dx = dot.cx - px;
        const dy = dot.cy - py;
        const dsq = dx * dx + dy * dy;

        let style = baseColor;
        if (dsq <= proxSq) {
          const dist = Math.sqrt(dsq);
          const t = 1 - dist / proximity;
          const r = Math.round(baseRgb.r + (activeRgb.r - baseRgb.r) * t);
          const g = Math.round(baseRgb.g + (activeRgb.g - baseRgb.g) * t);
          const b = Math.round(baseRgb.b + (activeRgb.b - baseRgb.b) * t);
          style = `rgb(${r},${g},${b})`;
        }

        ctx.setTransform(1, 0, 0, 1, ox, oy);
        ctx.fillStyle = style;
        ctx.fill(circlePath);
      }
      
      ctx.fillStyle = baseColor;
      for (const dot of dotsRef.current) {
        const dx = dot.cx - px;
        const dy = dot.cy - py;
        const dsq = dx * dx + dy * dy;
        
        if (dsq <= proxSq) continue;
        
        const ox = dot.cx + dot.xOffset;
        const oy = dot.cy + dot.yOffset;
        
        ctx.setTransform(1, 0, 0, 1, ox, oy);
        ctx.fill(circlePath);
      }
      
      ctx.setTransform(1, 0, 0, 1, 0, 0);

      rafIdRef.current = requestAnimationFrame(draw);
    };

    draw();
    return () => {
      if (rafIdRef.current) {
        cancelAnimationFrame(rafIdRef.current);
      }
    };
  }, [proximity, baseColor, activeRgb, baseRgb, circlePath, isPaused, getNearbyDots]);

  useEffect(() => {
    buildGrid();
    let ro: ResizeObserver | null = null;
    
    if (typeof window !== 'undefined' && 'ResizeObserver' in window) {
      ro = new ResizeObserver(buildGrid);
      if (wrapperRef.current) {
        ro.observe(wrapperRef.current);
      }
    } else if (typeof window !==null&&window!=="undefined") {
      // FIX: Explicitly type window
      const handleResize = buildGrid;
      // window.addEventListener('resize', handleResize);
      
      return () => {
        window.removeEventListener('resize', handleResize);
      };
    }
    
    return () => {
      if (ro) ro.disconnect();
    };
  }, [buildGrid]);

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      if (isPaused) return;

      const now = performance.now();
      const pr = pointerRef.current;
      const dt = pr.lastTime ? now - pr.lastTime : 16;
      const dx = e.clientX - pr.lastX;
      const dy = e.clientY - pr.lastY;
      let vx = (dx / dt) * 1000;
      let vy = (dy / dt) * 1000;
      let speed = Math.hypot(vx, vy);
      
      if (speed > maxSpeed) {
        const scale = maxSpeed / speed;
        vx *= scale;
        vy *= scale;
        speed = maxSpeed;
      }
      
      pr.lastTime = now;
      pr.lastX = e.clientX;
      pr.lastY = e.clientY;
      pr.vx = vx;
      pr.vy = vy;
      pr.speed = speed;

      const canvas = canvasRef.current;
      if (!canvas) return;
      
      const rect = canvas.getBoundingClientRect();
      pr.x = e.clientX - rect.left;
      pr.y = e.clientY - rect.top;

      if (speed > speedTrigger) {
        const nearbyDots = getNearbyDots(pr.x, pr.y, proximity);
        
        for (const dot of nearbyDots) {
          const dist = Math.hypot(dot.cx - pr.x, dot.cy - pr.y);
          if (dist < proximity && !dot._inertiaApplied) {
            dot._inertiaApplied = true;
            gsap.killTweensOf(dot);
            const pushX = dot.cx - pr.x + vx * 0.005;
            const pushY = dot.cy - pr.y + vy * 0.005;
            gsap.to(dot, {
              inertia: { xOffset: pushX, yOffset: pushY, resistance },
              onComplete: () => {
                gsap.to(dot, {
                  xOffset: 0,
                  yOffset: 0,
                  duration: returnDuration,
                  ease: 'elastic.out(1,0.75)'
                });
                dot._inertiaApplied = false;
              }
            });
          }
        }
      }
    };

    const onClick = (e: MouseEvent) => {
      if (isPaused) return;

      const canvas = canvasRef.current;
      if (!canvas) return;

      const rect = canvas.getBoundingClientRect();
      const cx = e.clientX - rect.left;
      const cy = e.clientY - rect.top;
      
      const nearbyDots = getNearbyDots(cx, cy, shockRadius);
      
      for (const dot of nearbyDots) {
        const dist = Math.hypot(dot.cx - cx, dot.cy - cy);
        if (dist < shockRadius && !dot._inertiaApplied) {
          dot._inertiaApplied = true;
          gsap.killTweensOf(dot);
          const falloff = Math.max(0, 1 - dist / shockRadius);
          const pushX = (dot.cx - cx) * shockStrength * falloff;
          const pushY = (dot.cy - cy) * shockStrength * falloff;
          gsap.to(dot, {
            inertia: { xOffset: pushX, yOffset: pushY, resistance },
            onComplete: () => {
              gsap.to(dot, {
                xOffset: 0,
                yOffset: 0,
                duration: returnDuration,
                ease: 'elastic.out(1,0.75)'
              });
              dot._inertiaApplied = false;
            }
          });
        }
      }
    };

    const throttledMove = throttle(onMove, 50);
    window.addEventListener('mousemove', throttledMove, { passive: true });
    window.addEventListener('click', onClick);

    return () => {
      window.removeEventListener('mousemove', throttledMove);
      window.removeEventListener('click', onClick);
    };
  }, [maxSpeed, speedTrigger, proximity, resistance, returnDuration, shockRadius, shockStrength, isPaused, getNearbyDots]);

  useEffect(() => {
    let previewCount = 0;

    const checkPreviews = () => {
      const poppers = document.querySelectorAll('[data-radix-popper-content-wrapper]');
      const newCount = poppers.length;
      
      if (newCount > previewCount) {
        setIsPaused(true);
      } else if (newCount === 0 && previewCount > 0) {
        setIsPaused(false);
      }
      
      previewCount = newCount;
    };

    const observer = new MutationObserver(checkPreviews);
    observer.observe(document.body, {
      childList: true,
      subtree: true
    });

    return () => observer.disconnect();
  }, []);

  return (
    <section className={`p-4 flex items-center justify-center h-full w-full relative ${className}`} style={style}>
      <div ref={wrapperRef} className="w-full h-full relative">
        <canvas ref={canvasRef} className="absolute inset-0 w-full h-full pointer-events-none" />
      </div>
    </section>
  );
};

export default DotGrid;