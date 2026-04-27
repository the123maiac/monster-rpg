import { useEffect, useRef, useState } from 'react';
import BattleArena from '@/components/battle/BattleArena';
import { SPECIES } from '@/data/creatures';
import { ITEMS } from '@/data/items';
import { MOVES } from '@/data/moves';
import { useGameStore } from '@/store/gameStore';

const ELEMENT_COLORS: Record<string, string> = {
  Flame: 'bg-flame text-white',
  Aqua: 'bg-aqua text-white',
  Leaf: 'bg-leaf text-white',
  Stone: 'bg-stone text-white',
  Spark: 'bg-spark text-slate-900',
  Shadow: 'bg-shadow text-white',
  Light: 'bg-light text-slate-900',
  Wind: 'bg-wind text-slate-900',
};

function HpBar({ ratio, big }: { ratio: number; big?: boolean }) {
  const pct = Math.max(0, Math.min(100, ratio * 100));
  const color = pct > 50 ? 'bg-emerald-400' : pct > 20 ? 'bg-amber-400' : 'bg-rose-500';
  return (
    <div className={`stat-bar ${big ? 'h-3' : 'h-2'} bg-slate-900/80 border border-white/10`}>
      <div className={`hp-bar-fill h-full ${color}`} style={{ width: `${pct}%` }} />
    </div>
  );
}

