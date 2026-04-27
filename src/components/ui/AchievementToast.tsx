import { useAchievements } from '@/systems/achievements';

export default function AchievementToast() {
  const pending = useAchievements((s) => s.pending);
  if (!pending) return null;
  return (
    <div
      key={pending.key}
      className="fixed top-20 left-1/2 -translate-x-1/2 z-50 pointer-events-none animate-float"
    >
      <div className="panel px-5 py-3 border-amber-300/60 bg-slate-900/95 flex items-center gap-3 shadow-2xl shadow-amber-500/20">
        <div className="text-3xl">{pending.ach.icon}</div>
        <div>
          <div className="text-[10px] uppercase tracking-widest text-amber-300">Achievement Unlocked</div>
          <div className="font-display font-bold text-white text-lg leading-tight">{pending.ach.name}</div>
          <div className="text-white/70 text-sm">{pending.ach.description}</div>
        </div>
      </div>
    </div>
  );
}
