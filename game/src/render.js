// The renderer: every pixel of the kitchen, painted on one canvas. The night market
// palette, the order board, the stations, the bowl with its steam, and the screens
// (title, play, paused, over) all live here; the world only holds numbers.
import {
  BELL, BOWL, BROTHS, FIELD, FONT, NOODLES, PALETTE, STAR_COINS, STATIONS, TICKETS, TOPPINGS, TRASH,
} from './config.js';
import { bowlIsEmpty, bowlMatches } from './bowl.js';
import { activeTicket, secondsLeft } from './world.js';
import { isUrgent, patienceFraction } from './orders.js';

export const SCREEN_TITLE = 'title';
export const SCREEN_PLAY = 'play';
export const SCREEN_PAUSED = 'paused';
export const SCREEN_OVER = 'over';

const INGREDIENTS = [...BROTHS, ...NOODLES, ...TOPPINGS];
const INGREDIENT_BY_ID = new Map(INGREDIENTS.map((item) => [item.id, item]));

/** Short label for an ingredient, drawn on its station and on tickets. */
function shortName(id) {
  return { tonkotsu: 'Ton', shio: 'Shio', miso: 'Miso', wheat: 'Wht', rice: 'Rice', egg: 'Egg', chashu: 'Cha', scallion: 'Sca', nori: 'Nori', corn: 'Corn', chili: 'Chili' }[id] || id;
}

/** A rounded rectangle path, for tickets, stations and buttons. */
function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

/** A small disc showing one ingredient, by its colour, with its short name. */
function drawIngredientDot(ctx, id, x, y, r) {
  const item = INGREDIENT_BY_ID.get(id);
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fillStyle = item ? item.color : '#888';
  ctx.fill();
  ctx.lineWidth = 2;
  ctx.strokeStyle = 'rgba(0,0,0,0.35)';
  ctx.stroke();
  ctx.fillStyle = id === 'nori' ? '#f2ead8' : '#2e2118';
  ctx.font = `bold ${Math.round(r * 0.7)}px ${FONT}`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(shortName(id).slice(0, 2), x, y + 1);
}

/** A patience bar: green while fresh, red when the ticket is about to walk out. */
function drawPatienceBar(ctx, ticket, x, y, w, urgent) {
  const fraction = patienceFraction(ticket);
  ctx.fillStyle = 'rgba(0,0,0,0.25)';
  roundRect(ctx, x, y, w, 10, 5);
  ctx.fill();
  ctx.fillStyle = fraction > 0.5 ? '#7bc47f' : fraction > 0.25 ? '#f2c94c' : '#e5534b';
  if (fraction > 0) {
    roundRect(ctx, x, y, Math.max(10, w * fraction), 10, 5);
    ctx.fill();
  }
  if (urgent) {
    ctx.fillStyle = '#e5534b';
    ctx.font = `bold 13px ${FONT}`;
    ctx.textAlign = 'right';
    ctx.textBaseline = 'middle';
    ctx.fillText('hurry!', x + w, y - 12);
  }
}

function drawTicket(ctx, ticket, slot, index, isActive, now) {
  const urgent = isUrgent(ticket);
  const pulse = urgent ? 0.75 + 0.25 * Math.sin(now * 6) : 1;
  ctx.save();
  ctx.globalAlpha = pulse;
  ctx.fillStyle = isActive ? PALETTE.ticketActive : PALETTE.ticket;
  roundRect(ctx, slot.x, slot.y, slot.w, slot.h, 10);
  ctx.fill();
  ctx.lineWidth = isActive ? 4 : 2;
  ctx.strokeStyle = isActive ? PALETTE.lantern : 'rgba(0,0,0,0.25)';
  ctx.stroke();
  ctx.restore();
  const dish = ticket.dish;
  ctx.fillStyle = PALETTE.ticketInk;
  ctx.font = `bold 19px ${FONT}`;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'alphabetic';
  ctx.fillText(dish.name, slot.x + 14, slot.y + 28);
  ctx.font = `bold 16px ${FONT}`;
  ctx.fillStyle = '#7a5a2e';
  ctx.textAlign = 'right';
  ctx.fillText(`$${dish.price}`, slot.x + slot.w - 14, slot.y + 28);
  const recipe = [dish.broth, dish.noodle, ...dish.toppings];
  recipe.forEach((id, i) => drawIngredientDot(ctx, id, slot.x + 30 + i * 44, slot.y + 62, 17));
  ctx.fillStyle = '#7a5a2e';
  ctx.font = '13px ' + FONT;
  ctx.textAlign = 'left';
  ctx.fillText(isActive ? 'cooking now' : `ticket ${index + 1}`, slot.x + 14, slot.y + 98);
  drawPatienceBar(ctx, ticket, slot.x + 150, slot.y + 92, slot.w - 164, urgent);
}