export default function BattleScreen() {
  const battle = useGameStore((s) => s.battle);
  const advance = useGameStore((s) => s.battleAdvance);
  const pickMove = useGameStore((s) => s.battlePickMove);
  const useItem = useGameStore((s) => s.battleUseItem);
  const swapTo = useGameStore((s) => s.battleSwitch);
  const run = useGameStore((s) => s.battleRun);
  const player = useGameStore((s) => s.player);
  const setBattlePhase = useGameStore.setState;

  const [subMenu, setSubMenu] = useState<'main' | 'moves' | 'items' | 'switch'>('main');
  const logRef = useRef<HTMLDivElement>(null);

  // Sync sub-menu with phase changes
  useEffect(() => {
    if (!battle) return;
    if (battle.phase === 'select-action') setSubMenu('main');
    if (battle.phase === 'select-switch') setSubMenu('switch');
  }, [battle?.phase]);

  useEffect(() => {
    if (logRef.current) logRef.current.scrollTop = logRef.current.scrollHeight;
  }, [battle?.log.length]);

  if (!battle) return null;

  const playerSp = SPECIES[battle.player.speciesId];
  const enemySp = SPECIES[battle.enemy.speciesId];
  const showActions = battle.phase === 'select-action';
  const continueable =
    battle.awaitingContinue &&
    (battle.phase === 'intro' ||
      battle.phase === 'victory' ||
      battle.phase === 'fled' ||
      battle.phase === 'captured' ||
      battle.phase === 'defeat');

  return (
    <div className="w-full h-full relative">
      {/* 3D Arena */}
      <div className={`absolute inset-0 ${battle.shake ? 'animate-shake' : ''}`}>
        <BattleArena />
      </div>

      {/* Enemy HP bar (top-left) */}
      <div className="absolute top-4 left-4 panel p-3 w-72 z-10 border-rose-400/30">
        <div className="flex justify-between items-baseline">
          <div>
            <span className="font-display font-bold text-lg">{enemySp.name}</span>
            {battle.enemy.shiny && <span className="text-amber-300 ml-1">✦</span>}
            <span className={`ml-2 text-[10px] uppercase tracking-widest ${
              enemySp.rarity === 'legendary' ? 'text-amber-300' :
              enemySp.rarity === 'rare' ? 'text-sky-300' :
              enemySp.rarity === 'uncommon' ? 'text-emerald-300' : 'text-white/40'
            }`}>{enemySp.rarity}</span>
          </div>
          <span className="text-xs text-white/70">Lv {battle.enemy.level}</span>
        </div>
        <div className="flex gap-1 mb-1 mt-1">
          <span className={`text-[10px] uppercase tracking-wider px-1.5 py-0.5 rounded ${ELEMENT_COLORS[enemySp.element]}`}>
            {enemySp.element}
          </span>
          {enemySp.secondaryElement && (
            <span className={`text-[10px] uppercase tracking-wider px-1.5 py-0.5 rounded ${ELEMENT_COLORS[enemySp.secondaryElement]}`}>
              {enemySp.secondaryElement}
            </span>
          )}
        </div>
        <HpBar ratio={battle.enemy.currentHp / battle.enemy.maxHp} />
      </div>

      {/* Player HP bar (right) */}
      <div className="absolute top-44 right-4 panel p-3 w-80 z-10 border-amber-300/30">
        <div className="flex justify-between items-baseline">
          <div>
            <span className="font-display font-bold text-lg">{playerSp.name}</span>
            {battle.player.shiny && <span className="text-amber-300 ml-1">✦</span>}
          </div>
          <span className="text-xs text-white/70">Lv {battle.player.level}</span>
        </div>
        <div className="flex gap-1 mb-1 mt-1">
          <span className={`text-[10px] uppercase tracking-wider px-1.5 py-0.5 rounded ${ELEMENT_COLORS[playerSp.element]}`}>
            {playerSp.element}
          </span>
        </div>
        <HpBar ratio={battle.player.currentHp / battle.player.maxHp} big />
        <div className="text-right text-xs text-white/80 mt-1 font-mono">
          {battle.player.currentHp} / {battle.player.maxHp}
        </div>
      </div>

      {/* Battle log + actions panel */}
      <div className="absolute inset-x-0 bottom-0 z-20 p-3">
        <div className="panel mx-auto max-w-5xl border-amber-300/30">
          <div className="grid grid-cols-3">
            <div ref={logRef} className="col-span-2 p-3 max-h-32 overflow-y-auto text-white/95 dialogue-text font-display border-r border-white/10">
              {battle.log.slice(-4).map((line, i) => (
                <div key={battle.log.length - 4 + i} className="leading-relaxed text-sm">
                  {line}
                </div>
              ))}
            </div>
            <div className="p-3">
              {continueable && (
                <button className="btn-primary w-full" onClick={advance}>
                  ▼ Continue
                </button>
              )}
              {!continueable && showActions && subMenu === 'main' && (
                <div className="grid grid-cols-2 gap-2">
                  <button className="btn-primary" onClick={() => setSubMenu('moves')}>Fight</button>
                  <button className="btn-secondary" onClick={() => setSubMenu('items')}>Capsule</button>
                  <button className="btn-ghost" onClick={() => setSubMenu('switch')}>Switch</button>
                  <button className="btn-danger" onClick={run}>Run</button>
                </div>
              )}
              {!continueable && (battle.phase === 'animating' || battle.phase === 'enemy-turn' || battle.phase === 'capture-attempt') && (
                <div className="text-center text-white/60 text-sm font-display">…</div>
              )}
            </div>
          </div>

          {/* Move selection */}
          {!continueable && showActions && subMenu === 'moves' && (
            <div className="border-t border-white/10 p-3 grid grid-cols-2 gap-2">
              {battle.player.moves.map((mid) => {
                const m = MOVES[mid];
                if (!m) return null;
                return (
                  <button
                    key={mid}
                    className="text-left p-2 rounded-lg bg-slate-800/70 hover:bg-slate-700 hover:-translate-y-0.5 transition-all border border-white/10"
                    onClick={() => {
                      pickMove(mid);
                      setSubMenu('main');
                    }}
                  >
                    <div className="flex justify-between items-baseline">
                      <span className="font-display font-bold">{m.name}</span>
                      <span className={`text-[10px] uppercase tracking-wider px-1.5 py-0.5 rounded ${ELEMENT_COLORS[m.element]}`}>
                        {m.element}
                      </span>
                    </div>
                    <div className="text-xs text-white/60 mt-1">
                      Power {m.power || '—'} • Accuracy {m.accuracy}%
                    </div>
                    <div className="text-[11px] text-white/50 italic">{m.description}</div>
                  </button>
                );
              })}
              <button className="col-span-2 btn-ghost text-sm" onClick={() => setSubMenu('main')}>
                ← Back
              </button>
            </div>
          )}

          {/* Items */}
          {!continueable && showActions && subMenu === 'items' && (
            <div className="border-t border-white/10 p-3 grid grid-cols-2 gap-2 max-h-44 overflow-y-auto">
              {player.inventory.map((stack) => {
                const item = ITEMS[stack.itemId];
                if (!item) return null;
                return (
                  <button
                    key={stack.itemId}
                    className="text-left p-2 rounded-lg bg-slate-800/70 hover:bg-slate-700 transition-all border border-white/10"
                    onClick={() => {
                      useItem(stack.itemId);
                      setSubMenu('main');
                    }}
                  >
                    <div className="flex justify-between">
                      <span className="font-display font-semibold">{item.name}</span>
                      <span className="text-amber-300 font-mono text-sm">×{stack.count}</span>
                    </div>
                    <div className="text-xs text-white/60">{item.description}</div>
                  </button>
                );
              })}
              {player.inventory.length === 0 && <div className="text-white/50 text-sm col-span-2">No items.</div>}
              <button className="col-span-2 btn-ghost text-sm" onClick={() => setSubMenu('main')}>
                ← Back
              </button>
            </div>
          )}

          {/* Switch */}
          {!continueable && (showActions || battle.phase === 'select-switch') && subMenu === 'switch' && (
            <div className="border-t border-white/10 p-3 grid grid-cols-3 gap-2">
              {player.party.map((c) => {
                const sp = SPECIES[c.speciesId];
                const fainted = c.currentHp <= 0;
                const active = c.uid === battle.player.uid;
                return (
                  <button
                    key={c.uid}
                    disabled={fainted || active}
                    className={`p-2 rounded-lg border ${
                      active ? 'bg-amber-300/20 border-amber-300/60' : fainted ? 'bg-slate-900/40 border-white/5 opacity-40' : 'bg-slate-800/70 border-white/10 hover:bg-slate-700'
                    }`}
                    onClick={() => {
                      swapTo(c.uid);
                      setSubMenu('main');
                    }}
                  >
                    <div className="flex justify-between text-sm">
                      <span className="font-semibold">{sp.name}</span>
                      <span className="font-mono text-xs">Lv{c.level}</span>
                    </div>
                    <div className="text-[11px] text-white/60">{fainted ? 'Fainted' : `HP ${c.currentHp}`}</div>
                  </button>
                );
              })}
              {battle.phase !== 'select-switch' && (
                <button className="col-span-3 btn-ghost text-sm" onClick={() => setSubMenu('main')}>
                  ← Back
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
