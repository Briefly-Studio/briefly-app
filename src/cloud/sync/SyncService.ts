import type { CardRecord } from "../../models/card";
import type { DeckRecord } from "../../models/deck";
import type { Change, PullResponse, PushResponse } from "./types";

import { getCursor, getOrCreateDeviceId, setCursor } from "./meta";

import { getCardsAll, setCards } from "../../storage/cards";
import { getDecksAll, setDecks } from "../../storage/decks";

const SYNC_BASE_URL = "https://4oge9e46jf.execute-api.us-east-2.amazonaws.com/prod";

async function applyRemoteChanges(changes: Change[]): Promise<void> {
  if (changes.length === 0) return;

  const deckChanges = changes.filter((c) => c.entity === "deck");
  const cardChanges = changes.filter((c) => c.entity === "card");

  // Apply decks
  if (deckChanges.length) {
    const decks = await getDecksAll();
    const byId = new Map(decks.map((d) => [d.id, d]));

    for (const ch of deckChanges) {
      const incoming = ch.record as DeckRecord;

      if (ch.op === "delete") {
        const existing = byId.get(ch.id);
        if (existing) byId.set(ch.id, { ...existing, deletedAt: (incoming as any).deletedAt ?? ch.ts });
        continue;
      }

      byId.set(ch.id, { ...incoming, dirty: false });
    }

    await setDecks(Array.from(byId.values()));
  }

  // Apply cards (group by deckId)
  if (cardChanges.length) {
    const byDeckId = new Map<string, Change[]>();

    for (const ch of cardChanges) {
      const incoming = ch.record as CardRecord;
      const deckId = (incoming as any).deckId;
      if (!deckId) continue;
      if (!byDeckId.has(deckId)) byDeckId.set(deckId, []);
      byDeckId.get(deckId)!.push(ch);
    }

    for (const [deckId, deckCardChanges] of byDeckId.entries()) {
      const cards = await getCardsAll(deckId);
      const byId = new Map(cards.map((c) => [c.id, c]));

      for (const ch of deckCardChanges) {
        const incoming = ch.record as CardRecord;

        if (ch.op === "delete") {
          const existing = byId.get(ch.id);
          if (existing) byId.set(ch.id, { ...existing, deletedAt: (incoming as any).deletedAt ?? ch.ts });
          continue;
        }

        byId.set(ch.id, { ...incoming, dirty: false });
      }

      await setCards(deckId, Array.from(byId.values()));
    }
  }
}

export const SyncService = {
  // keep your existing collectDirty + markClean if they already exist
  async collectDirty(): Promise<Change[]> {
    const changes: Change[] = [];

    const decks = await getDecksAll();
    for (const deck of decks) {
      if (!deck.dirty) continue;
      changes.push({
        id: deck.id,
        entity: "deck",
        op: deck.deletedAt ? "delete" : "upsert",
        record: deck,
        ts: deck.updatedAt,
      });
    }

    for (const deck of decks) {
      const cards = await getCardsAll(deck.id);
      for (const card of cards) {
        if (!card.dirty) continue;
        changes.push({
          id: card.id,
          entity: "card",
          op: card.deletedAt ? "delete" : "upsert",
          record: card,
          ts: card.updatedAt,
        });
      }
    }

    return changes;
  },

  async markClean(entity: "deck" | "card", ids: string[]): Promise<void> {
    // <-- keep your existing implementation here
  },

  async syncOnce(): Promise<void> {
    const deviceId = await getOrCreateDeviceId();

    // 1) PUSH
    const dirty = await this.collectDirty();
    if (dirty.length) {
      const pushRes = await fetch(`${SYNC_BASE_URL}/sync/push`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ deviceId, changes: dirty }),
      });

      if (!pushRes.ok) throw new Error(`push failed: ${pushRes.status}`);

      const pushJson = (await pushRes.json()) as PushResponse;

      const acceptedSet = new Set(pushJson.accepted);

      const acceptedDecks = dirty
        .filter((c) => c.entity === "deck" && acceptedSet.has(c.id))
        .map((c) => c.id);

      const acceptedCards = dirty
        .filter((c) => c.entity === "card" && acceptedSet.has(c.id))
        .map((c) => c.id);

      await this.markClean("deck", acceptedDecks);
      await this.markClean("card", acceptedCards);
    }

    // 2) PULL
    const cursor = await getCursor();

    const url = new URL(`${SYNC_BASE_URL}/sync/pull`);
    url.searchParams.set("deviceId", deviceId);
    url.searchParams.set("limit", "200");
    if (cursor) url.searchParams.set("cursor", cursor);

    const pullRes = await fetch(url.toString());
    if (!pullRes.ok) throw new Error(`pull failed: ${pullRes.status}`);

    const pullJson = (await pullRes.json()) as PullResponse;

    // 3) apply + 4) persist cursor
    await applyRemoteChanges(pullJson.changes);
    if (pullJson.cursor) await setCursor(pullJson.cursor);
  },
};