function drawEmptySlot(ctx, slot, index) {
  ctx.fillStyle = 'rgba(255,255,255,0.06)';
  roundRect(ctx, slot.x, slot.y, slot.w, slot.h, 10);
  ctx.fill();
  ctx.strokeStyle = 'rgba(255,255,255,0.12)';
  ctx.lineWidth = 2;
  ctx.setLineDash([6, 6]);
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.fillStyle = PALETTE.muted;
  ctx.font = `15px ${FONT}`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('next order coming…', slot.x + slot.w / 2, slot.y + slot.h / 2);
}

function drawStation(ctx, station) {
  ctx.fillStyle = PALETTE.wood;
  roundRect(ctx, station.x, station.y, station.w, station.h, 10);
  ctx.fill();
  ctx.lineWidth = 2;
  ctx.strokeStyle = 'rgba(0,0,0,0.3)';
  ctx.stroke();
  drawIngredientDot(ctx, station.id, station.x + station.w / 2, station.y + 34, 22);
  ctx.fillStyle = PALETTE.text;
  ctx.font = `bold 13px ${FONT}`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'alphabetic';
  ctx.fillText(station.name, station.x + station.w / 2, station.y + 72);
  ctx.fillStyle = PALETTE.muted;
  ctx.font = `11px ${FONT}`;
  ctx.fillText(`key ${station.key.toUpperCase()}`, station.x + station.w / 2, station.y + 86);
}

