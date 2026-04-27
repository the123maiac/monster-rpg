import { useGameStore } from '@/store/gameStore';
import { sfx } from '@/systems/sound';

export default function QuestLog() {
  const quests = useGameStore((s) => s.player.quests);
  const setScreen = useGameStore((s) => s.setScreen);
  const generateNewQuest = useGameStore((s) => s.generateNewQuest);

  const active = quests.filter((q) => !q.completed);
  const done = quests.filter((q) => q.completed);

  return (
    <div className="menu-bg w-full h-full flex flex-col p-4">
      <div className="flex justify-between items-center mb-3">
        <h2 className="text-2xl font-display font-bold">Quest Log</h2>
        <div className="flex gap-2">
          <button
            className="btn-secondary text-sm"
            onClick={() => {
              sfx.click();
              generateNewQuest();
            }}
          >
            + Take Quest from Board
          </button>
          <button className="btn-ghost text-sm" onClick={() => setScreen('overworld')}>
            ← Back
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto flex flex-col gap-3">
        <Section title="Active" items={active} />
        <Section title="Completed" items={done} muted />
        {quests.length === 0 && (
          <div className="panel p-6 text-center text-white/60">
            No quests yet. Click <span className="text-amber-300">+ Take Quest from Board</span> to receive one.
          </div>
        )}
      </div>
    </div>
  );
}

function Section({ title, items, muted }: { title: string; items: ReturnType<typeof useGameStore.getState>['player']['quests']; muted?: boolean }) {
  if (items.length === 0) return null;
  return (
    <div>
      <div className="text-xs uppercase tracking-widest text-white/50 mb-1 px-1">{title}</div>
      <div className="flex flex-col gap-2">
        {items.map((q) => (
          <div key={q.id} className={`panel p-4 ${muted ? 'opacity-60' : ''}`}>
            <div className="flex justify-between">
              <h3 className="font-display font-bold">{q.title}</h3>
              {q.completed && <span className="text-emerald-400 text-sm">✓ Complete</span>}
            </div>
            <p className="text-white/70 text-sm mt-1">{q.description}</p>
            <ul className="mt-2 space-y-0.5 text-sm">
              {q.steps.map((s) => (
                <li key={s.id} className={s.done ? 'text-emerald-300' : 'text-white/80'}>
                  {s.done ? '✓' : '○'} {s.text}
                </li>
              ))}
            </ul>
            {q.reward && <div className="mt-2 text-xs text-amber-300">Reward: {q.reward}</div>}
          </div>
        ))}
      </div>
    </div>
  );
}
