import { useEffect, useRef } from 'react';
import { inputState, registerKey, releaseKey } from '@/systems/input';

export interface KeyState {
  up: boolean;
  down: boolean;
  left: boolean;
  right: boolean;
  interact: boolean;
  menu: boolean;
}

const KEY_MAP: Record<string, keyof KeyState> = {
  KeyW: 'up',
  ArrowUp: 'up',
  KeyS: 'down',
  ArrowDown: 'down',
  KeyA: 'left',
  ArrowLeft: 'left',
  KeyD: 'right',
  ArrowRight: 'right',
  Space: 'interact',
  Enter: 'interact',
  KeyE: 'interact',
  Escape: 'menu',
  KeyP: 'menu',
};

export function useKeyboard(): KeyState {
  // Returns the shared inputState ref so changes from gamepad/touch are also reflected.
  const ref = useRef(inputState);

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      const key = KEY_MAP[e.code];
      if (!key) return;
      registerKey(key);
      if (e.code === 'Space' || e.code.startsWith('Arrow')) e.preventDefault();
    };
    const up = (e: KeyboardEvent) => {
      const key = KEY_MAP[e.code];
      if (!key) return;
      releaseKey(key);
    };
    window.addEventListener('keydown', down);
    window.addEventListener('keyup', up);
    return () => {
      window.removeEventListener('keydown', down);
      window.removeEventListener('keyup', up);
    };
  }, []);

  return ref.current;
}
