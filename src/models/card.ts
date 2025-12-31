export type Difficulty = "easy" | "medium" | "hard";

export type Card = {
  id: string;
  deckId: string;
  front: string;
  back: string;
  difficulty: Difficulty;
  createdAt: number;
};
