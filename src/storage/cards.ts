import AsyncStorage from "@react-native-async-storage/async-storage";
import type { CardRecord } from "../models/card";
import { upgradeCard } from "../models/card";
import { cardsKeyForDeck } from "./keys";

export async function getCardsAll(deckId: string): Promise<CardRecord[]> {
  if (!deckId) return [];
  try {
    const raw = await AsyncStorage.getItem(cardsKeyForDeck(deckId));
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    const upgraded = parsed.map((card) => upgradeCard(card));
    try {
      await setCards(deckId, upgraded);
    } catch {
      // ignore
    }
    return upgraded;
  } catch {
    return [];
  }
}

export async function getCards(deckId: string): Promise<CardRecord[]> {
  const cards = await getCardsAll(deckId);
  return cards.filter((card) => !card.deletedAt);
}

export async function setCards(deckId: string, cards: CardRecord[]): Promise<void> {
  if (!deckId) return;
  await AsyncStorage.setItem(cardsKeyForDeck(deckId), JSON.stringify(cards));
}

export async function addCard(deckId: string, card: CardRecord): Promise<CardRecord[]> {
  const existing = await getCardsAll(deckId);
  const now = new Date().toISOString();
  const updated = [
    { ...upgradeCard(card), updatedAt: now, dirty: true, deletedAt: undefined },
    ...existing,
  ];
  await setCards(deckId, updated);
  return updated;
}

export async function deleteCard(deckId: string, cardId: string): Promise<CardRecord[]> {
  const existing = await getCardsAll(deckId);
  const now = new Date().toISOString();
  const updated = existing.map((card) => {
    if (card.id !== cardId) return card;
    if (card.deletedAt) return card;
    return {
      ...card,
      deletedAt: now,
      updatedAt: now,
      rev: card.rev + 1,
      dirty: true,
    };
  });
  await setCards(deckId, updated);
  return updated;
}

export async function updateCard(
  deckId: string,
  updatedCard: CardRecord
): Promise<CardRecord[]> {
  const cards = await getCardsAll(deckId);
  const now = new Date().toISOString();
  const updated = cards.map((c) =>
    c.id === updatedCard.id
      ? { ...upgradeCard(updatedCard), updatedAt: now, dirty: true, deletedAt: undefined }
      : c
  );
  await setCards(deckId, updated);
  return updated;
}

export async function updateAllCardsDifficulty(
  deckId: string,
  difficulty: CardRecord["difficulty"]
): Promise<CardRecord[]> {
  const cards = await getCardsAll(deckId);
  const now = new Date().toISOString();
  const updated = cards.map((card) =>
    card.deletedAt
      ? card
      : {
          ...card,
          difficulty,
          updatedAt: now,
          dirty: true,
          deletedAt: undefined,
        }
  );
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
