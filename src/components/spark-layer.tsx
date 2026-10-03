"use client";

import { useEffect, useRef } from "react";

interface Spark {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  max: number;
  size: number;
  warm: boolean;
}

/** Fire a burst of sparks from a screen point. Safe to call from anywhere in the client. */
export function fireSparks(x: number, y: number, power = 1) {
  window.dispatchEvent(new CustomEvent("grind:spark", { detail: { x, y, power } }));
}

export function sparksFromElement(el: Element | null, power = 1) {
  if (!el) return;
  const r = el.getBoundingClientRect();
  fireSparks(r.left + r.width / 2, r.top + r.height / 2, power);
}

/**
 * One full-screen canvas that never takes pointer events. A solve throws a
 * shower of white-hot sparks that arc under gravity and cool from white to
 * blue to nothing. Reduced motion skips the particles entirely.
 */
export function SparkLayer() {
  const canvas = useRef<HTMLCanvasElement>(null);
  const sparks = useRef<Spark[]>([]);
  const frame = useRef<number | null>(null);

  useEffect(() => {
    const el = canvas.current;
    if (!el) return;
    const ctx = el.getContext("2d");
    if (!ctx) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      el.width = window.innerWidth * dpr;
      el.height = window.innerHeight * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    window.addEventListener("resize", resize);

    let last = performance.now();
    const loop = (now: number) => {
      const dt = Math.min(0.032, (now - last) / 1000);
      last = now;
      ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);
      ctx.globalCompositeOperation = "lighter";
      const live: Spark[] = [];
      for (const s of sparks.current) {
        s.life -= dt;
        if (s.life <= 0) continue;
        s.vy += 900 * dt; // gravity
        s.vx *= 0.985;
        const px = s.x;
        const py = s.y;
        s.x += s.vx * dt;
        s.y += s.vy * dt;
        const t = s.life / s.max; // 1 -> 0
        const color = s.warm
          ? `rgba(255, ${Math.round(150 + 80 * t)}, ${Math.round(70 + 120 * t)}, ${t})`
          : `rgba(${Math.round(120 + 120 * t)}, ${Math.round(200 + 50 * t)}, 255, ${t})`;
        ctx.strokeStyle = color;
        ctx.lineWidth = s.size * (0.4 + 0.6 * t);
        ctx.lineCap = "round";
        ctx.beginPath();
        ctx.moveTo(px, py);
        ctx.lineTo(s.x, s.y);
        ctx.stroke();
        live.push(s);
      }
      sparks.current = live;
      frame.current = live.length ? requestAnimationFrame(loop) : null;
    };

    const onSpark = (e: Event) => {
      if (reduced) return;
      const { x, y, power } = (e as CustomEvent<{ x: number; y: number; power: number }>).detail;
      const n = Math.round(26 * power);
      for (let i = 0; i < n; i++) {
        const angle = -Math.PI / 2 + (Math.random() - 0.5) * Math.PI * (0.9 + 0.5 * power);
        const speed = (160 + Math.random() * 420) * (0.8 + 0.4 * power);
        const max = 0.5 + Math.random() * 0.7;
        sparks.current.push({
          x,
          y,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          life: max,
          max,
          size: 1.4 + Math.random() * 1.8,
          warm: Math.random() < 0.28,
        });
      }
      if (frame.current === null) {
        last = performance.now();
        frame.current = requestAnimationFrame(loop);
      }
    };
    window.addEventListener("grind:spark", onSpark);
    return () => {
      window.removeEventListener("grind:spark", onSpark);
      window.removeEventListener("resize", resize);
      if (frame.current) cancelAnimationFrame(frame.current);
    };
  }, []);

  return <canvas ref={canvas} aria-hidden className="pointer-events-none fixed inset-0 z-50 h-full w-full" />;
}
