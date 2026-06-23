"use client";

import { useEffect, useRef } from "react";
import { particleCount, lineAlpha } from "@/lib/particles";
import { useReducedMotionSafe } from "@/lib/useReducedMotionSafe";
import { usePointerFine } from "@/lib/usePointerFine";

type Pt = { x: number; y: number; vx: number; vy: number };

const MAX_DIST = 130;       // link distance (CSS px)
const CURSOR_DIST = 170;    // link-to-cursor distance

/**
 * Interactive particle-network background drawn on a <canvas>. Points drift and
 * link to nearby points and to the cursor. One rAF loop; paused off-screen and
 * on tab blur; particle count capped to viewport. Disabled under reduced motion
 * and on coarse/touch pointers (renders nothing).
 */
export default function ParticleNetwork({ tone = "cool" }: { tone?: "cool" | "warm" }) {
  const reduce = useReducedMotionSafe();
  const fine = usePointerFine();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const enabled = !reduce; // motion gate; cursor-linking additionally needs `fine`

  useEffect(() => {
    if (!enabled) return;
    const canvas = canvasRef.current;
    const parent = canvas?.parentElement;
    if (!canvas || !parent) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const rgb = tone === "warm" ? "225, 27, 34" : "37, 99, 235"; // --red / --blue
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    let w = 0, h = 0;
    let pts: Pt[] = [];
    let raf = 0;
    let running = false;
    const cursor = { x: -9999, y: -9999, on: false };

    const resize = () => {
      w = parent.clientWidth;
      h = parent.clientHeight;
      canvas.width = Math.floor(w * dpr);
      canvas.height = Math.floor(h * dpr);
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const n = particleCount(w, h);
      pts = Array.from({ length: n }, () => ({
        x: Math.random() * w,
        y: Math.random() * h,
        vx: (Math.random() - 0.5) * 0.3,
        vy: (Math.random() - 0.5) * 0.3,
      }));
    };

    const step = () => {
      ctx.clearRect(0, 0, w, h);
      for (const p of pts) {
        p.x += p.vx; p.y += p.vy;
        if (p.x < 0 || p.x > w) p.vx *= -1;
        if (p.y < 0 || p.y > h) p.vy *= -1;
      }
      for (let i = 0; i < pts.length; i++) {
        const a = pts[i];
        for (let j = i + 1; j < pts.length; j++) {
          const b = pts[j];
          const d = Math.hypot(a.x - b.x, a.y - b.y);
          const al = lineAlpha(d, MAX_DIST);
          if (al > 0) {
            ctx.strokeStyle = `rgba(${rgb}, ${al * 0.28})`;
            ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
          }
        }
        if (cursor.on) {
          const dc = Math.hypot(a.x - cursor.x, a.y - cursor.y);
          const alc = lineAlpha(dc, CURSOR_DIST);
          if (alc > 0) {
            ctx.strokeStyle = `rgba(${rgb}, ${alc * 0.5})`;
            ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(cursor.x, cursor.y); ctx.stroke();
          }
        }
        ctx.fillStyle = `rgba(${rgb}, 0.55)`;
        ctx.beginPath(); ctx.arc(a.x, a.y, 1.6, 0, Math.PI * 2); ctx.fill();
      }
      raf = requestAnimationFrame(step);
    };

    const start = () => { if (!running) { running = true; raf = requestAnimationFrame(step); } };
    const stop = () => { running = false; cancelAnimationFrame(raf); };

    const onMove = (e: PointerEvent) => {
      if (!fine || e.pointerType !== "mouse") return;
      const r = canvas.getBoundingClientRect();
      cursor.x = e.clientX - r.left;
      cursor.y = e.clientY - r.top;
      cursor.on = cursor.x >= 0 && cursor.y >= 0 && cursor.x <= w && cursor.y <= h;
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(parent);
    const io = new IntersectionObserver(
      ([entry]) => (entry.isIntersecting ? start() : stop()),
      { threshold: 0 }
    );
    io.observe(parent);
    const onBlur = () => stop();
    const onFocus = () => { if (!document.hidden) start(); };
    window.addEventListener("pointermove", onMove, { passive: true });
    window.addEventListener("blur", onBlur);
    window.addEventListener("focus", onFocus);

    return () => {
      stop();
      ro.disconnect();
      io.disconnect();
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("blur", onBlur);
      window.removeEventListener("focus", onFocus);
    };
  }, [enabled, fine, tone]);

  if (!enabled) return null;
  return <canvas ref={canvasRef} aria-hidden className="pointer-events-none absolute inset-0 -z-10 h-full w-full" />;
}
