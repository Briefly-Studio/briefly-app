
import AsyncStorage from "@react-native-async-storage/async-storage";
import type { Deck } from "../models/deck";

const STORAGE_KEY = "briefly.decks.v1";

export async function getDecks(): Promise<Deck[]> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as Deck[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export async function setDecks(decks: Deck[]) {
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(decks));
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
