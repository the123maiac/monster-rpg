// Lightweight deterministic hash + value noise. No external deps.

export function hash2(x: number, y: number, seed = 1337): number {
  let h = seed;
  h = Math.imul(h ^ x, 0x85ebca6b);
  h = Math.imul(h ^ y, 0xc2b2ae35);
  h ^= h >>> 16;
  return ((h >>> 0) % 1_000_000) / 1_000_000;
}

export function hash3(x: number, y: number, z: number, seed = 1337): number {
  let h = seed;
  h = Math.imul(h ^ x, 0x85ebca6b);
  h = Math.imul(h ^ y, 0xc2b2ae35);
  h = Math.imul(h ^ z, 0x27d4eb2f);
  h ^= h >>> 16;
  return ((h >>> 0) % 1_000_000) / 1_000_000;
}

function smooth(t: number): number {
  return t * t * (3 - 2 * t);
}

// Value noise: smooth interpolation across a hashed lattice
export function valueNoise(x: number, y: number, seed = 1337): number {
  const x0 = Math.floor(x);
  const y0 = Math.floor(y);
  const fx = smooth(x - x0);
  const fy = smooth(y - y0);
  const a = hash2(x0, y0, seed);
  const b = hash2(x0 + 1, y0, seed);
  const c = hash2(x0, y0 + 1, seed);
  const d = hash2(x0 + 1, y0 + 1, seed);
  const ab = a + (b - a) * fx;
  const cd = c + (d - c) * fx;
  return ab + (cd - ab) * fy;
}

export function fractalNoise(x: number, y: number, octaves = 3, seed = 1337): number {
  let total = 0;
  let amp = 0.5;
  let freq = 1;
  let max = 0;
  for (let i = 0; i < octaves; i++) {
    total += valueNoise(x * freq, y * freq, seed + i * 17) * amp;
    max += amp;
    amp *= 0.5;
    freq *= 2;
  }
  return total / max;
}

// Make a deterministic per-chunk RNG
export function chunkRng(chunkX: number, chunkY: number, seed: number, salt = 0) {
  let h = (chunkX * 73856093) ^ (chunkY * 19349663) ^ seed ^ (salt * 83492791);
  return () => {
    h = Math.imul(h ^ (h >>> 16), 0x21f0aaad);
    h = Math.imul(h ^ (h >>> 15), 0x735a2d97);
    h ^= h >>> 15;
    return ((h >>> 0) % 1_000_000) / 1_000_000;
  };
}