function drawBowl(ctx, state, ticket, now) {
  const { bowl } = state;
  const ready = bowlMatches(bowl, ticket);
  ctx.save();
  if (ready) {
    ctx.shadowColor = PALETTE.lantern;
    ctx.shadowBlur = 30 + 10 * Math.sin(now * 4);
  }
  ctx.fillStyle = '#3d2c1e';
  ctx.beginPath();
  ctx.ellipse(BOWL.x, BOWL.y + 96, BOWL.r + 26, 22, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
  // The bowl itself.
  ctx.beginPath();
  ctx.arc(BOWL.x, BOWL.y, BOWL.r, 0, Math.PI, false);
  ctx.closePath();
  ctx.fillStyle = '#b8452f';
  ctx.fill();
  ctx.lineWidth = 5;
  ctx.strokeStyle = '#7e2a1c';
  ctx.stroke();
  ctx.beginPath();
  ctx.ellipse(BOWL.x, BOWL.y, BOWL.r, 26, 0, Math.PI, 0, false);
  ctx.closePath();
  ctx.fillStyle = bowl.broth ? INGREDIENT_BY_ID.get(bowl.broth).color : '#e8dcc0';
  ctx.fill();
  // Noodle swirls, in a darker gold so they read on the pale broth.
  if (bowl.noodle) {
    ctx.strokeStyle = '#a67c2e';
    ctx.lineWidth = 5;
    for (let i = 0; i < 3; i += 1) {
      ctx.beginPath();
      ctx.arc(BOWL.x - 40 + i * 40, BOWL.y - 4, 16, Math.PI * 1.1, Math.PI * 1.9);
      ctx.stroke();
    }
  }
  // Toppings, laid out left to right.
  bowl.toppings.forEach((id, i) => {
    drawIngredientDot(ctx, id, BOWL.x - 34 + i * 68, BOWL.y - 26, 20);
  });
  // Steam, rising and curling.
  if (!bowlIsEmpty(bowl)) {
    ctx.strokeStyle = PALETTE.steam;
    ctx.lineWidth = 4;
    ctx.lineCap = 'round';
    for (let i = 0; i < 3; i += 1) {
      const x = BOWL.x - 44 + i * 44;
      const sway = Math.sin(now * 2 + i * 2) * 8;
      ctx.beginPath();
      ctx.moveTo(x, BOWL.y - 34);
      ctx.quadraticCurveTo(x + sway, BOWL.y - 70, x - sway * 0.5, BOWL.y - 104);
      ctx.stroke();
    }
  }
  if (ready) {
    ctx.fillStyle = PALETTE.lantern;
    ctx.font = `bold 20px ${FONT}`;
    ctx.textAlign = 'center';
    ctx.fillText('ready to serve — ring the bell!', BOWL.x, BOWL.y + 150);
  }
}

function drawBell(ctx, ready) {
  ctx.fillStyle = ready ? PALETTE.lantern : '#4a5468';
  roundRect(ctx, BELL.x, BELL.y, BELL.w, BELL.h, 12);
  ctx.fill();
  ctx.lineWidth = 3;
  ctx.strokeStyle = ready ? '#c77f1a' : 'rgba(0,0,0,0.35)';
  ctx.stroke();
  ctx.fillStyle = ready ? '#2e2118' : PALETTE.text;
  ctx.font = `bold 22px ${FONT}`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('🔔  SERVE', BELL.x + BELL.w / 2, BELL.y + BELL.h / 2 - 8);
  ctx.font = `12px ${FONT}`;
  ctx.fillText('Space', BELL.x + BELL.w / 2, BELL.y + BELL.h / 2 + 16);
}

function drawTrash(ctx) {
  ctx.fillStyle = '#4a5468';
  roundRect(ctx, TRASH.x, TRASH.y, TRASH.w, TRASH.h, 12);
  ctx.fill();
  ctx.fillStyle = PALETTE.text;
  ctx.font = `bold 16px ${FONT}`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('🗑  Clear', TRASH.x + TRASH.w / 2, TRASH.y + TRASH.h / 2 - 6);
  ctx.font = `11px ${FONT}`;
  ctx.fillText('Backspace', TRASH.x + TRASH.w / 2, TRASH.y + TRASH.h / 2 + 14);
}

function drawHeader(ctx, world) {
  const state = world.state;
  const left = secondsLeft(world);
  const minutes = Math.floor(left / 60);
  const seconds = Math.floor(left % 60);
  const clock = `${minutes}:${String(seconds).padStart(2, '0')}`;
  ctx.fillStyle = PALETTE.text;
  ctx.font = `bold 26px ${FONT}`;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'alphabetic';
  ctx.fillText('🍜 Midnight Noodle Cart', 40, 40);
  ctx.textAlign = 'center';
  ctx.fillStyle = left < 30 ? PALETTE.danger : PALETTE.text;
  ctx.font = `bold 30px ${FONT}`;
  ctx.fillText(`⏱ ${clock}`, FIELD.width / 2, 42);
  ctx.textAlign = 'right';
  ctx.fillStyle = PALETTE.coin;
  ctx.font = `bold 26px ${FONT}`;
  ctx.fillText(`$${state.coins}`, FIELD.width - 40, 40);
  ctx.fillStyle = state.combo > 1 ? PALETTE.lantern : PALETTE.muted;
  ctx.font = `bold 18px ${FONT}`;
  ctx.fillText(state.combo > 1 ? `combo ×${(1 + Math.min(1, state.combo * 0.1)).toFixed(1)}` : `${state.served} served`, FIELD.width - 40, 66);
}

function drawKitchen(ctx, world, now) {
  const state = world.state;
  // Night sky and the tiled wall behind the counter.
  const sky = ctx.createLinearGradient(0, 0, 0, FIELD.height);
  sky.addColorStop(0, PALETTE.night);
  sky.addColorStop(0.55, PALETTE.nightDeep);
  sky.addColorStop(0.56, '#2a2118');
  sky.addColorStop(1, '#241a12');
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, FIELD.width, FIELD.height);
  // Lanterns, hung in the gaps between the title, the clock and the coins.
  for (const x of [470, 830, 1010]) {
    const sway = Math.sin(now * 0.8 + x) * 3;
    ctx.strokeStyle = '#3a2c1a';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x + sway, 26);
    ctx.stroke();
    ctx.fillStyle = PALETTE.lantern;
    ctx.beginPath();
    ctx.ellipse(x + sway, 42, 18, 20, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = PALETTE.lanternGlow;
    ctx.beginPath();
    ctx.ellipse(x + sway, 42, 10, 14, 0, 0, Math.PI * 2);
    ctx.fill();
  }
  // The wooden counter.
  ctx.fillStyle = PALETTE.counter;
  ctx.fillRect(0, 540, FIELD.width, 180);
  ctx.fillStyle = PALETTE.woodDark;
  ctx.fillRect(0, 540, FIELD.width, 8);
  drawHeader(ctx, world);
  // The order board.
  ctx.fillStyle = PALETTE.board;
  roundRect(ctx, 28, 76, FIELD.width - 56, 136, 12);
  ctx.fill();
  ctx.lineWidth = 2;
  ctx.strokeStyle = PALETTE.boardEdge;
  ctx.stroke();
  ctx.fillStyle = PALETTE.muted;
  ctx.font = `bold 12px ${FONT}`;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'alphabetic';
  ctx.fillText('ORDER BOARD — click a ticket to cook it', 44, 94);
  state.tickets.forEach((ticket, i) => drawTicket(ctx, ticket, TICKETS[i], i, i === state.activeTicket, now));
  for (let i = state.tickets.length; i < 3; i += 1) drawEmptySlot(ctx, TICKETS[i], i);
  // Stations and the bowl.
  ctx.fillStyle = PALETTE.muted;
  ctx.font = `bold 13px ${FONT}`;
  ctx.textAlign = 'left';
  ctx.fillText('BROTHS & NOODLES', 48, 218);
  ctx.fillText('TOPPINGS', 896, 218);
  ctx.fillText('YOUR BOWL', BOWL.x - 52, 218);
  STATIONS.forEach((station) => drawStation(ctx, station));
  const ticket = activeTicket(world);
  drawBowl(ctx, state, ticket, now);
  drawBell(ctx, bowlMatches(state.bowl, ticket));
  drawTrash(ctx);
  ctx.textAlign = 'left';
  ctx.textBaseline = 'alphabetic';
  if (state.lastServe) {
    ctx.fillStyle = PALETTE.good;
    ctx.font = `bold 17px ${FONT}`;
    ctx.fillText(`last serve: ${state.lastServe} +$${state.lastEarned}`, 40, 640);
  }
  ctx.fillStyle = PALETTE.muted;
  ctx.font = `13px ${FONT}`;
  ctx.fillText('click ingredients or press 1–5 / Q W E A S D · Tab switches ticket · Space serves', 40, 668);
}

