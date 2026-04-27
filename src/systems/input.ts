// Centralized input state shared across keyboard, gamepad, and touch.
// All sources mutate this object; consumers read from it (it's a ref-style live object).

export interface InputState {
  up: boolean;
  down: boolean;
  left: boolean;
  right: boolean;
  interact: boolean;
  menu: boolean;
}

export const inputState: InputState = {
  up: false,
  down: false,
  left: false,
  right: false,
  interact: false,
  menu: false,
};

const sources: Record<keyof InputState, Set<string>> = {
  up: new Set(),
  down: new Set(),
  left: new Set(),
  right: new Set(),
  interact: new Set(),
  menu: new Set(),
};

export function registerKey(key: keyof InputState, source = 'keyboard') {
  sources[key].add(source);
  inputState[key] = sources[key].size > 0;
}

export function releaseKey(key: keyof InputState, source = 'keyboard') {
  sources[key].delete(source);
  inputState[key] = sources[key].size > 0;
}

// Gamepad polling
export function pollGamepad() {
  if (!navigator.getGamepads) return;
  const pads = navigator.getGamepads();
  for (const pad of pads) {
    if (!pad) continue;
    const lx = pad.axes[0] ?? 0;
    const ly = pad.axes[1] ?? 0;
    const dz = 0.25;
    setSource('left', 'gamepad', lx < -dz);
    setSource('right', 'gamepad', lx > dz);
    setSource('up', 'gamepad', ly < -dz);
    setSource('down', 'gamepad', ly > dz);

    // D-pad (buttons 12-15 on standard mapping)
    if (pad.buttons[12]) setSource('up', 'gamepad-dpad', pad.buttons[12].pressed);
    if (pad.buttons[13]) setSource('down', 'gamepad-dpad', pad.buttons[13].pressed);
    if (pad.buttons[14]) setSource('left', 'gamepad-dpad', pad.buttons[14].pressed);
    if (pad.buttons[15]) setSource('right', 'gamepad-dpad', pad.buttons[15].pressed);

    // A button (interact), Start (menu)
    if (pad.buttons[0]) setSource('interact', 'gamepad', pad.buttons[0].pressed);
    if (pad.buttons[9]) setSource('menu', 'gamepad', pad.buttons[9].pressed);
    return; // first connected pad wins
  }
}

function setSource(key: keyof InputState, source: string, on: boolean) {
  if (on) registerKey(key, source);
  else releaseKey(key, source);
}

let gamepadStarted = false;
export function startGamepadPolling() {
  if (gamepadStarted) return;
  gamepadStarted = true;
  const loop = () => {
    pollGamepad();
    requestAnimationFrame(loop);
  };
  requestAnimationFrame(loop);
}
