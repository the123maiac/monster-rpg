import { ITEMS } from '@/data/items';
import { useGameStore } from '@/store/gameStore';

export default function Inventory() {
  const inventory = useGameStore((s) => s.player.inventory);
  const setScreen = useGameStore((s) => s.setScreen);

  const groups: Record<string, typeof inventory> = {};
  for (const stack of inventory) {
    const it = ITEMS[stack.itemId];
    if (!it) continue;
    if (!groups[it.category]) groups[it.category] = [];
    groups[it.category].push(stack);
  }

  return (
    <div className="menu-bg w-full h-full flex flex-col p-4">
      <div className="flex justify-between items-center mb-3">
        <h2 className="text-2xl font-display font-bold">Bag</h2>
        <button className="btn-ghost text-sm" onClick={() => setScreen('overworld')}>← Back</button>
      </div>

      {inventory.length === 0 ? (
        <div className="flex-1 flex items-center justify-center text-white/50">Your bag is empty.</div>
      ) : (
        <div className="flex-1 overflow-y-auto flex flex-col gap-3">
          {Object.entries(groups).map(([cat, stacks]) => (
            <div key={cat}>
              <div className="text-xs uppercase tracking-widest text-white/50 mb-1 px-1">{cat}</div>
              <div className="grid grid-cols-2 gap-2">
                {stacks.map((stack) => {
                  const it = ITEMS[stack.itemId];
                  return (
                    <div key={stack.itemId} className="panel p-3">
                      <div className="flex justify-between items-baseline">
                        <span className="font-display font-semibold">{it.name}</span>
                        <span className="text-amber-300 font-mono">×{stack.count}</span>
                      </div>
                      <div className="text-xs text-white/60">{it.description}</div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