function drawTitle(ctx, best) {
  ctx.fillStyle = 'rgba(16, 21, 31, 0.72)';
  ctx.fillRect(0, 0, FIELD.width, FIELD.height);
  ctx.textAlign = 'center';
  ctx.fillStyle = PALETTE.lantern;
  ctx.font = `bold 64px ${FONT}`;
  ctx.fillText('🍜 Midnight Noodle Cart', FIELD.width / 2, 220);
  ctx.fillStyle = PALETTE.text;
  ctx.font = `24px ${FONT}`;
  ctx.fillText('Run a late-night noodle cart for one three-minute shift.', FIELD.width / 2, 272);
  ctx.font = `19px ${FONT}`;
  ctx.fillStyle = PALETTE.muted;
  ctx.fillText('Read the ticket. Click the broth, the noodles and two toppings.', FIELD.width / 2, 320);
  ctx.fillText('Ring the bell to serve before the patience bar runs out.', FIELD.width / 2, 348);
  ctx.fillText('Perfect serves build a combo — a wrong ingredient costs patience.', FIELD.width / 2, 376);
  ctx.fillStyle = PALETTE.lantern;
  ctx.font = `bold 26px ${FONT}`;
  ctx.fillText('Click or press Space to open the cart', FIELD.width / 2, 452);
  if (best > 0) {
    ctx.fillStyle = PALETTE.coin;
    ctx.font = `bold 20px ${FONT}`;
    ctx.fillText(`best shift so far: $${best}`, FIELD.width / 2, 500);
  }
}

