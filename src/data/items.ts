import type { InventoryItem } from '@/types';

export const ITEMS: Record<string, InventoryItem> = {
  capsule: {
    id: 'capsule',
    name: 'Capture Capsule',
    description: 'A standard companion-capture device.',
    category: 'capsule',
    effect: { type: 'capture', value: 1.0 },
  },
  superCapsule: {
    id: 'superCapsule',
    name: 'Super Capsule',
    description: 'A reinforced capsule with stronger capture rate.',
    category: 'capsule',
    effect: { type: 'capture', value: 1.6 },
  },
  healingBerry: {
    id: 'healingBerry',
    name: 'Healing Berry',
    description: 'Restores 30 HP to a single companion.',
    category: 'healing',
    effect: { type: 'heal', value: 30 },
  },
  energyPotion: {
    id: 'energyPotion',
    name: 'Energy Potion',
    description: 'Fully restores a companion\'s HP.',
    category: 'energy',
    effect: { type: 'heal', value: 999 },
  },
};

export const STARTER_INVENTORY = [
  { itemId: 'capsule', count: 5 },
  { itemId: 'healingBerry', count: 3 },
];
