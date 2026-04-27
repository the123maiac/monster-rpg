import { useGameStore } from '@/store/gameStore';

export default function Settings() {
  const settings = useGameStore((s) => s.settings);
  const reset = useGameStore((s) => s.resetSettings);
  const prevScreen = useGameStore((s) => s.prevScreen);
  const setScreen = useGameStore((s) => s.setScreen);

  return (
    <div className="menu-bg w-full h-full flex flex-col p-4">
      <div className="flex justify-between items-center mb-3">
        <h2 className="text-2xl font-display font-bold">Settings</h2>
        <button className="btn-ghost text-sm" onClick={() => setScreen(prevScreen === 'settings' ? 'main-menu' : prevScreen)}>← Back</button>
      </div>

      <div className="panel p-5 max-w-md mx-auto w-full flex flex-col gap-4">
        <Slider label="Music Volume" value={settings.musicVolume} onChange={(v) => reset({ musicVolume: v })} />
        <Slider label="SFX Volume" value={settings.sfxVolume} onChange={(v) => reset({ sfxVolume: v })} />
        <div>
          <div className="text-sm text-white/70 mb-1">Text Speed</div>
          <div className="grid grid-cols-3 gap-2">
            {(['slow', 'normal', 'fast'] as const).map((v) => (
              <button
                key={v}
                onClick={() => reset({ textSpeed: v })}
                className={`btn-ghost text-sm capitalize ${settings.textSpeed === v ? 'bg-amber-300/20 border-amber-300/60' : ''}`}
              >
                {v}
              </button>
            ))}
          </div>
        </div>
        <p className="text-xs text-white/40 mt-2 text-center italic">
          Audio placeholders for now — sound effects can plug in here.
        </p>
      </div>
    </div>
  );
}

function Slider({ label, value, onChange }: { label: string; value: number; onChange: (v: number) => void }) {
  return (
    <label className="block">
      <div className="flex justify-between text-sm text-white/70 mb-1">
        <span>{label}</span>
        <span className="font-mono">{Math.round(value * 100)}%</span>
      </div>
      <input
        type="range"
        min={0}
        max={1}
        step={0.05}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className="w-full accent-amber-400"
      />
    </label>
  );
}
