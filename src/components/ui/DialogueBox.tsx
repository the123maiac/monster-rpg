import { useEffect, useState } from 'react';
import { useGameStore } from '@/store/gameStore';

export default function DialogueBox() {
  const dialogue = useGameStore((s) => s.dialogue);
  const advance = useGameStore((s) => s.advanceDialogue);
  const speed = useGameStore((s) => s.settings.textSpeed);
  const [shown, setShown] = useState('');

  useEffect(() => {
    if (!dialogue.active) return;
    const full = dialogue.lines[dialogue.index] ?? '';
    setShown('');
    const interval = speed === 'slow' ? 36 : speed === 'fast' ? 12 : 22;
    let i = 0;
    const id = setInterval(() => {
      i += 1;
      setShown(full.slice(0, i));
      if (i >= full.length) clearInterval(id);
    }, interval);
    return () => clearInterval(id);
  }, [dialogue.active, dialogue.index, dialogue.lines, speed]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (!dialogue.active) return;
      if (e.code === 'Space' || e.code === 'Enter' || e.code === 'KeyE') {
        e.preventDefault();
        const full = dialogue.lines[dialogue.index] ?? '';
        if (shown.length < full.length) {
          setShown(full);
        } else {
          advance();
        }
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [dialogue, advance, shown]);

  if (!dialogue.active) return null;
  const full = dialogue.lines[dialogue.index] ?? '';
  const done = shown.length >= full.length;

  return (
    <div className="absolute inset-x-0 bottom-0 z-30 p-4 pointer-events-none">
      <div className="panel mx-auto max-w-3xl pointer-events-auto p-4 border-amber-300/40">
        <div className="text-amber-300 font-display font-bold text-lg mb-1">{dialogue.speakerName}</div>
        <p className="text-white/95 leading-relaxed dialogue-text min-h-[3rem]">{shown}</p>
        <div className="flex justify-between mt-2">
          <span className="text-xs text-white/40">
            {dialogue.index + 1}/{dialogue.lines.length}
          </span>
          <button
            className="text-amber-200 text-sm hover:text-amber-100"
            onClick={() => {
              if (!done) setShown(full);
              else advance();
            }}
          >
            {done ? '▼ Continue' : 'Skip ▶'}
          </button>
        </div>
      </div>
    </div>
  );
}
