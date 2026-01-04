import type { Card } from "../models/card";

export type Difficulty = "easy" | "medium" | "hard";

const shuffleInPlace = <T,>(arr: T[]): void => {
  for (let i = arr.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
};

export function smartShuffle(cards: Card[], _seed?: number): Card[] {
  if (cards.length === 0) return [];

  const hard: Card[] = [];
  const medium: Card[] = [];
  const easy: Card[] = [];

  for (const card of cards) {
    const difficulty = (card.difficulty ?? "medium") as Difficulty;
    if (difficulty === "hard") {
      hard.push(card);
    } else if (difficulty === "easy") {
      easy.push(card);
    } else {
      medium.push(card);
    }
  }

  shuffleInPlace(hard);
  shuffleInPlace(medium);
  shuffleInPlace(easy);

  return [...hard, ...medium, ...easy];
}
