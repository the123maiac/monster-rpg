import { useEffect } from 'react';
import { TUTORIAL_STEPS, useTutorial } from '@/systems/tutorial';
import { useGameStore } from '@/store/gameStore';

const ANCHOR_POS: Record<string, string> = {
  center: 'top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2',
  'top-left': 'top-44 left-3',
  'top-right': 'top-3 right-3',
  'bottom-left': 'bottom-24 left-3',
  'bottom-right': 'bottom-20 right-3',
};

export default function Tutorial() {
  const active = useTutorial((s) => s.active);
  const stepIdx = useTutorial((s) => s.stepIdx);
  const next = useTutorial((s) => s.next);
  const skip = useTutorial((s) => s.skip);
  const screen = useGameStore((s) => s.screen);

  useEffect(() => {
    if (!active) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.code === 'KeyT') {
        e.preventDefault();
        skip();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [active, skip]);

  if (!active) return null;
  const step = TUTORIAL_STEPS[stepIdx];
  if (!step) return null;

  // Hide if step belongs to a different screen than current
  const allowed = !step.showOn || step.showOn === 'any' || step.showOn === screen;
  if (!allowed) return null;

  const anchorClass = ANCHOR_POS[step.anchor ?? 'center'];
  const isCenter = step.anchor === 'center';

  return (
    <div className="fixed inset-0 z-50 pointer-events-none">
      {isCenter && <div className="absolute inset-0 bg-black/40 backdrop-blur-sm pointer-events-auto" />}
      <div className={`absolute ${anchorClass} pointer-events-auto`}>
        <div className="panel border-amber-300/60 bg-slate-900/95 max-w-sm p-4 relative">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] uppercase tracking-widest text-amber-300">
              Tutorial · Step {stepIdx + 1} / {TUTORIAL_STEPS.length}
            </span>
          </div>
          <h3 className="font-display font-bold text-amber-200 text-lg leading-tight">{step.title}</h3>
          <p className="text-white/85 text-sm mt-1.5 leading-relaxed">{step.body}</p>
          <div className="flex items-center justify-between mt-3">
            <button onClick={skip} className="text-xs text-white/40 hover:text-white/70">
              Skip tutorial
            </button>
            <button onClick={next} className="btn-primary text-sm py-1.5 px-3">
              {stepIdx === TUTORIAL_STEPS.length - 1 ? 'Begin!' : 'Got it ▶'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
