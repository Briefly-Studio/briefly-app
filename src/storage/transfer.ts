import type { Card } from "../models/card";
import type { Deck } from "../models/deck";
import { buildExportPayload, validatePayload } from "../domain/deckTransfer";
import { getCards, setCards } from "./cards";
import { getDeckById, addDeck } from "./decks";
import { getSessionsForDeck } from "./sessions";

export async function exportDeckToJson(deckId: string): Promise<string> {
  const deck = await getDeckById(deckId);
  if (!deck) {
    throw new Error("Deck not found");
  }

  const cards = await getCards(deckId);
  const sessions = await getSessionsForDeck(deckId);

  const payload = buildExportPayload(deck, cards);
  return JSON.stringify({ ...payload, sessions }, null, 2);
}

export async function importDeckFromJson(raw: string): Promise<{ newDeckId: string }> {
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new Error("Invalid export data");
  }

  if (!validatePayload(parsed)) {
    throw new Error("Invalid export data");
  }

  const payload = parsed;
  const newDeckId = String(Date.now());

  const deck: Deck = {
    id: newDeckId,
    title: payload.deck.title,
    createdAt: new Date().toISOString(),
  };

  await addDeck(deck);

  const timestamp = Date.now();
  const newCards: Card[] = payload.cards.map((card, index) => ({
    id: `${timestamp}_${index}`,
    deckId: newDeckId,
    front: card.front,
    back: card.back,
    createdAt: card.createdAt,
    difficulty: card.difficulty ?? "medium",
  }));

  await setCards(newDeckId, newCards);

  return { newDeckId };
}
