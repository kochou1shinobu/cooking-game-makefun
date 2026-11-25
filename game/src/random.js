// A tiny seeded random source (mulberry32) so a screenshot scene and a playtest with the
// same seed always deal the same orders.

/** Make a random function from a 32-bit seed; every call returns a number in [0, 1). */
export function createRandom(seed) {
  let state = seed >>> 0;
  return function next() {
    state = (state + 0x6d2b79f5) | 0;
    let value = Math.imul(state ^ (state >>> 15), 1 | state);
    value = (value + Math.imul(value ^ (value >>> 7), 61 | value)) ^ value;
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  };
}

/** Pick one entry of `list` with the given random function. */
export function pick(random, list) {
  return list[Math.floor(random() * list.length)];
}
