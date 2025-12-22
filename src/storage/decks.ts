import AsyncStorage from "@react-native-async-storage/async-storage";
import type { Deck } from "../models/deck";
import { DECKS_KEY, cardsKeyForDeck } from "./keys";
import { deleteSessionsForDeck } from "./sessions";

export async function getDecks(): Promise<Deck[]> {
  try {
    const raw = await AsyncStorage.getItem(DECKS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as Deck[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export async function setDecks(decks: Deck[]) {
  await AsyncStorage.setItem(DECKS_KEY, JSON.stringify(decks));
}

export async function addDeck(deck: Deck): Promise<Deck[]> {
  const decks = await getDecks();
  const updated = [deck, ...decks];
  await setDecks(updated);
  return updated;
}

export async function getDeckById(id: string): Promise<Deck | null> {
  const decks = await getDecks();
  return decks.find((d) => d.id === id) ?? null;
}

export async function deleteDeckById(id: string): Promise<Deck[]> {
  const decks = await getDecks();
  const updated = decks.filter((d) => d.id !== id);
  await setDecks(updated);

  // cascade delete (same key function used everywhere)
  try {
    await AsyncStorage.removeItem(cardsKeyForDeck(id));
  } catch {
    // ignore
  }

  // 3) cascade delete sessions for this deck
  try {
    await deleteSessionsForDeck(id);
  } catch {
    // ignore (best-effort)
  }

  return updated;
}
