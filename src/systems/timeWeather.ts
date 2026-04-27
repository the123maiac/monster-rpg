import { create } from 'zustand';

export type Weather = 'clear' | 'rain' | 'leaves';

interface TimeWeatherState {
  // 0..1 across full day (0=midnight, 0.25=dawn, 0.5=noon, 0.75=dusk)
  timeOfDay: number;
  weather: Weather;
  weatherTimer: number;
  setTimeOfDay: (t: number) => void;
  tick: (dtSeconds: number) => void;
  setWeather: (w: Weather) => void;
}

const DAY_LENGTH_SECONDS = 240; // 4-minute full day cycle

export const useTimeWeather = create<TimeWeatherState>((set, get) => ({
  timeOfDay: 0.35, // start mid-morning
  weather: 'clear',
  weatherTimer: 0,
  setTimeOfDay: (t) => set({ timeOfDay: ((t % 1) + 1) % 1 }),
  tick: (dt) => {
    const cur = get();
    const t = ((cur.timeOfDay + dt / DAY_LENGTH_SECONDS) % 1 + 1) % 1;
    let weather = cur.weather;
    let timer = cur.weatherTimer + dt;
    if (timer > 35) {
      timer = 0;
      const r = Math.random();
      weather = r < 0.55 ? 'clear' : r < 0.85 ? 'rain' : 'leaves';
    }
    set({ timeOfDay: t, weather, weatherTimer: timer });
  },
  setWeather: (w) => set({ weather: w, weatherTimer: 0 }),
}));

// Lighting and atmosphere helpers based on time of day
export interface Atmosphere {
  sunPos: [number, number, number];
  ambientIntensity: number;
  ambientColor: string;
  directionalIntensity: number;
  directionalColor: string;
  fogColor: string;
  hemisphereSky: string;
  hemisphereGround: string;
  isNight: boolean;
}

function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t;
}

