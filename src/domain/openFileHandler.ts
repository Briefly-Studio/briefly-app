import * as FileSystem from "expo-file-system/legacy";

import type { Card } from "../models/card";
import type { Deck } from "../models/deck";
import { makeId } from "../models/deck";
import { setCards } from "../storage/cards";
import { addDeck, getDecks } from "../storage/decks";
import { validatePayload } from "./deckTransfer";

export async function handleIncomingFile(uri: string): Promise<string> {
  let raw: string;
  try {
    raw = await FileSystem.readAsStringAsync(uri, {
      encoding: FileSystem.EncodingType.UTF8,
    });
  } catch {
    throw new Error("Unable to read the file.");
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new Error("This file is not a valid Briefly deck.");
  }

  if (!validatePayload(parsed)) {
    throw new Error("This file is not a valid Briefly deck.");
  }

  const payload = parsed;
  const existing = await getDecks();
  const baseTitle = payload.deck.title;
  const titleTaken = existing.some((deck) => deck.title === baseTitle);
  const title = titleTaken ? `${baseTitle} (Imported)` : baseTitle;
  const finalTitle =
    existing.some((deck) => deck.title === title) ? `${title} ${Date.now()}` : title;

  const newDeckId = makeId();
  const newDeck: Deck = {
    id: newDeckId,
    title: finalTitle,
    createdAt: new Date().toISOString(),
  };

  await addDeck(newDeck);

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

  return newDeckId;
}
