import { useGameStore } from '@/store/gameStore';

export default function PauseMenu() {
  const setScreen = useGameStore((s) => s.setScreen);
  const save = useGameStore((s) => s.save);

  return (
    <div className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm flex items-center justify-center">
      <div className="panel p-6 w-80 text-center">
        <h2 className="text-3xl font-display font-bold mb-1 text-amber-300">Paused</h2>
        <p className="text-white/50 text-xs mb-5">A trainer&apos;s journey has many stops.</p>
        <div className="flex flex-col gap-2">
          <button className="btn-primary" onClick={() => setScreen('overworld')}>Resume</button>
          <button className="btn-secondary" onClick={() => setScreen('party')}>Companions</button>
          <button className="btn-secondary" onClick={() => setScreen('inventory')}>Bag</button>
          <button className="btn-secondary" onClick={() => setScreen('quests')}>Quests</button>
          <button className="btn-secondary" onClick={() => setScreen('achievements')}>Achievements</button>
          <button className="btn-ghost" onClick={() => setScreen('settings')}>Settings</button>
          <button
            className="btn-ghost"
            onClick={() => {
              save();
            }}
          >
            Save Game
          </button>
          <button className="btn-danger mt-2" onClick={() => setScreen('main-menu')}>
            Quit to Title
          </button>
        </div>
        <div className="mt-4 text-xs text-white/40">Esc to resume</div>
      </div>
    </div>
  );
}