function drawPaused(ctx) {
  ctx.fillStyle = 'rgba(16, 21, 31, 0.7)';
  ctx.fillRect(0, 0, FIELD.width, FIELD.height);
  ctx.fillStyle = PALETTE.text;
  ctx.font = `bold 48px ${FONT}`;
  ctx.textAlign = 'center';
  ctx.fillText('Paused', FIELD.width / 2, FIELD.height / 2 - 10);
  ctx.font = `20px ${FONT}`;
  ctx.fillStyle = PALETTE.muted;
  ctx.fillText('press P or Space to keep cooking', FIELD.width / 2, FIELD.height / 2 + 32);
}

function drawOver(ctx, world, best) {
  const state = world.state;
  ctx.fillStyle = 'rgba(16, 21, 31, 0.82)';
  ctx.fillRect(0, 0, FIELD.width, FIELD.height);
  ctx.textAlign = 'center';
  ctx.fillStyle = PALETTE.lantern;
  ctx.font = `bold 52px ${FONT}`;
  ctx.fillText('Shift over — the cart closes', FIELD.width / 2, 190);
  ctx.fillStyle = PALETTE.coin;
  ctx.font = `bold 44px ${FONT}`;
  ctx.fillText(`$${state.coins} earned`, FIELD.width / 2, 258);
  const stars = STAR_COINS.filter((bar) => state.coins >= bar).length;
  ctx.font = '44px ' + FONT;
  ctx.fillText('★'.repeat(stars) + '☆'.repeat(3 - stars), FIELD.width / 2, 318);
  ctx.fillStyle = PALETTE.text;
  ctx.font = `21px ${FONT}`;
  ctx.fillText(`${state.served} dishes served · ${state.perfectServes} perfect · best combo ×${state.bestCombo} · ${state.mistakes} mistakes`, FIELD.width / 2, 372);
  if (state.coins > best) {
    ctx.fillStyle = PALETTE.good;
    ctx.font = `bold 22px ${FONT}`;
    ctx.fillText('a new best shift!', FIELD.width / 2, 414);
  } else if (best > 0) {
    ctx.fillStyle = PALETTE.muted;
    ctx.font = `20px ${FONT}`;
    ctx.fillText(`best shift: $${best}`, FIELD.width / 2, 414);
  }
  ctx.fillStyle = PALETTE.lantern;
  ctx.font = `bold 24px ${FONT}`;
  ctx.fillText('press Space to open the cart again', FIELD.width / 2, 480);
}

/** Make a renderer for the canvas; it scales the 1280x720 field to the window. */
export function createRenderer(canvas) {
  const ctx = canvas.getContext('2d');
  function resize() {
    const scale = Math.min(window.innerWidth / FIELD.width, window.innerHeight / FIELD.height);
    canvas.width = Math.round(FIELD.width * scale);
    canvas.height = Math.round(FIELD.height * scale);
    canvas.style.width = `${canvas.width}px`;
    canvas.style.height = `${canvas.height}px`;
  }
  window.addEventListener('resize', resize);
  resize();
  return {
    /** Paint the world on the given screen; `now` is seconds since the page loaded. */
    draw(world, screen, best, now) {
      const scale = canvas.width / FIELD.width;
      ctx.setTransform(scale, 0, 0, scale, 0, 0);
      drawKitchen(ctx, world, now);
      if (screen === SCREEN_TITLE) drawTitle(ctx, best);
      else if (screen === SCREEN_PAUSED) drawPaused(ctx);
      else if (screen === SCREEN_OVER) drawOver(ctx, world, best);
    },
  };
}
