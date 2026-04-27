import { useState } from 'react';
import { SPECIES } from '@/data/creatures';
import { useGameStore } from '@/store/gameStore';
import { fullStats, maxHpFor, xpForNextLevel } from '@/systems/stats';
import { MOVES } from '@/data/moves';
import { ITEMS } from '@/data/items';

const ELEMENT_COLORS: Record<string, string> = {
  Flame: 'bg-flame', Aqua: 'bg-aqua', Leaf: 'bg-leaf', Stone: 'bg-stone',
  Spark: 'bg-spark text-slate-900', Shadow: 'bg-shadow', Light: 'bg-light text-slate-900', Wind: 'bg-wind text-slate-900',
};

export default function PartyMenu() {
  const player = useGameStore((s) => s.player);
  const setScreen = useGameStore((s) => s.setScreen);
  const selectActive = useGameStore((s) => s.selectActive);
  const useItemOn = useGameStore((s) => s.useItemOn);
  const [selectedUid, setSelectedUid] = useState<string | null>(player.party[0]?.uid ?? null);
  const [itemMode, setItemMode] = useState<string | null>(null);

  const selected = player.party.find((p) => p.uid === selectedUid) ?? player.party[0];

  return (
    <div className="menu-bg w-full h-full flex flex-col p-4">
      <div className="flex justify-between items-center mb-3">
        <h2 className="text-2xl font-display font-bold">Your Companions</h2>
        <div className="flex gap-2">
          <button className="btn-ghost text-sm" onClick={() => setScreen('overworld')}>← Back</button>
        </div>
      </div>

      {player.party.length === 0 ? (
        <div className="flex-1 flex items-center justify-center text-white/50">
          You have no Companions yet.
        </div>
      ) : (
        <div className="grid grid-cols-12 gap-3 flex-1 min-h-0">
          {/* Party list */}
          <div className="col-span-4 panel p-2 overflow-y-auto">
            <div className="space-y-1.5">
              {player.party.map((c, i) => {
                const sp = SPECIES[c.speciesId];
                const stats = fullStats(c);
                const hpRatio = c.currentHp / stats.maxHp;
                const isSel = c.uid === selectedUid;
                return (
                  <button
                    key={c.uid}
                    onClick={() => setSelectedUid(c.uid)}
                    className={`w-full text-left p-2 rounded-lg border transition-all ${
                      isSel ? 'bg-amber-300/15 border-amber-300/60' : 'bg-slate-800/60 border-white/10 hover:bg-slate-700/70'
                    }`}
                  >
                    <div className="flex justify-between items-baseline">
                      <span className="font-display font-semibold">
                        {i === 0 && <span className="text-amber-300 text-xs mr-1">★</span>}
                        {sp.name}{c.shiny && <span className="text-amber-300"> ✦</span>}
                      </span>
                      <span className="text-xs text-white/60 font-mono">Lv {c.level}</span>
                    </div>
                    <div className="flex gap-1 my-1">
                      <span className={`text-[10px] uppercase tracking-wider px-1.5 py-0.5 rounded ${ELEMENT_COLORS[sp.element] ?? 'bg-slate-600'} text-white`}>
                        {sp.element}
                      </span>
                    </div>
                    <div className="stat-bar h-1.5">
                      <div className={`hp-bar-fill h-full ${hpRatio > 0.5 ? 'bg-emerald-400' : hpRatio > 0.2 ? 'bg-amber-400' : 'bg-rose-500'}`} style={{ width: `${hpRatio * 100}%` }} />
                    </div>
                    <div className="text-[11px] text-white/60 mt-1">
                      {c.currentHp <= 0 ? 'Fainted' : `${c.currentHp} / ${stats.maxHp} HP`}
                    </div>
                  </button>
                );
              })}
            </div>
            {player.storage.length > 0 && (
              <div className="border-t border-white/10 mt-3 pt-2">
                <div className="text-xs text-white/50 uppercase tracking-wider mb-1 px-1">Storage ({player.storage.length})</div>
                {player.storage.slice(0, 6).map((c) => {
                  const sp = SPECIES[c.speciesId];
                  return (
                    <div key={c.uid} className="text-sm py-0.5 px-2 text-white/70 flex justify-between">
                      <span>{sp.name}{c.shiny && <span className="text-amber-300"> ✦</span>}</span>
                      <span className="font-mono text-xs">Lv {c.level}</span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Detail panel */}
          {selected && (
            <div className="col-span-8 panel p-4 flex flex-col gap-3 min-h-0 overflow-y-auto">
              <CreatureDetailContent inst={selected} />
              <div className="flex gap-2 mt-2 flex-wrap">
                {player.party.indexOf(selected) > 0 && (
                  <button className="btn-secondary" onClick={() => selectActive(selected.uid)}>
                    Set as Active
                  </button>
                )}
                <button className="btn-ghost" onClick={() => setItemMode('use')}>
                  Use Item
                </button>
              </div>
              {itemMode === 'use' && (
                <div className="panel p-3 mt-1">
                  <div className="text-sm font-display font-semibold mb-2">Use which item?</div>
                  <div className="grid grid-cols-2 gap-2">
                    {player.inventory
                      .filter((s) => {
                        const it = ITEMS[s.itemId];
                        return it && (it.category === 'healing' || it.category === 'energy');
                      })
                      .map((stack) => (
                        <button
                          key={stack.itemId}
                          className="text-left p-2 rounded-lg bg-slate-800/70 hover:bg-slate-700 border border-white/10"
                          onClick={() => {
                            useItemOn(stack.itemId, selected.uid);
                            setItemMode(null);
                          }}
                        >
                          <div className="flex justify-between">
                            <span className="font-display font-semibold">{ITEMS[stack.itemId].name}</span>
                            <span className="text-amber-300 font-mono text-sm">×{stack.count}</span>
                          </div>
                          <div className="text-xs text-white/60">{ITEMS[stack.itemId].description}</div>
                        </button>
                      ))}
                  </div>
                  <button className="btn-ghost text-sm mt-2" onClick={() => setItemMode(null)}>Cancel</button>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export function CreatureDetailContent({ inst }: { inst: ReturnType<typeof useGameStore.getState>['player']['party'][number] }) {
  const sp = SPECIES[inst.speciesId];
  const stats = fullStats(inst);
  const xpNext = xpForNextLevel(inst.level + 1);

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-baseline justify-between flex-wrap gap-2">
        <div>
          <div className="text-xs text-white/50 uppercase tracking-wider">{sp.element}{sp.secondaryElement ? ` / ${sp.secondaryElement}` : ''}</div>
          <h3 className="text-3xl font-display font-bold">
            {sp.name}
            {inst.shiny && <span className="text-amber-300 ml-2">✦</span>}
          </h3>
        </div>
        <div className="text-right text-sm">
          <div>Level <span className="font-mono text-amber-300 text-lg">{inst.level}</span></div>
          <div className="text-white/60">XP {inst.xp} / {xpNext}</div>
        </div>
      </div>
      <p className="text-white/80 text-sm italic">{sp.description}</p>

      <div className="grid grid-cols-2 gap-x-4 gap-y-2">
        <StatRow label="HP" v={`${inst.currentHp} / ${stats.maxHp}`} />
        <StatRow label="Attack" v={stats.attack} />
        <StatRow label="Defense" v={stats.defense} />
        <StatRow label="Speed" v={stats.speed} />
      </div>

      <div>
        <div className="text-sm uppercase tracking-widest text-white/50 mb-1">Moves</div>
        <div className="grid grid-cols-2 gap-2">
          {inst.moves.map((mid) => {
            const m = MOVES[mid];
            if (!m) return null;
            return (
              <div key={mid} className="p-2 rounded-lg bg-slate-800/60 border border-white/10">
                <div className="flex justify-between items-baseline">
                  <span className="font-display font-semibold">{m.name}</span>
                  <span className="text-[10px] uppercase tracking-wider px-1.5 py-0.5 rounded bg-slate-700">{m.element}</span>
                </div>
                <div className="text-xs text-white/60">Power {m.power || '—'} • Acc {m.accuracy}%</div>
                <div className="text-[11px] text-white/50 italic">{m.description}</div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function StatRow({ label, v }: { label: string; v: number | string }) {
  return (
    <div className="flex justify-between bg-slate-800/40 rounded px-3 py-1.5 border border-white/5">
      <span className="text-white/60 text-sm">{label}</span>
      <span className="font-mono text-amber-200">{v}</span>
    </div>
  );
}
