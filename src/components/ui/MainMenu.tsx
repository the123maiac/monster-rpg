import { useGameStore } from '@/store/gameStore';
import { hasSave, clearSave } from '@/systems/save';
import { useState } from 'react';
import { useTutorial } from '@/systems/tutorial';
import { sfx } from '@/systems/sound';

export default function MainMenu() {
  const newGame = useGameStore((s) => s.newGame);
  const loadFromStorage = useGameStore((s) => s.loadFromStorage);
  const setScreen = useGameStore((s) => s.setScreen);
  const tutorial = useTutorial();
  const [confirmNew, setConfirmNew] = useState(false);

  const saveExists = hasSave();

  const startNewGame = () => {
    sfx.confirm();
    if (!tutorial.completed) tutorial.start();
    newGame();
  };

  return (
    <div className="menu-bg w-full h-full flex flex-col items-center justify-center text-center select-none">
      <div className="absolute inset-0 pointer-events-none opacity-30 mix-blend-screen"
        style={{ backgroundImage: 'radial-gradient(circle, #fff8 1px, transparent 1px)', backgroundSize: '4px 4px' }}
      />
      <div className="relative">
        <h1 className="text-6xl md:text-7xl font-display font-bold tracking-tight title-glow text-amber-200">
          Aetheria
        </h1>
        <p className="mt-2 text-xl md:text-2xl text-sky-200 font-display tracking-widest uppercase">
          Companion Quest
        </p>
        <p className="mt-1 text-sm text-white/50 italic">An original creature-collecting adventure</p>
      </div>

      <div className="mt-12 flex flex-col gap-3 w-72 relative">
        {saveExists && (
          <button
            className="btn-primary"
            onClick={() => {
              sfx.confirm();
              loadFromStorage();
            }}
          >
            Continue
          </button>
        )}
        <button
          className={saveExists ? 'btn-secondary' : 'btn-primary'}
          onClick={() => {
            sfx.click();
            if (saveExists) setConfirmNew(true);
            else startNewGame();
          }}
        >
          New Game
        </button>
        <button
          className="btn-secondary"
          onClick={() => {
            sfx.click();
            setScreen('versus');
          }}
        >
          Versus Mode
        </button>
        <button
          className="btn-ghost"
          onClick={() => {
            sfx.click();
            setScreen('achievements');
          }}
        >
          Achievements
        </button>
        <button
          className="btn-ghost"
          onClick={() => {
            sfx.click();
            tutorial.start();
            if (saveExists) loadFromStorage();
            else newGame();
          }}
        >
          Replay Tutorial
        </button>
        <button className="btn-ghost" onClick={() => { sfx.click(); setScreen('settings'); }}>
          Settings
        </button>
      </div>

      <div className="absolute bottom-4 text-white/40 text-xs">
        WASD or arrow keys to move • E or Space to interact • Esc for pause
      </div>

      {confirmNew && (
        <div className="absolute inset-0 bg-black/70 flex items-center justify-center z-50">
          <div className="panel p-6 w-[26rem] text-left">
            <h3 className="text-xl font-display font-semibold mb-2">Start a new game?</h3>
            <p className="text-white/70 text-sm mb-5">
              This will overwrite your existing save. This can&apos;t be undone.
            </p>
            <div className="flex gap-2 justify-end">
              <button className="btn-ghost" onClick={() => setConfirmNew(false)}>
                Cancel
              </button>
              <button
                className="btn-danger"
                onClick={() => {
                  clearSave();
                  setConfirmNew(false);
                  startNewGame();
                }}
              >
                Overwrite
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
