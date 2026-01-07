import type { Change, EntityType } from "./types";
import type { CardRecord } from "../../models/card";
import type { DeckRecord } from "../../models/deck";
import type { StudySession } from "../../models/session";
import { getCards, setCards } from "../../storage/cards";
import { getDecks, setDecks } from "../../storage/decks";
import { getSessions } from "../../storage/sessions";

class SyncServiceImpl {
  async init(): Promise<void> {}

  async collectDirty(): Promise<Change[]> {
    const changes: Change[] = [];

    const decks = await getDecks();
    for (const deck of decks) {
      if (!deck.dirty) continue;
      changes.push({
        id: deck.id,
        entity: "deck",
        op: deck.deletedAt ? "delete" : "upsert",
        record: deck as DeckRecord,
        ts: deck.updatedAt,
      });
    }

    for (const deck of decks) {
      const cards = await getCards(deck.id);
      for (const card of cards) {
        if (!card.dirty) continue;
        changes.push({
          id: card.id,
          entity: "card",
          op: card.deletedAt ? "delete" : "upsert",
          record: card as CardRecord,
          ts: card.updatedAt,
        });
      }
    }

    const sessions = await getSessions();
    for (const session of sessions) {
      const record = session as StudySession & {
        dirty?: boolean;
        deletedAt?: string;
        updatedAt?: string;
      };
      if (!record.dirty) continue;
      changes.push({
        id: record.id,
        entity: "session" as EntityType,
        op: record.deletedAt ? "delete" : "upsert",
        record: record as unknown as DeckRecord,
        ts: record.updatedAt ?? new Date().toISOString(),
      });
    }

    return changes;
  }

  async markClean(entity: "deck" | "card", ids: string[]): Promise<void> {
    if (ids.length === 0) return;
    const now = new Date().toISOString();
    const idSet = new Set(ids);

    if (entity === "deck") {
      const decks = await getDecks();
      const updated = decks.map((deck) =>
        idSet.has(deck.id) ? { ...deck, dirty: false, lastSyncedAt: now } : deck
      );
      await setDecks(updated);
      return;
    }

    const decks = await getDecks();
    for (const deck of decks) {
      const cards = await getCards(deck.id);
      const updated = cards.map((card) =>
        idSet.has(card.id) ? { ...card, dirty: false, lastSyncedAt: now } : card
      );
      await setCards(deck.id, updated);
    }
  }

  async syncOnce(): Promise<void> {
    const changes = await this.collectDirty();
    void changes;
  }
}

export const SyncService = new SyncServiceImpl();
