import type { StarMapData } from '../types';

export const starMapData: StarMapData = {
  systems: [
    { id: 'sol', name: 'Sol System', position: { x: 400, y: 300 }, level: 1, description: 'The cradle of humanity, recreated with painstaking detail. Features familiar inner planets, an asteroid belt, and the gas giant Jupiter.' },
    { id: 'alpha-centauri', name: 'Alpha Centauri', position: { x: 350, y: 380 }, level: 2, description: 'A bustling trade hub. Corporate presence is strong, and so are the opportunities for a savvy drifter.' },
    { id: 'proxima-centauri', name: 'Proxima Centauri', position: { x: 370, y: 410 }, level: 3, description: 'Known for its dense asteroid fields, rich in rare materials. Watch out for pirates.' },
    { id: 'barnards-star', name: "Barnard's Star", position: { x: 480, y: 350 }, level: 4, description: 'A remote outpost system. Law is what you make it. High risk, high reward.' },
    { id: 'sirius', name: 'Sirius', position: { x: 450, y: 220 }, level: 5, description: 'A heavily fortified corporate system. Unauthorized entry is met with lethal force. Rumored to hide advanced tech.' },
    { id: 'tau-ceti', name: 'Tau Ceti', position: { x: 280, y: 250 }, level: 3, description: 'A former colony that went dark. Full of salvage, but unsettling transmissions are often heard.' },
  ],
  connections: [
    ['sol', 'alpha-centauri'],
    ['sol', 'barnards-star'],
    ['sol', 'tau-ceti'],
    ['alpha-centauri', 'proxima-centauri'],
    ['barnards-star', 'sirius'],
  ],
};