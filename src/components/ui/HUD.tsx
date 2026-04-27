import { SPECIES } from '@/data/creatures';
import { useGameStore } from '@/store/gameStore';
import { fullStats } from '@/systems/stats';
import MiniMap from './MiniMap';
import TouchControls from './TouchControls';

const RARITY_COLORS: Record<string, string> = {
  common: 'text-white/60',
  uncommon: 'text-emerald-300',
  rare: 'text-sky-300',
  legendary: 'text-amber-300',
};

export default function HUD() {
  const player = useGameStore((s) => s.player);
  const setScreen = useGameStore((s) => s.setScreen);
  const save = useGameStore((s) => s.save);
  const active = player.party[0];
  const activeQuest = player.quests.find((q) => !q.completed);
  const stats = active ? fullStats(active) : null;
  const sp = active ? SPECIES[active.speciesId] : null;

  return (
    <div className="absolute inset-0 pointer-events-none">
      {/* Top-left party indicator */}
      {active && stats && sp && (
        <div className="panel absolute top-3 left-3 p-2 w-56 pointer-events-auto">
          <div className="flex justify-between items-baseline">
            <div className="font-display font-semibold text-sm truncate">
              {sp.name}
              {active.shiny && <span className="text-amber-300 ml-1">✦</span>}
            </div>
            <span className="text-[11px] text-white/60 font-mono">Lv {active.level}</span>
          </div>
          <div className={`text-[10px] uppercase tracking-widest ${RARITY_COLORS[sp.rarity]}`}>{sp.rarity}</div>
          <div className="stat-bar h-1.5 mt-1">
            <div
              className={`hp-bar-fill h-full ${
                active.currentHp / stats.maxHp > 0.5
                  ? 'bg-emerald-400'
                  : active.currentHp / stats.maxHp > 0.2
                  ? 'bg-amber-400'
                  : 'bg-rose-500'
              }`}
              style={{ width: `${(active.currentHp / stats.maxHp) * 100}%` }}
            />
          </div>
          <div className="text-[11px] text-white/60 mt-0.5 font-mono">
            {active.currentHp} / {stats.maxHp} HP
          </div>
        </div>
      )}

      {/* Mini-map and time/weather (top-right) */}
      <MiniMap />

      {/* Active quest hint (left-side, below party) */}
      {activeQuest && (
        <div className="panel absolute top-32 left-3 p-2 w-64 pointer-events-auto">
          <div className="text-[10px] text-amber-300 uppercase tracking-widest">Current Quest</div>
          <div className="font-display font-semibold text-sm">{activeQuest.title}</div>
          <div className="text-[11px] text-white/70 mt-1">
            ◆ {activeQuest.steps.find((s) => !s.done)?.text ?? 'Return for your reward'}
          </div>
        </div>
      )}

      {/* Bottom action buttons */}
      <div className="absolute bottom-3 right-3 flex gap-2 pointer-events-auto">
        <HudBtn label="Party" hotkey="C" onClick={() => setScreen('party')} />
        <HudBtn label="Bag" hotkey="I" onClick={() => setScreen('inventory')} />
        <HudBtn label="Quests" hotkey="Q" onClick={() => setScreen('quests')} />
        <HudBtn label="Save" onClick={save} />
        <HudBtn label="Pause" hotkey="Esc" onClick={() => setScreen('pause')} />
      </div>

      {/* Mobile-only touch controls */}
      <TouchControls />
    </div>
  );
}

function HudBtn({ label, hotkey, onClick }: { label: string; hotkey?: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="px-3 py-1.5 rounded-lg bg-slate-900/70 backdrop-blur border border-white/10 text-sm hover:bg-slate-800/90 hover:-translate-y-0.5 transition-all"
    >
      <span className="font-display font-semibold">{label}</span>
      {hotkey && <span className="ml-1.5 text-white/40 text-[10px]">[{hotkey}]</span>}
    </button>
  );
}
