import { useEffect, useRef, useState } from 'react';
import { registerKey, releaseKey } from '@/systems/input';

function isTouchDevice() {
  if (typeof window === 'undefined') return false;
  return 'ontouchstart' in window || navigator.maxTouchPoints > 0;
}

export default function TouchControls() {
  const [touch] = useState(() => isTouchDevice());
  const stickRef = useRef<HTMLDivElement>(null);
  const knobRef = useRef<HTMLDivElement>(null);
  const activeId = useRef<number | null>(null);
  const lastDir = useRef<{ up: boolean; down: boolean; left: boolean; right: boolean }>({ up: false, down: false, left: false, right: false });

  useEffect(() => {
    if (!touch) return;
    const stick = stickRef.current;
    const knob = knobRef.current;
    if (!stick || !knob) return;

    const onStart = (e: TouchEvent) => {
      const t = e.changedTouches[0];
      activeId.current = t.identifier;
      update(t.clientX, t.clientY);
      e.preventDefault();
    };
    const onMove = (e: TouchEvent) => {
      for (const t of Array.from(e.changedTouches)) {
        if (t.identifier === activeId.current) {
          update(t.clientX, t.clientY);
          e.preventDefault();
        }
      }
    };
    const onEnd = (e: TouchEvent) => {
      for (const t of Array.from(e.changedTouches)) {
        if (t.identifier === activeId.current) {
          activeId.current = null;
          knob.style.transform = 'translate(0, 0)';
          for (const k of ['up', 'down', 'left', 'right'] as const) {
            if (lastDir.current[k]) {
              releaseKey(k, 'touch');
              lastDir.current[k] = false;
            }
          }
        }
      }
    };
    const update = (cx: number, cy: number) => {
      const r = stick.getBoundingClientRect();
      const dx = cx - (r.left + r.width / 2);
      const dy = cy - (r.top + r.height / 2);
      const max = r.width / 2;
      const len = Math.hypot(dx, dy);
      const cdx = len > max ? (dx / len) * max : dx;
      const cdy = len > max ? (dy / len) * max : dy;
      knob.style.transform = `translate(${cdx}px, ${cdy}px)`;
      const t = 0.35 * max;
      const newDir = { up: dy < -t, down: dy > t, left: dx < -t, right: dx > t };
      for (const k of ['up', 'down', 'left', 'right'] as const) {
        if (newDir[k] && !lastDir.current[k]) registerKey(k, 'touch');
        if (!newDir[k] && lastDir.current[k]) releaseKey(k, 'touch');
        lastDir.current[k] = newDir[k];
      }
    };

    stick.addEventListener('touchstart', onStart, { passive: false });
    stick.addEventListener('touchmove', onMove, { passive: false });
    stick.addEventListener('touchend', onEnd);
    stick.addEventListener('touchcancel', onEnd);
    return () => {
      stick.removeEventListener('touchstart', onStart);
      stick.removeEventListener('touchmove', onMove);
      stick.removeEventListener('touchend', onEnd);
      stick.removeEventListener('touchcancel', onEnd);
    };
  }, [touch]);

  if (!touch) return null;

  const tap = (key: 'interact' | 'menu') => ({
    onTouchStart: (e: React.TouchEvent) => {
      registerKey(key, 'touch-tap');
      e.preventDefault();
    },
    onTouchEnd: () => releaseKey(key, 'touch-tap'),
    onTouchCancel: () => releaseKey(key, 'touch-tap'),
  });

  return (
    <>
      {/* Joystick */}
      <div
        ref={stickRef}
        className="fixed bottom-6 left-6 z-40 pointer-events-auto select-none touch-none"
        style={{ width: 130, height: 130 }}
      >
        <div className="absolute inset-0 rounded-full bg-slate-900/40 border-2 border-white/20 backdrop-blur" />
        <div
          ref={knobRef}
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-14 h-14 rounded-full bg-amber-300/80 border-2 border-amber-200 shadow-lg pointer-events-none"
          style={{ transform: 'translate(0,0)' }}
        />
      </div>

      {/* Action buttons */}
      <div className="fixed bottom-8 right-6 z-40 flex flex-col items-center gap-3 pointer-events-auto select-none touch-none">
        <button
          {...tap('interact')}
          className="w-16 h-16 rounded-full bg-amber-300/90 border-2 border-amber-200 text-slate-900 font-display font-bold shadow-lg active:scale-95"
        >
          A
        </button>
        <button
          {...tap('menu')}
          className="w-12 h-12 rounded-full bg-slate-700/80 border-2 border-white/20 text-white text-xs font-display font-bold shadow-lg active:scale-95"
        >
          MENU
        </button>
      </div>
    </>
  );
}
