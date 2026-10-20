/** Ring maths for the hero work deck, shared by the server render and src/scripts/work-deck.ts. */

/** How many cards stand on each side of the active one. Any card beyond waits out of sight at the end of the arc. */
export const deckReach = (count: number): number => Math.min(2, Math.floor((count - 1) / 2));

/** A card's place relative to the active card: 0 is the pedestal, negative is left, positive is right. */
export function deckOffset(index: number, active: number, count: number): number {
  const offset = ((index - active) % count + count) % count;
  return offset > count / 2 ? offset - count : offset;
}
