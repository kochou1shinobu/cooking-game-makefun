// Boot and the one loop: input is read every frame, the world advances in fixed 1/60 s
// steps (several in a slow frame, none in a fast one), and the renderer paints what is
// there. The game moves between four screens: title, play, paused and game over.
//
// ?seed=N fixes the order the tickets are dealt. ?shot=kitchen|assembly|serve|rush|start
// (with &seed=N) stages that scene instead of running the loop, paints it twice and sets
// window.__shotReady for a screenshot.
import { BEST_KEY, STEP } from './config.js';
import { createRandom } from './random.js';
import { createWorld, resetWorld, stepWorld, worldAdd, worldClearBowl, worldCycleTicket, worldPickTicket, worldServe, EVENT_EXPIRED, EVENT_SERVED, EVENT_SHIFT_OVER } from './world.js';
import { ACTION_CLEAR, ACTION_CONFIRM, ACTION_CYCLE, ACTION_PAUSE, ACTION_SERVE, createInput } from './input.js';
import { createRenderer, SCREEN_OVER, SCREEN_PAUSED, SCREEN_PLAY, SCREEN_TITLE } from './render.js';
import { createSound } from './sound.js';
import { stageShot } from './shots.js';

/** The longest frame the loop catches up on; a longer stall (a hidden tab) is dropped. */
const MAX_FRAME = 0.25;

const params = new URLSearchParams(window.location.search);
const shot = params.get('shot');
const seedParam = Number.parseInt(params.get('seed') ?? '', 10);
const seed = Number.isInteger(seedParam) ? seedParam : Math.floor(Math.random() * 4294967296);

const canvas = document.getElementById('game');
const status = document.getElementById('status');
const world = createWorld(createRandom(seed));
// A handle for play-testing in a browser (the tests read the tickets and the coins).
window.__noodleCart = { world };
const renderer = createRenderer(canvas);
const sound = createSound();
const startedAt = performance.now();

/** Seconds since the page loaded, for steam, lantern sway and the urgency pulse. */
function nowSeconds() {
  return (performance.now() - startedAt) / 1000;
}

function readBest() {
  try {
    return Number.parseInt(window.localStorage.getItem(BEST_KEY) ?? '0', 10) || 0;
  } catch {
    return 0;
  }
}

function saveBest(value) {
  try {
    window.localStorage.setItem(BEST_KEY, String(value));
  } catch {
    // Storage can be off (private windows): the best score then lasts this visit only.
  }
}

function runShot(name) {
  const scene = stageShot(name, world);
  let painted = 0;
  function paint() {
    renderer.draw(world, scene.screen, scene.best, 12.5);
    painted += 1;
    if (painted < 2) requestAnimationFrame(paint);
    else window.__shotReady = true;
  }
  requestAnimationFrame(paint);
}

function runGame() {
  const input = createInput(canvas);
  let screen = SCREEN_TITLE;
  let best = readBest();
  let accumulator = 0;
  let last = performance.now();
  let lastTickAt = 0;

  // Screen readers (and anyone watching the page's text) hear the screen changes.
  function announce(message) {
    status.textContent = message;
  }

  function startGame() {
    resetWorld(world);
    accumulator = 0;
    screen = SCREEN_PLAY;
    sound.unlock();
    announce('Playing. Serve the tickets before their patience runs out.');
  }

  function endGame() {
    screen = SCREEN_OVER;
    if (world.state.coins > best) {
      best = world.state.coins;
      saveBest(best);
    }
    sound.close();
    announce(`Shift over. ${world.state.coins} coins, ${world.state.served} dishes served.`);
  }

  function handleClicks() {
    for (const click of input.takeClicks()) {
      if (!click) continue;
      if (screen !== SCREEN_PLAY) {
        if (click.type === 'station' || click.type === 'bell') startGame();
        continue;
      }
      sound.unlock();
      if (click.type === 'station') {
        const result = worldAdd(world, click.kind, click.id);
        if (result === 'added') sound.add();
        else if (result === 'wrong') sound.mistake();
      } else if (click.type === 'ticket') {
        worldPickTicket(world, click.index);
      } else if (click.type === 'bell') {
        if (worldServe(world) === EVENT_SERVED) sound.serve();
        else sound.mistake();
      } else if (click.type === 'trash') {
        worldClearBowl(world);
      }
    }
  }

  function handleActions() {
    const actions = input.takeActions();
    if (actions & ACTION_CONFIRM && (screen === SCREEN_TITLE || screen === SCREEN_OVER)) startGame();
    else if (actions & ACTION_SERVE && screen === SCREEN_PLAY) {
      if (worldServe(world) === EVENT_SERVED) sound.serve();
      else sound.mistake();
    } else if (actions & ACTION_CLEAR && screen === SCREEN_PLAY) {
      worldClearBowl(world);
    } else if (actions & ACTION_CYCLE && screen === SCREEN_PLAY) {
      worldCycleTicket(world);
    }
    if (actions & ACTION_PAUSE) {
      if (screen === SCREEN_PLAY) {
        screen = SCREEN_PAUSED;
        announce('Paused.');
      } else if (screen === SCREEN_PAUSED) {
        screen = SCREEN_PLAY;
        announce('Playing.');
      }
    }
  }

  function step() {
    const events = stepWorld(world, STEP);
    if (events & EVENT_SERVED) sound.serve();
    if (events & EVENT_EXPIRED) sound.mistake();
    if (events & EVENT_SHIFT_OVER) endGame();
    const urgent = world.state.tickets.some((ticket) => ticket.patience < 8 && ticket.patience > 0);
    if (urgent && nowSeconds() - lastTickAt > 1) {
      lastTickAt = nowSeconds();
      sound.tick();
    }
  }

  function frame(now) {
    requestAnimationFrame(frame);
    accumulator += Math.min((now - last) / 1000, MAX_FRAME);
    last = now;
    handleClicks();
    handleActions();
    if (screen === SCREEN_PLAY) {
      while (accumulator >= STEP && screen === SCREEN_PLAY) {
        step();
        accumulator -= STEP;
      }
    } else {
      accumulator = 0;
    }
    renderer.draw(world, screen, best, nowSeconds());
  }

  // Leaving the tab pauses a running game rather than letting tickets expire unseen.
  document.addEventListener('visibilitychange', () => {
    if (document.hidden && screen === SCREEN_PLAY) {
      screen = SCREEN_PAUSED;
      announce('Paused.');
    }
  });

  announce('Midnight Noodle Cart. Press Space or click to open the cart.');
  requestAnimationFrame(frame);
}

if (shot) runShot(shot);
else runGame();
