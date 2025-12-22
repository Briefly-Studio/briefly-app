import AsyncStorage from "@react-native-async-storage/async-storage";
import type { Card } from "../models/card";
import { cardsKeyForDeck } from "./keys";

export async function getCards(deckId: string): Promise<Card[]> {
  if (!deckId) return [];
  try {
    const raw = await AsyncStorage.getItem(cardsKeyForDeck(deckId));
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as Card[]) : [];
  } catch {
    return [];
  }
}

export async function setCards(deckId: string, cards: Card[]): Promise<void> {
  if (!deckId) return;
  await AsyncStorage.setItem(cardsKeyForDeck(deckId), JSON.stringify(cards));
}

export async function addCard(deckId: string, card: Card): Promise<Card[]> {
  const existing = await getCards(deckId);
  const updated = [card, ...existing];
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

/** Used when a deck is deleted (cascade delete its cards). */
export async function deleteCardsForDeck(deckId: string): Promise<void> {
  if (!deckId) return;
  try {
    await AsyncStorage.removeItem(cardsKeyForDeck(deckId));
  } catch {
    // ignore
  }
}
