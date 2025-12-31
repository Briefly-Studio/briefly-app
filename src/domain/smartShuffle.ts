import type { Card, Difficulty } from "../models/card";

const WEIGHTS: Record<Difficulty, number> = {
  easy: 1,
  medium: 2,
  hard: 4,
};

export function smartShuffle(cards: Card[]): Card[] {
  return cards
    .map((card) => {
      const difficulty = card.difficulty ?? "medium";
      const weight = WEIGHTS[difficulty];
      const key = Math.random() ** (1 / weight);
      return { card, key };
    })
    .sort((a, b) => b.key - a.key)
    .map(({ card }) => card);
}
