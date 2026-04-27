import { useGameStore } from '@/store/gameStore';

export default function Toast() {
  const toast = useGameStore((s) => s.toast);
  if (!toast) return null;
  return (
    <div
      key={toast.key}
      className="fixed top-1/3 left-1/2 -translate-x-1/2 z-50 pointer-events-none animate-float"
    >
      <div className="panel px-6 py-3 border-amber-300/40 bg-slate-900/95">
        <span className="font-display text-amber-200 text-lg">{toast.text}</span>
      </div>
    </div>
  );
}
