import AsyncStorage from "@react-native-async-storage/async-storage";
import type { DeckRecord } from "../models/deck";
import { upgradeDeck } from "../models/deck";
import { getCardsAll, setCards } from "./cards";
import { DECKS_KEY } from "./keys";
import { deleteSessionsForDeck } from "./sessions";

export async function getDecksAll(): Promise<DeckRecord[]> {
  try {
    const raw = await AsyncStorage.getItem(DECKS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    const upgraded = parsed.map((deck) => upgradeDeck(deck));
    try {
      await setDecks(upgraded);
    } catch {
      // ignore
    }
    return upgraded;
  } catch {
    return [];
  }
}

export async function getDecks(): Promise<DeckRecord[]> {
  const decks = await getDecksAll();
  return decks.filter((deck) => !deck.deletedAt);
}

export async function setDecks(decks: DeckRecord[]) {
  await AsyncStorage.setItem(DECKS_KEY, JSON.stringify(decks));
}

export async function addDeck(deck: DeckRecord): Promise<DeckRecord[]> {
  const decks = await getDecksAll();
  const now = new Date().toISOString();
  const updated = [
    { ...deck, updatedAt: now, dirty: true, deletedAt: undefined },
    ...decks,
  ];
  await setDecks(updated);
  return updated;
}

export async function getDeckById(id: string): Promise<DeckRecord | null> {
  const decks = await getDecks();
  return decks.find((d) => d.id === id) ?? null;
}

export async function deleteDeckById(id: string): Promise<DeckRecord[]> {
  const decks = await getDecksAll();
  const now = new Date().toISOString();
  const updated = decks.map((deck) => {
    if (deck.id !== id) return deck;
    if (deck.deletedAt) return deck;
    return {
      ...deck,
      deletedAt: now,
      updatedAt: now,
      rev: deck.rev + 1,
      dirty: true,
    };
  });
  await setDecks(updated);

  const cards = await getCardsAll(id);
  // TEMP DEBUG
  console.log("[deleteDeck] cards before:", cards.length);
  const updatedCards = cards.map((card) => {
    if (card.deletedAt) return card;
    return {
      ...card,
      deletedAt: now,
      updatedAt: now,
      rev: card.rev + 1,
      dirty: true,
    };
  });
  // TEMP DEBUG
  console.log(
    "[deleteDeck] cards tombstoned:",
    updatedCards.filter((c) => c.deletedAt).length
  );
  await setCards(id, updatedCards);

  // 3) cascade delete sessions for this deck
  try {
    await deleteSessionsForDeck(id);
  } catch {
    // ignore (best-effort)
  }

  return updated;
}
