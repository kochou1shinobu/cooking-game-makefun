// The assembly bowl: what has gone into it, and whether it is the dish the active ticket
// asks for. A bowl holds one broth, one noodle and up to two toppings.

/** An empty bowl, waiting for its first ingredient. */
export function createBowl() {
  return { broth: null, noodle: null, toppings: [] };
}

/**
 * Add one ingredient to the bowl. Returns 'added', 'full' (a broth or noodle is already
 * in, or two toppings are), or 'wrong' (the ingredient is not in the ticket's recipe).
 */
export function addToBowl(bowl, kind, id, ticket) {
  const dish = ticket ? ticket.dish : null;
  if (kind === 'broth') {
    if (bowl.broth) return 'full';
    if (dish && dish.broth !== id) return 'wrong';
    bowl.broth = id;
    return 'added';
  }
  if (kind === 'noodle') {
    if (bowl.noodle) return 'full';
    if (dish && dish.noodle !== id) return 'wrong';
    bowl.noodle = id;
    return 'added';
  }
  if (bowl.toppings.length >= 2) return 'full';
  if (bowl.toppings.includes(id)) return 'full';
  if (dish && !dish.toppings.includes(id)) return 'wrong';
  bowl.toppings.push(id);
  return 'added';
}

/** Whether the bowl is exactly the dish the ticket asks for, ready to serve. */
export function bowlMatches(bowl, ticket) {
  if (!ticket) return false;
  const dish = ticket.dish;
  if (bowl.broth !== dish.broth || bowl.noodle !== dish.noodle) return false;
  if (bowl.toppings.length !== dish.toppings.length) return false;
  return dish.toppings.every((topping) => bowl.toppings.includes(topping));
}

/** Whether anything is in the bowl at all. */
export function bowlIsEmpty(bowl) {
  return !bowl.broth && !bowl.noodle && bowl.toppings.length === 0;
}

/** Tip the bowl out and start again. */
export function clearBowl(bowl) {
  bowl.broth = null;
  bowl.noodle = null;
  bowl.toppings = [];
}
