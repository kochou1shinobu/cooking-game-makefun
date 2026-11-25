// Keyboard and mouse: clicks on stations, tickets, the bell and the trash, and the keys
// that do the same. The canvas reports clicks in logical field coordinates.
import { BELL, STATIONS, TICKETS, TRASH } from './config.js';

export const ACTION_CONFIRM = 1;
export const ACTION_PAUSE = 2;
export const ACTION_SERVE = 4;
export const ACTION_CLEAR = 8;
export const ACTION_CYCLE = 16;

/** A click target: what was hit, and which station or ticket slot it was. */
export function hitAt(x, y) {
  for (let i = 0; i < STATIONS.length; i += 1) {
    const s = STATIONS[i];
    if (x >= s.x && x < s.x + s.w && y >= s.y && y < s.y + s.h) {
      return { type: 'station', kind: s.kind, id: s.id };
    }
  }
  for (let i = 0; i < TICKETS.length; i += 1) {
    const t = TICKETS[i];
    if (x >= t.x && x < t.x + t.w && y >= t.y && y < t.y + t.h) return { type: 'ticket', index: i };
  }
  if (x >= BELL.x && x < BELL.x + BELL.w && y >= BELL.y && y < BELL.y + BELL.h) return { type: 'bell' };
  if (x >= TRASH.x && x < TRASH.x + TRASH.w && y >= TRASH.y && y < TRASH.y + TRASH.h) return { type: 'trash' };
  return null;
}

/** Read clicks and keys from the canvas; the game drains them once a frame. */
export function createInput(canvas) {
  const clicks = [];
  const actions = { bits: 0 };
  const stationKeys = new Map(STATIONS.map((s) => [s.key, s]));

  function toLogical(event) {
    const rect = canvas.getBoundingClientRect();
    return {
      x: ((event.clientX - rect.left) / rect.width) * 1280,
      y: ((event.clientY - rect.top) / rect.height) * 720,
    };
  }

  canvas.addEventListener('pointerdown', (event) => {
    event.preventDefault();
    clicks.push(toLogical(event));
  });
  window.addEventListener('keydown', (event) => {
    const key = event.key.toLowerCase();
    if (stationKeys.has(key)) {
      const s = stationKeys.get(key);
      clicks.push({ type: 'station', kind: s.kind, id: s.id, key: true });
    } else if (key === ' ' || key === 'enter') {
      actions.bits |= ACTION_CONFIRM | ACTION_SERVE;
      event.preventDefault();
    } else if (key === 'p' || key === 'escape') {
      actions.bits |= ACTION_PAUSE;
    } else if (key === 'backspace' || key === 'x') {
      actions.bits |= ACTION_CLEAR;
    } else if (key === 'tab') {
      actions.bits |= ACTION_CYCLE;
      event.preventDefault();
    }
  });

  return {
    /** The clicks since the last frame, as hit targets (or null when nothing was hit). */
    takeClicks() {
      const out = [];
      while (clicks.length > 0) {
        const c = clicks.shift();
        if (c.type) out.push(c);
        else out.push(hitAt(c.x, c.y));
      }
      return out;
    },
    /** The action bits pressed since the last frame, then cleared. */
    takeActions() {
      const bits = actions.bits;
      actions.bits = 0;
      return bits;
    },
  };
}
