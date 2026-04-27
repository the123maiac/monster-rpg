import type { Move } from '@/types';

export const MOVES: Record<string, Move> = {
  tackle: { id: 'tackle', name: 'Tackle', element: 'Stone', power: 35, accuracy: 100, description: 'A full-body charge.', category: 'physical' },
  scratch: { id: 'scratch', name: 'Scratch', element: 'Stone', power: 30, accuracy: 100, description: 'A quick swipe with claws.', category: 'physical' },
  bite: { id: 'bite', name: 'Bite', element: 'Shadow', power: 50, accuracy: 95, description: 'A nasty chomp.', category: 'physical' },
  growl: { id: 'growl', name: 'Growl', element: 'Stone', power: 0, accuracy: 100, description: 'Rattles the foe.', category: 'status' },

  ember: { id: 'ember', name: 'Ember', element: 'Flame', power: 40, accuracy: 100, description: 'Spits a small flame.', category: 'special' },
  flameTail: { id: 'flameTail', name: 'Flame Tail', element: 'Flame', power: 60, accuracy: 95, description: 'A swipe wreathed in fire.', category: 'physical' },
  emberBurst: { id: 'emberBurst', name: 'Ember Burst', element: 'Flame', power: 70, accuracy: 90, description: 'A fiery explosion.', category: 'special' },

  bubble: { id: 'bubble', name: 'Bubble', element: 'Aqua', power: 35, accuracy: 100, description: 'Streams of bubbles.', category: 'special' },
  waterPulse: { id: 'waterPulse', name: 'Water Pulse', element: 'Aqua', power: 60, accuracy: 100, description: 'A ringing aquatic wave.', category: 'special' },
  shellBash: { id: 'shellBash', name: 'Shell Bash', element: 'Aqua', power: 55, accuracy: 95, description: 'A heavy shell strike.', category: 'physical' },

  vineWhip: { id: 'vineWhip', name: 'Vine Whip', element: 'Leaf', power: 45, accuracy: 100, description: 'Whips with sturdy vines.', category: 'physical' },
  leafCutter: { id: 'leafCutter', name: 'Leaf Cutter', element: 'Leaf', power: 60, accuracy: 95, description: 'Razor-sharp leaves slice.', category: 'physical' },
  bloomBeam: { id: 'bloomBeam', name: 'Bloom Beam', element: 'Leaf', power: 70, accuracy: 90, description: 'Radiant flowery energy.', category: 'special' },

  rockToss: { id: 'rockToss', name: 'Rock Toss', element: 'Stone', power: 50, accuracy: 95, description: 'Hurls a chunky stone.', category: 'physical' },
  quake: { id: 'quake', name: 'Quake', element: 'Stone', power: 65, accuracy: 90, description: 'Shakes the ground.', category: 'physical' },

  spark: { id: 'spark', name: 'Spark', element: 'Spark', power: 40, accuracy: 100, description: 'Crackling electricity.', category: 'special' },
  sparkClaw: { id: 'sparkClaw', name: 'Spark Claw', element: 'Spark', power: 55, accuracy: 95, description: 'Charged claw strike.', category: 'physical' },
  thunderJolt: { id: 'thunderJolt', name: 'Thunder Jolt', element: 'Spark', power: 70, accuracy: 90, description: 'A jolting blast.', category: 'special' },

  shadowSneak: { id: 'shadowSneak', name: 'Shadow Sneak', element: 'Shadow', power: 50, accuracy: 100, description: 'Strikes from shadow first.', category: 'physical' },
  duskMist: { id: 'duskMist', name: 'Dusk Mist', element: 'Shadow', power: 65, accuracy: 90, description: 'Engulfs the foe in mist.', category: 'special' },

  glimmer: { id: 'glimmer', name: 'Glimmer', element: 'Light', power: 45, accuracy: 100, description: 'A radiant flash.', category: 'special' },
  dawnRay: { id: 'dawnRay', name: 'Dawn Ray', element: 'Light', power: 70, accuracy: 95, description: 'A brilliant beam.', category: 'special' },

  gust: { id: 'gust', name: 'Gust', element: 'Wind', power: 40, accuracy: 100, description: 'A whipping breeze.', category: 'special' },
  windBlade: { id: 'windBlade', name: 'Wind Blade', element: 'Wind', power: 60, accuracy: 95, description: 'A slicing gale.', category: 'special' },
  airSlam: { id: 'airSlam', name: 'Air Slam', element: 'Wind', power: 70, accuracy: 85, description: 'A diving aerial slam.', category: 'physical' },

  mudShot: { id: 'mudShot', name: 'Mud Shot', element: 'Stone', power: 45, accuracy: 100, description: 'Splattering mud.', category: 'special' },
  burrow: { id: 'burrow', name: 'Burrow', element: 'Stone', power: 65, accuracy: 100, description: 'Tunnels and bursts up.', category: 'physical' },
};

export const ELEMENT_CHART: Record<string, Record<string, number>> = {
  Flame: { Leaf: 2, Aqua: 0.5, Stone: 0.5, Flame: 0.5, Light: 1.2 },
  Aqua: { Flame: 2, Stone: 1.5, Leaf: 0.5, Aqua: 0.5, Spark: 0.5 },
  Leaf: { Aqua: 2, Stone: 1.5, Flame: 0.5, Wind: 0.5, Leaf: 0.5 },
  Stone: { Spark: 2, Flame: 1.2, Wind: 1.5, Leaf: 0.5, Aqua: 0.5 },
  Spark: { Aqua: 2, Wind: 1.5, Stone: 0.5, Leaf: 1, Spark: 0.5 },
  Shadow: { Light: 2, Shadow: 0.5 },
  Light: { Shadow: 2, Light: 0.5 },
  Wind: { Leaf: 1.5, Stone: 0.5, Spark: 0.5, Aqua: 1.2 },
};

export function elementMultiplier(attacker: string, defender: string): number {
  return ELEMENT_CHART[attacker]?.[defender] ?? 1;
}
