export type Difficulty = "easy" | "medium" | "hard";

export type Card = {
  id: string;
  deckId: string;
  front: string;
  back: string;
  difficulty: Difficulty;
  createdAt: number;
};

export type CardRecord = Card & {
  rev: number;
  updatedAt: string;
  deletedAt?: string;
  dirty?: boolean;
  lastSyncedAt?: string;
};

const isIsoString = (value: unknown) =>
  typeof value === "string" && /^\d{4}-\d{2}-\d{2}T/.test(value);

export function upgradeCard(c: any): CardRecord {
  if (c && typeof c.rev === "number" && typeof c.updatedAt === "string") {
    return { ...c, dirty: c.dirty ?? false };
  }

  const updatedAt =
    isIsoString(c?.createdAt) ? c.createdAt : new Date().toISOString();

  return {
    id: typeof c?.id === "string" ? c.id : "",
    deckId: typeof c?.deckId === "string" ? c.deckId : "",
    front: typeof c?.front === "string" ? c.front : "",
    back: typeof c?.back === "string" ? c.back : "",
    difficulty:
      c?.difficulty === "easy" || c?.difficulty === "medium" || c?.difficulty === "hard"
        ? c.difficulty
        : "medium",
    createdAt: typeof c?.createdAt === "number" ? c.createdAt : Date.now(),
    rev: 0,
    updatedAt,
    dirty: false,
  };
}
