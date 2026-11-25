// The screenshot scenes behind ?shot=kitchen|assembly|serve|rush. The play scenes run
// the real rules forward from a fresh world, steered by a simple autopilot that adds the
// active ticket's missing ingredients in order and rings the bell when the bowl matches.
// The cover and the rush are built by hand on top of that: three tickets dealt, the
// clock and the coins set, the bowl half-built — so the frame always shows the whole
// game (board, counter, a dish mid-assembly, the timer, a plate ready) and the same
// seed always gives the same frame.
import { STEP } from './config.js';
import { bowlMatches } from './bowl.js';
import { activeTicket, resetWorld, stepWorld, worldAdd, worldClearBowl, worldServe } from './world.js';
import { dealTicket } from './orders.js';
import { SCREEN_PLAY, SCREEN_TITLE } from './render.js';

/** One autopilot move: add the next missing ingredient, or serve when the bowl matches. */
function cookStep(world, serve) {
  const ticket = activeTicket(world);
  if (!ticket) return;
  const { bowl } = world.state;
  if (bowlMatches(bowl, ticket)) {
    if (serve) worldServe(world);
    return;
  }
  const dish = ticket.dish;
  let result = 'full';
  if (!bowl.broth) result = worldAdd(world, 'broth', dish.broth);
  else if (!bowl.noodle) result = worldAdd(world, 'noodle', dish.noodle);
  else {
    const missing = dish.toppings.find((topping) => !bowl.toppings.includes(topping));
    if (missing) result = worldAdd(world, 'topping', missing);
  }
  if (result === 'full') {
    // The bowl holds something this ticket does not need (a ticket expired mid-build):
    // tip it out and start this ticket fresh.
    worldClearBowl(world);
    cookStep(world, serve);
  }
}

/** Run the autopilot for `seconds`, then stop. */
function playFor(world, seconds) {
  for (let i = 0; i < seconds / STEP; i += 1) {
    cookStep(world, true);
    stepWorld(world, STEP);
    if (world.state.over) break;
  }
}

/** Deal tickets until the board holds three, then set their patience in seconds. */
function fillBoard(world, patiences) {
  const state = world.state;
  while (state.tickets.length < 3) {
    const taken = state.tickets.map((ticket) => ticket.dish.id);
    const ticket = dealTicket(world.random, state.elapsed, taken);
    if (!ticket) break;
    state.tickets.push(ticket);
  }
  state.tickets.forEach((ticket, i) => {
    if (patiences[i] !== undefined) ticket.patience = Math.min(ticket.patience, patiences[i]);
  });
  state.activeTicket = 0;
}

/** Build the bowl halfway for the active ticket: broth, noodles, one topping. */
function halfBuildBowl(world) {
  const ticket = activeTicket(world);
  if (!ticket) return;
  worldClearBowl(world);
  worldAdd(world, 'broth', ticket.dish.broth);
  worldAdd(world, 'noodle', ticket.dish.noodle);
  const first = ticket.dish.toppings[0];
  if (first) worldAdd(world, 'topping', first);
}

/**
 * Set `world` to the named scene (kitchen, assembly, serve or rush; any other name is the
 * title) and return the screen to draw over it and the best score to show.
 */
export function stageShot(name, world) {
  if (name === 'assembly') {
    playFor(world, 12);
    if (!activeTicket(world)) fillBoard(world, [40]);
    halfBuildBowl(world);
    world.state.bowl.toppings.pop();
    return { screen: SCREEN_PLAY, best: 86 };
  }
  if (name === 'serve') {
    for (let i = 0; i < 600 / STEP; i += 1) {
      cookStep(world, false);
      if (bowlMatches(world.state.bowl, activeTicket(world))) break;
      stepWorld(world, STEP);
      if (world.state.over) break;
    }
    return { screen: SCREEN_PLAY, best: 86 };
  }
  if (name === 'rush') {
    resetWorld(world);
    const state = world.state;
    state.elapsed = 140;
    state.coins = 210;
    state.served = 14;
    state.combo = 3;
    state.bestCombo = 3;
    state.lastServe = 'Chili Dawn';
    state.lastEarned = 24;
    state.spawnIn = 5;
    fillBoard(world, [6, 5, 8]);
    halfBuildBowl(world);
    return { screen: SCREEN_PLAY, best: 210 };
  }
  if (name === 'start') {
    return { screen: SCREEN_TITLE, best: 86 };
  }
  // The cover: a busy mid-shift kitchen, three tickets waiting, one bowl half-built.
  resetWorld(world);
  const state = world.state;
  state.elapsed = 52;
  state.coins = 64;
  state.served = 5;
  state.combo = 2;
  state.bestCombo = 2;
  state.lastServe = 'Ember Miso';
  state.lastEarned = 19;
  state.spawnIn = 8;
  fillBoard(world, [30, 20, 38]);
  halfBuildBowl(world);
  return { screen: SCREEN_PLAY, best: 86 };
}
