import { ACHIEVEMENTS, useAchievements } from '@/systems/achievements';
import { useGameStore } from '@/store/gameStore';

export default function Achievements() {
  const unlocked = useAchievements((s) => s.unlocked);
  const setScreen = useGameStore((s) => s.setScreen);
  const prevScreen = useGameStore((s) => s.prevScreen);

  const earned = unlocked.length;
  const total = ACHIEVEMENTS.length;
  const pct = (earned / total) * 100;

  return (
    <div className="menu-bg w-full h-full flex flex-col p-4">
      <div className="flex justify-between items-center mb-3">
        <h2 className="text-2xl font-display font-bold">Achievements</h2>
        <button className="btn-ghost text-sm" onClick={() => setScreen(prevScreen === 'achievements' ? 'main-menu' : prevScreen)}>← Back</button>
      </div>

      <div className="panel p-3 mb-3 max-w-2xl mx-auto w-full">
        <div className="flex justify-between text-sm mb-1">
          <span className="font-display">Progress</span>
          <span className="font-mono text-amber-300">{earned} / {total}</span>
        </div>
        <div className="stat-bar">
          <div className="hp-bar-fill h-full bg-amber-400" style={{ width: `${pct}%` }} />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-w-2xl mx-auto w-full overflow-y-auto">
        {ACHIEVEMENTS.map((a) => {
          const has = unlocked.includes(a.id);
          if (!has && a.hidden) {
            return (
              <div key={a.id} className="panel p-3 flex items-center gap-3 opacity-50">
                <div className="text-2xl">❔</div>
                <div>
                  <div className="font-display font-semibold">Hidden Achievement</div>
                  <div className="text-white/50 text-xs">Discover this on your own.</div>
                </div>
              </div>
            );
          }
          return (
            <div
              key={a.id}
              className={`panel p-3 flex items-center gap-3 ${has ? 'border-amber-300/40' : 'opacity-60'}`}
            >
              <div className="text-3xl flex-shrink-0">{a.icon}</div>
              <div>
                <div className={`font-display font-semibold ${has ? 'text-amber-200' : 'text-white/80'}`}>
                  {a.name}
                </div>
                <div className="text-white/60 text-xs">{a.description}</div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
