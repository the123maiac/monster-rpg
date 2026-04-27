import { useState } from 'react';
import { SPECIES, STARTER_IDS } from '@/data/creatures';
import { useGameStore } from '@/store/gameStore';
import StarterPreview from '@/components/game/StarterPreview';

const STARTER_BLURBS: Record<string, string> = {
  emberkit: 'A bold and excitable kit with a fiery temperament. Quick on its feet and eager to play.',
  aquabun: 'A calm, watery companion. Loyal and steady — its shell defends those it loves.',
  mossprout: 'A patient sapling-spirit. Wise beyond its years; channels the forest\'s gentle strength.',
};

const ELEMENT_COLOR: Record<string, string> = {
  Flame: 'from-flame to-rose-500',
  Aqua: 'from-aqua to-blue-500',
  Leaf: 'from-leaf to-emerald-500',
};

export default function StarterSelection() {
  const pickStarter = useGameStore((s) => s.pickStarter);
  const [selected, setSelected] = useState<string>(STARTER_IDS[1]);
  const sp = SPECIES[selected];

  return (
    <div className="menu-bg w-full h-full p-6 flex flex-col items-center text-white">
      <div className="text-center mb-2">
        <h2 className="text-3xl md:text-4xl font-display font-bold title-glow text-amber-200">
          Choose your first Companion
        </h2>
        <p className="text-white/70 mt-1 text-sm">A friend is for life. Pick the one whose spirit speaks to yours.</p>
      </div>

      {/* 3D preview */}
      <div className="w-full max-w-2xl h-64 md:h-80 mt-3 panel overflow-hidden">
        <StarterPreview speciesId={selected} />
      </div>

      {/* Starter cards */}
      <div className="grid grid-cols-3 gap-3 w-full max-w-3xl mt-4">
        {STARTER_IDS.map((id) => {
          const s = SPECIES[id];
          const isSel = id === selected;
          return (
            <button
              key={id}
              onClick={() => setSelected(id)}
              className={`panel p-3 transition-all duration-150 text-left ${
                isSel ? 'ring-4 ring-amber-300 -translate-y-1' : 'hover:-translate-y-0.5 hover:bg-slate-800/80'
              }`}
            >
              <div className={`bg-gradient-to-br ${ELEMENT_COLOR[s.element] ?? 'from-slate-600 to-slate-800'} rounded-xl p-3`}>
                <div className="text-xs uppercase font-bold opacity-80">{s.element}</div>
                <div className="text-2xl font-display font-bold">{s.name}</div>
              </div>
              <div className="grid grid-cols-2 gap-1 mt-2 text-xs">
                <Stat label="HP" v={s.baseStats.hp} />
                <Stat label="ATK" v={s.baseStats.attack} />
                <Stat label="DEF" v={s.baseStats.defense} />
                <Stat label="SPD" v={s.baseStats.speed} />
              </div>
            </button>
          );
        })}
      </div>

      {/* Description + confirm */}
      <div className="panel mt-4 max-w-3xl w-full p-4">
        <div className="flex items-baseline justify-between">
          <div>
            <div className="text-xs text-white/60 uppercase tracking-widest">{sp.element}</div>
            <h3 className="text-2xl font-display font-bold">{sp.name}</h3>
          </div>
          <button className="btn-primary" onClick={() => pickStarter(selected)}>
            Choose {sp.name}
          </button>
        </div>
        <p className="text-white/80 mt-2 text-sm leading-relaxed">{STARTER_BLURBS[selected]}</p>
      </div>
    </div>
  );
}

function Stat({ label, v }: { label: string; v: number }) {
  return (
    <div className="flex justify-between bg-slate-800/60 rounded px-2 py-0.5">
      <span className="text-white/60">{label}</span>
      <span className="font-mono">{v}</span>
    </div>
  );
}
