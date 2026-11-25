// Midnight Noodle Cart: every tuning number, colour, recipe and screen position in one
// place. The playfield is a fixed 1280x720 logical area; the renderer scales it to the
// window, so no rule below depends on the screen size.

export const FIELD = { width: 1280, height: 720 };

/** The simulation's fixed step, in seconds: 60 updates a second whatever the display's rate. */
export const STEP = 1 / 60;

/** One shift lasts three minutes; the score is the coins earned in it. */
export const SHIFT_SECONDS = 180;

/** At most three tickets wait on the order board at once. */
export const MAX_TICKETS = 3;

/** A wrong ingredient costs the active ticket this many seconds of patience. */
export const MISTAKE_PATIENCE_COST = 5;

/** Tip: up to this fraction of the dish price, scaled by the patience left when served. */
export const TIP_FRACTION = 0.5;

/** A serve with no mistake on that ticket pays this multiple. */
export const PERFECT_MULTIPLIER = 1.5;

/** Each consecutive perfect serve adds this to the combo multiplier, up to the cap. */
export const COMBO_STEP = 0.1;
export const COMBO_CAP = 2.0;

/** Stars on the summary screen, by coins earned in one shift. */
export const STAR_COINS = [120, 220, 340];

/** Where the best shift is kept between visits (this browser only). */
export const BEST_KEY = 'midnight-noodle-cart.best';

/** Broths, noodles and toppings: id, name, colour, and the key that adds it. */
export const BROTHS = [
  { id: 'tonkotsu', name: 'Tonkotsu', color: '#efe3c2', key: '1' },
  { id: 'shio', name: 'Shio', color: '#f7ecd2', key: '2' },
  { id: 'miso', name: 'Miso', color: '#a86a35', key: '3' },
];

export const NOODLES = [
  { id: 'wheat', name: 'Wheat noodles', color: '#f2cf5a', key: '4' },
  { id: 'rice', name: 'Rice noodles', color: '#f6f1e3', key: '5' },
];

export const TOPPINGS = [
  { id: 'egg', name: 'Soft egg', color: '#ffe9a8', key: 'q' },
  { id: 'chashu', name: 'Chashu', color: '#d98a7a', key: 'w' },
  { id: 'scallion', name: 'Scallion', color: '#79c47f', key: 'e' },
  { id: 'nori', name: 'Nori', color: '#33402f', key: 'a' },
  { id: 'corn', name: 'Sweet corn', color: '#ffd94d', key: 's' },
  { id: 'chili', name: 'Chili oil', color: '#d64533', key: 'd' },
];

/** The menu: each dish is one broth, one noodle and exactly two toppings. */
export const MENU = [
  { id: 'midnight-tonkotsu', name: 'Midnight Tonkotsu', broth: 'tonkotsu', noodle: 'wheat', toppings: ['egg', 'chashu'], price: 14 },
  { id: 'lantern-shio', name: 'Lantern Shio', broth: 'shio', noodle: 'wheat', toppings: ['scallion', 'nori'], price: 12 },
  { id: 'ember-miso', name: 'Ember Miso', broth: 'miso', noodle: 'rice', toppings: ['corn', 'chili'], price: 13 },
  { id: 'moonlight-veggie', name: 'Moonlight Veggie', broth: 'shio', noodle: 'rice', toppings: ['corn', 'scallion'], price: 11 },
  { id: 'chili-dawn', name: 'Chili Dawn', broth: 'tonkotsu', noodle: 'rice', toppings: ['chili', 'egg'], price: 15 },
  { id: 'old-town', name: 'Old Town Classic', broth: 'miso', noodle: 'wheat', toppings: ['chashu', 'nori'], price: 14 },
];

/** How new orders arrive and how long a ticket waits, from calm open to closing rush. */
export const SPAWN = {
  firstAt: 2,
  intervalStart: 14,
  intervalEnd: 7,
  patienceStart: 45,
  patienceEnd: 28,
};

/** Every clickable station on the counter: what it adds, its key, and its rectangle. */
export const STATIONS = [
  ...BROTHS.map((b, i) => ({ kind: 'broth', id: b.id, name: b.name, color: b.color, key: b.key, x: 48 + i * 128, y: 226, w: 112, h: 92 })),
  ...NOODLES.map((n, i) => ({ kind: 'noodle', id: n.id, name: n.name, color: n.color, key: n.key, x: 48 + i * 128, y: 342, w: 112, h: 92 })),
  ...TOPPINGS.map((t, i) => ({ kind: 'topping', id: t.id, name: t.name, color: t.color, key: t.key, x: 896 + (i % 3) * 128, y: 226 + Math.floor(i / 3) * 116, w: 112, h: 92 })),
];

/** The assembly bowl on its board, in the middle of the kitchen. */
export const BOWL = { x: 640, y: 400, r: 118 };

/** The serve bell and the trash, on the counter's front edge. */
export const BELL = { x: 556, y: 596, w: 168, h: 72 };
export const TRASH = { x: 744, y: 596, w: 112, h: 72 };

/** The order board's three ticket slots. */
export const TICKETS = [0, 1, 2].map((i) => ({ x: 40 + i * 400, y: 100, w: 384, h: 104 }));

export const PALETTE = {
  night: '#161d2e',
  nightDeep: '#10151f',
  lantern: '#ffb347',
  lanternGlow: '#ff8c42',
  wood: '#7a4a26',
  woodDark: '#5d3719',
  counter: '#8a5a33',
  board: '#232c40',
  boardEdge: '#39445e',
  ticket: '#f7ead0',
  ticketInk: '#2e2118',
  ticketActive: '#ffe9b0',
  text: '#f2ead8',
  muted: '#9aa5bd',
  danger: '#e5534b',
  good: '#7bc47f',
  coin: '#f2c94c',
  steam: 'rgba(240, 240, 255, 0.55)',
};

export const FONT = 'system-ui, -apple-system, "Segoe UI", sans-serif';
