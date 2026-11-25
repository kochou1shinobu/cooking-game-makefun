// Order tickets: what a ticket is, how the board deals new ones, and how a ticket's
// patience runs out. A ticket is one dish from the menu, waiting to be served.
import { MENU, SPAWN } from './config.js';
import { pick } from './random.js';

/** How long a new ticket waits, in seconds: shorter as the shift runs on. */
export function patienceFor(elapsed) {
  const t = Math.min(1, elapsed / 180);
  return SPAWN.patienceStart + (SPAWN.patienceEnd - SPAWN.patienceStart) * t;
}

/** How often a new ticket arrives, in seconds: faster as the shift runs on. */
export function spawnIntervalFor(elapsed) {
  const t = Math.min(1, elapsed / 180);
  return SPAWN.intervalStart + (SPAWN.intervalEnd - SPAWN.intervalStart) * t;
}

/** Deal a ticket for a dish the board is not already serving, if one is free. */
export function dealTicket(random, elapsed, takenIds) {
  const free = MENU.filter((dish) => !takenIds.includes(dish.id));
  if (free.length === 0) return null;
  const dish = pick(random, free);
  const patience = patienceFor(elapsed);
  return {
    dish,
    patience,
    patienceMax: patience,
    mistakes: 0,
    born: elapsed,
    id: Math.floor(random() * 4294967296),
  };
}

/** A ticket's patience fraction, 1 when fresh and 0 when it walks out. */
export function patienceFraction(ticket) {
  return Math.max(0, ticket.patience / ticket.patienceMax);
}

/** Whether this ticket is about to walk out (under a quarter of its patience left). */
export function isUrgent(ticket) {
  return patienceFraction(ticket) < 0.25;
}
