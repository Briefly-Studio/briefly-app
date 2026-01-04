import AsyncStorage from "@react-native-async-storage/async-storage";
import type { Card, Difficulty } from "../models/card";
import { cardsKeyForDeck } from "./keys";

const DEFAULT_DIFFICULTY: Difficulty = "medium";

const normalizeCard = (card: Card): Card => ({
  ...card,
  difficulty: card.difficulty ?? DEFAULT_DIFFICULTY,
});

export async function getCards(deckId: string): Promise<Card[]> {
  if (!deckId) return [];
  try {
    const raw = await AsyncStorage.getItem(cardsKeyForDeck(deckId));
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed)
      ? (parsed as Card[]).map((card) => normalizeCard(card))
      : [];
  } catch {
    return [];
  }
}

export async function setCards(deckId: string, cards: Card[]): Promise<void> {
  if (!deckId) return;
  const normalized = cards.map((card) => normalizeCard(card));
  await AsyncStorage.setItem(cardsKeyForDeck(deckId), JSON.stringify(normalized));
}

export async function addCard(deckId: string, card: Card): Promise<Card[]> {
  const existing = await getCards(deckId);
  const updated = [normalizeCard(card), ...existing];
  await setCards(deckId, updated);
  return updated;
}

export async function deleteCard(deckId: string, cardId: string): Promise<Card[]> {
  const existing = await getCards(deckId);
  const updated = existing.filter((c) => c.id !== cardId);
  await setCards(deckId, updated);
  return updated;
}

export async function updateCard(deckId: string, updatedCard: Card): Promise<Card[]> {
  const cards = await getCards(deckId);
  const updated = cards.map((c) => (c.id === updatedCard.id ? updatedCard : c));
  await setCards(deckId, updated);
  return updated;
}

export async function updateAllCardsDifficulty(
  deckId: string,
  difficulty: Card["difficulty"]
): Promise<Card[]> {
  const cards = await getCards(deckId);
  const updated = cards.map((card) => ({ ...card, difficulty }));
  await setCards(deckId, updated);
  return updated;
}

/** Used when a deck is deleted (cascade delete its cards). */
export async function deleteCardsForDeck(deckId: string): Promise<void> {
  if (!deckId) return;
  try {
    await AsyncStorage.removeItem(cardsKeyForDeck(deckId));
  } catch {
    // ignore
  }
}
