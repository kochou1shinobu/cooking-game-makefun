// The shift: the timer, the tickets on the board, the coins earned, the combo, and the
// events each step can raise. The world advances in fixed steps; the renderer paints it.
import {
  COMBO_CAP, COMBO_STEP, MAX_TICKETS, MISTAKE_PATIENCE_COST, PERFECT_MULTIPLIER,
  SHIFT_SECONDS, SPAWN, TIP_FRACTION,
} from './config.js';
import { addToBowl, bowlMatches, clearBowl, createBowl } from './bowl.js';
import { dealTicket, patienceFraction, spawnIntervalFor } from './orders.js';

export const EVENT_NONE = 0;
export const EVENT_SERVED = 1;
export const EVENT_EXPIRED = 2;
export const EVENT_MISTAKE = 4;
export const EVENT_SHIFT_OVER = 8;

/** A fresh shift: no tickets yet, the bowl empty, the clock at zero. */
export function createWorld(random) {
  return {
    random,
    state: {
      elapsed: 0,
      tickets: [],
      activeTicket: 0,
      bowl: createBowl(),
      coins: 0,
      served: 0,
      perfectServes: 0,
      combo: 0,
      bestCombo: 0,
      mistakes: 0,
      over: false,
      spawnIn: SPAWN.firstAt,
      lastServe: null,
      lastEarned: 0,
    },
  };
}

/** Start a shift again from the beginning. */
export function resetWorld(world) {
  const fresh = createWorld(world.random);
  world.state = fresh.state;
}

/** The ticket the cook is working on, or null when the board is empty. */
export function activeTicket(world) {
  const { tickets, activeTicket: index } = world.state;
  return tickets.length === 0 ? null : tickets[Math.min(index, tickets.length - 1)];
}

/** Coins for serving this ticket now: price plus a tip for the patience still left. */
export function serveValue(world, ticket) {
  const { combo } = world.state;
  const tip = ticket.dish.price * TIP_FRACTION * patienceFraction(ticket);
  const perfect = ticket.mistakes === 0;
  const multiplier = perfect ? PERFECT_MULTIPLIER : 1;
  const comboMultiplier = 1 + Math.min(COMBO_CAP - 1, combo * COMBO_STEP);
  return {
    coins: Math.round((ticket.dish.price + tip) * multiplier * comboMultiplier),
    perfect,
  };
}

/** Add one ingredient from a station. Returns the bowl's answer: added, full or wrong. */
export function worldAdd(world, kind, id) {
  const state = world.state;
  if (state.over) return 'full';
  const ticket = activeTicket(world);
  const result = addToBowl(state.bowl, kind, id, ticket);
  if (result === 'wrong') {
    state.mistakes += 1;
    if (ticket) {
      ticket.mistakes += 1;
      ticket.patience = Math.max(0, ticket.patience - MISTAKE_PATIENCE_COST);
    }
    state.combo = 0;
    return 'wrong';
  }
  return result;
}

/** Ring the bell: serve the bowl when it matches the active ticket, else nothing. */
export function worldServe(world) {
  const state = world.state;
  if (state.over) return EVENT_NONE;
  const ticket = activeTicket(world);
  if (!ticket || !bowlMatches(state.bowl, ticket)) return EVENT_NONE;
  const { coins, perfect } = serveValue(world, ticket);
  state.coins += coins;
  state.served += 1;
  state.lastServe = ticket.dish.name;
  state.lastEarned = coins;
  if (perfect) {
    state.perfectServes += 1;
    state.combo += 1;
    state.bestCombo = Math.max(state.bestCombo, state.combo);
  } else {
    state.combo = 0;
  }
  state.tickets.splice(state.tickets.indexOf(ticket), 1);
  state.activeTicket = 0;
  clearBowl(state.bowl);
  return EVENT_SERVED;
}

/** Tip the bowl out. */
export function worldClearBowl(world) {
  clearBowl(world.state.bowl);
}

/** Switch the active ticket to the next one on the board. */
export function worldCycleTicket(world) {
  const state = world.state;
  if (state.tickets.length > 1) state.activeTicket = (state.activeTicket + 1) % state.tickets.length;
}

/** Choose the active ticket by its slot on the board. */
export function worldPickTicket(world, index) {
  const state = world.state;
  if (index >= 0 && index < state.tickets.length) state.activeTicket = index;
}

/** Advance the shift by one fixed step, dealing and expiring tickets as time passes. */
export function stepWorld(world, step) {
  const state = world.state;
  if (state.over) return EVENT_NONE;
  let events = EVENT_NONE;
  state.elapsed += step;
  if (state.elapsed >= SHIFT_SECONDS) {
    state.elapsed = SHIFT_SECONDS;
    state.over = true;
    return EVENT_SHIFT_OVER;
  }
  for (const ticket of state.tickets) ticket.patience -= step;
  const expired = state.tickets.findIndex((ticket) => ticket.patience <= 0);
  if (expired !== -1) {
    state.tickets.splice(expired, 1);
    state.activeTicket = 0;
    state.combo = 0;
    events |= EVENT_EXPIRED;
  }
  state.spawnIn -= step;
  if (state.spawnIn <= 0 && state.tickets.length < MAX_TICKETS) {
    const taken = state.tickets.map((ticket) => ticket.dish.id);
    const ticket = dealTicket(world.random, state.elapsed, taken);
    if (ticket) state.tickets.push(ticket);
    state.spawnIn = spawnIntervalFor(state.elapsed);
  }
  return events;
}

/** Seconds left on the shift clock. */
export function secondsLeft(world) {
  return Math.max(0, SHIFT_SECONDS - world.state.elapsed);
}
