import type { Card, Difficulty } from "../models/card";
import type { Deck } from "../models/deck";
import { makeId } from "../models/deck";
import { getCards, setCards } from "../storage/cards";
import { addDeck, getDeckById } from "../storage/decks";

type ExportCard = {
  front: string;
  back: string;
  difficulty: Difficulty;
  createdAt: number;
};

type ExportPayload = {
  version: 1;
  deck: { title: string; createdAt: string };
  cards: ExportCard[];
};

const DEFAULT_DIFFICULTY: Difficulty = "medium";

export async function exportDeckToJson(deckId: string): Promise<string> {
  if (!deckId) {
    throw new Error("Deck id is required.");
  }

  const deck = await getDeckById(deckId);
  if (!deck) {
    throw new Error("Deck not found.");
  }

  const cards = await getCards(deckId);
  const payload: ExportPayload = {
    version: 1,
    deck: { title: deck.title, createdAt: deck.createdAt },
    cards: cards.map((card) => ({
      front: card.front,
      back: card.back,
      difficulty: card.difficulty ?? DEFAULT_DIFFICULTY,
      createdAt: card.createdAt,
    })),
  };

  return JSON.stringify(payload);
}

export async function importDeckFromJson(payload: string): Promise<string> {
  let data: unknown;
  try {
    data = JSON.parse(payload);
  } catch {
    throw new Error("Invalid JSON payload.");
  }

  if (!data || typeof data !== "object") {
    throw new Error("Invalid payload structure.");
  }

  const parsed = data as {
    version?: number;
    deck?: { title?: unknown; createdAt?: unknown };
    cards?: Array<{
      front?: unknown;
      back?: unknown;
      difficulty?: unknown;
      createdAt?: unknown;
    }>;
  };

  if (parsed.version !== 1) {
    throw new Error("Unsupported payload version.");
  }

  const title = parsed.deck?.title;
  const createdAt = parsed.deck?.createdAt;
  if (
    typeof title !== "string" ||
    (typeof createdAt !== "string" && typeof createdAt !== "number")
  ) {
    throw new Error("Deck metadata is missing or invalid.");
  }

  if (!Array.isArray(parsed.cards)) {
    throw new Error("Cards list is missing or invalid.");
  }

  const deckId = makeId();
  const createdAtIso =
    typeof createdAt === "number" ? new Date(createdAt).toISOString() : createdAt;
  const newDeck: Deck = { id: deckId, title, createdAt: createdAtIso };
  await addDeck(newDeck);

  const newCards: Card[] = parsed.cards.map((card) => {
    if (typeof card.front !== "string" || typeof card.back !== "string") {
      throw new Error("Card data is missing or invalid.");
    }

    const difficulty =
      card.difficulty === "easy" || card.difficulty === "medium" || card.difficulty === "hard"
        ? card.difficulty
        : DEFAULT_DIFFICULTY;

    const createdAtValue =
      typeof card.createdAt === "number" ? card.createdAt : Date.now();

    return {
      id: makeId(),
      deckId,
      front: card.front,
      back: card.back,
      difficulty,
      createdAt: createdAtValue,
    };
  });

  await setCards(deckId, newCards);
  return deckId;
}