function hexLerp(a: string, b: string, t: number): string {
  const ar = parseInt(a.slice(1, 3), 16);
  const ag = parseInt(a.slice(3, 5), 16);
  const ab = parseInt(a.slice(5, 7), 16);
  const br = parseInt(b.slice(1, 3), 16);
  const bg = parseInt(b.slice(3, 5), 16);
  const bb = parseInt(b.slice(5, 7), 16);
  const r = Math.round(lerp(ar, br, t));
  const g = Math.round(lerp(ag, bg, t));
  const bl = Math.round(lerp(ab, bb, t));
  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${bl.toString(16).padStart(2, '0')}`;
}

const KEYFRAMES: { t: number; data: Atmosphere }[] = [
  // Midnight
  { t: 0.0, data: {
    sunPos: [-15, -8, 5],
    ambientIntensity: 0.25, ambientColor: '#3a4575',
    directionalIntensity: 0.2, directionalColor: '#7d92c4',
    fogColor: '#1a2240',
    hemisphereSky: '#2a3a6e', hemisphereGround: '#1a2540',
    isNight: true,
  }},
  // Pre-dawn
  { t: 0.18, data: {
    sunPos: [-12, -3, 5],
    ambientIntensity: 0.35, ambientColor: '#5a5680',
    directionalIntensity: 0.4, directionalColor: '#a3a0c4',
    fogColor: '#525273',
    hemisphereSky: '#7a6e8c', hemisphereGround: '#3d4a5a',
    isNight: true,
  }},
  // Sunrise
  { t: 0.28, data: {
    sunPos: [-10, 4, 6],
    ambientIntensity: 0.55, ambientColor: '#ffb380',
    directionalIntensity: 1.0, directionalColor: '#ffd6a3',
    fogColor: '#ffba91',
    hemisphereSky: '#ffaf80', hemisphereGround: '#5d6a3a',
    isNight: false,
  }},
  // Morning
  { t: 0.4, data: {
    sunPos: [5, 12, 8],
    ambientIntensity: 0.6, ambientColor: '#ffffff',
    directionalIntensity: 1.3, directionalColor: '#fff3d6',
    fogColor: '#bde3ff',
    hemisphereSky: '#bde3ff', hemisphereGround: '#557a3a',
    isNight: false,
  }},
  // Noon
  { t: 0.5, data: {
    sunPos: [0, 18, 0],
    ambientIntensity: 0.7, ambientColor: '#ffffff',
    directionalIntensity: 1.4, directionalColor: '#ffffff',
    fogColor: '#cfeaff',
    hemisphereSky: '#9bd9ff', hemisphereGround: '#5a8a4a',
    isNight: false,
  }},
  // Afternoon
  { t: 0.65, data: {
    sunPos: [-8, 10, -3],
    ambientIntensity: 0.6, ambientColor: '#ffe6c2',
    directionalIntensity: 1.2, directionalColor: '#ffd18a',
    fogColor: '#e6c8a3',
    hemisphereSky: '#cfb486', hemisphereGround: '#5a7a3a',
    isNight: false,
  }},
  // Sunset
  { t: 0.78, data: {
    sunPos: [-15, 2, -3],
    ambientIntensity: 0.5, ambientColor: '#ff7a4a',
    directionalIntensity: 0.9, directionalColor: '#ff8a3a',
    fogColor: '#c46a5d',
    hemisphereSky: '#c4523a', hemisphereGround: '#3a4a3a',
    isNight: false,
  }},
  // Dusk
  { t: 0.88, data: {
    sunPos: [-15, -2, -3],
    ambientIntensity: 0.35, ambientColor: '#5a4570',
    directionalIntensity: 0.4, directionalColor: '#7a5a8a',
    fogColor: '#3a3550',
    hemisphereSky: '#5a3a6a', hemisphereGround: '#1f2a3a',
    isNight: true,
  }},
  // Night
  { t: 1.0, data: {
    sunPos: [-15, -8, 5],
    ambientIntensity: 0.25, ambientColor: '#3a4575',
    directionalIntensity: 0.2, directionalColor: '#7d92c4',
    fogColor: '#1a2240',
    hemisphereSky: '#2a3a6e', hemisphereGround: '#1a2540',
    isNight: true,
  }},
];

export function atmosphereAt(t: number): Atmosphere {
  for (let i = 0; i < KEYFRAMES.length - 1; i++) {
    const a = KEYFRAMES[i];
    const b = KEYFRAMES[i + 1];
    if (t >= a.t && t <= b.t) {
      const r = (t - a.t) / Math.max(0.0001, b.t - a.t);
      return {
        sunPos: [
          lerp(a.data.sunPos[0], b.data.sunPos[0], r),
          lerp(a.data.sunPos[1], b.data.sunPos[1], r),
          lerp(a.data.sunPos[2], b.data.sunPos[2], r),
        ],
        ambientIntensity: lerp(a.data.ambientIntensity, b.data.ambientIntensity, r),
        ambientColor: hexLerp(a.data.ambientColor, b.data.ambientColor, r),
        directionalIntensity: lerp(a.data.directionalIntensity, b.data.directionalIntensity, r),
        directionalColor: hexLerp(a.data.directionalColor, b.data.directionalColor, r),
        fogColor: hexLerp(a.data.fogColor, b.data.fogColor, r),
        hemisphereSky: hexLerp(a.data.hemisphereSky, b.data.hemisphereSky, r),
        hemisphereGround: hexLerp(a.data.hemisphereGround, b.data.hemisphereGround, r),
        isNight: r < 0.5 ? a.data.isNight : b.data.isNight,
      };
    }
  }
  return KEYFRAMES[0].data;
}

export function timeLabel(t: number): string {
  if (t < 0.18) return 'Night';
  if (t < 0.28) return 'Dawn';
  if (t < 0.45) return 'Morning';
  if (t < 0.55) return 'Midday';
  if (t < 0.7) return 'Afternoon';
  if (t < 0.83) return 'Evening';
  if (t < 0.92) return 'Dusk';
  return 'Night';
}
