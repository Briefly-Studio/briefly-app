import type { CardRecord } from "../../models/card";
import type { DeckRecord } from "../../models/deck";
import type { SessionRecord } from "../../models/session";
import type { Change, EntityType } from "./types";

import { getCardsAll, setCards } from "../../storage/cards";
import { getDecksAll, setDecks } from "../../storage/decks";
import { getDeviceId } from "../../storage/device";
import { getSessions, setSessions } from "../../storage/sessions";
import { getSyncCursor, setSyncCursor } from "../../storage/sync";
import { pullChanges, pushChanges } from "./http";

const toTime = (value: string | undefined) => {
  const t = value ? Date.parse(value) : NaN;
  return Number.isFinite(t) ? t : 0;
};

async function applyChanges(changes: Change[]): Promise<void> {
  if (changes.length === 0) return;

  const now = new Date().toISOString();
  const ordered = [...changes].sort((a, b) => toTime(a.ts) - toTime(b.ts));

  const deckChanges = ordered.filter((c) => c.entity === "deck");
  const cardChanges = ordered.filter((c) => c.entity === "card");
  const sessionChanges = ordered.filter((c) => c.entity === "session");

  if (deckChanges.length) {
    const decks = await getDecksAll();
    const byId = new Map(decks.map((d) => [d.id, d]));

    for (const ch of deckChanges) {
      const incoming = ch.record as DeckRecord;
      const existing = byId.get(ch.id);
      if (existing && toTime(existing.updatedAt) >= toTime(ch.ts)) continue;

      if (ch.op === "delete") {
        const deletedAt = incoming.deletedAt ?? ch.ts;
        byId.set(ch.id, {
          ...incoming,
          deletedAt,
          updatedAt: ch.ts,
          dirty: false,
          lastSyncedAt: now,
        });
        continue;
      }

      byId.set(ch.id, {
        ...incoming,
        deletedAt: undefined,
        dirty: false,
        lastSyncedAt: now,
      });
    }

    await setDecks(Array.from(byId.values()));
  }

  if (cardChanges.length) {
    const byDeckId = new Map<string, Change[]>();
    for (const ch of cardChanges) {
      const incoming = ch.record as CardRecord;
      if (!incoming.deckId) continue;
      if (!byDeckId.has(incoming.deckId)) byDeckId.set(incoming.deckId, []);
      byDeckId.get(incoming.deckId)!.push(ch);
    }

    for (const [deckId, deckCardChanges] of byDeckId.entries()) {
      const cards = await getCardsAll(deckId);
      const byId = new Map(cards.map((c) => [c.id, c]));

      for (const ch of deckCardChanges) {
        const incoming = ch.record as CardRecord;
        const existing = byId.get(ch.id);
        if (existing && toTime(existing.updatedAt) >= toTime(ch.ts)) continue;

        if (ch.op === "delete") {
          const deletedAt = incoming.deletedAt ?? ch.ts;
          byId.set(ch.id, {
            ...incoming,
            deletedAt,
            updatedAt: ch.ts,
            dirty: false,
            lastSyncedAt: now,
          });
          continue;
        }

        byId.set(ch.id, {
          ...incoming,
          deletedAt: undefined,
          dirty: false,
          lastSyncedAt: now,
        });
      }

      await setCards(deckId, Array.from(byId.values()));
    }
  }

  if (sessionChanges.length) {
    const sessions = await getSessions();
    const byId = new Map(sessions.map((s) => [s.id, s]));

    for (const ch of sessionChanges) {
      const incoming = ch.record as SessionRecord;
      const existing = byId.get(ch.id);
      if (existing && toTime(existing.updatedAt) >= toTime(ch.ts)) continue;

      if (ch.op === "delete") {
        const deletedAt = incoming.deletedAt ?? ch.ts;
        byId.set(ch.id, {
          ...incoming,
          deletedAt,
          updatedAt: ch.ts,
          dirty: false,
          lastSyncedAt: now,
        });
        continue;
      }

      byId.set(ch.id, {
        ...incoming,
        deletedAt: undefined,
        dirty: false,
        lastSyncedAt: now,
      });
    }

    await setSessions(Array.from(byId.values()));
  }
}

export const SyncService = {
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

    const sessions = await getSessions();
    for (const session of sessions) {
      if (!session.dirty) continue;
      changes.push({
        id: session.id,
        entity: "session",
        op: session.deletedAt ? "delete" : "upsert",
        record: session,
        ts: session.updatedAt,
      });
    }

    return changes;
  },

  async markClean(entity: EntityType, ids: string[]): Promise<void> {
    if (ids.length === 0) return;
    const now = new Date().toISOString();
    const idSet = new Set(ids);

    if (entity === "deck") {
      const decks = await getDecksAll();
      const updated = decks.map((deck) =>
        idSet.has(deck.id) ? { ...deck, dirty: false, lastSyncedAt: now } : deck
      );
      await setDecks(updated);
      return;
    }

    if (entity === "card") {
      const decks = await getDecksAll();
      for (const deck of decks) {
        const cards = await getCardsAll(deck.id);
        const updated = cards.map((card) =>
          idSet.has(card.id) ? { ...card, dirty: false, lastSyncedAt: now } : card
        );
        await setCards(deck.id, updated);
      }
      return;
    }

    // entity === "session"
    const sessions = await getSessions();
    const updated = sessions.map((session) =>
      idSet.has(session.id)
        ? { ...session, dirty: false, lastSyncedAt: now }
        : session
    );
    await setSessions(updated);
  },

  async syncOnce(): Promise<void> {
    try {
      console.log("[sync] start");

      const deviceId = await getDeviceId();

      // 1) PUSH
      const outgoing = await this.collectDirty();
      console.log("[sync] outgoing dirty:", outgoing.length);

      if (outgoing.length > 0) {
        const pushJson = await pushChanges({ deviceId, changes: outgoing });
        const accepted = Array.isArray(pushJson.accepted) ? pushJson.accepted : [];
        console.log("[sync] push accepted:", accepted.length);

        if (accepted.length > 0) {
          const acceptedSet = new Set(accepted);

          const deckIds = outgoing
            .filter((c) => c.entity === "deck" && acceptedSet.has(c.id))
            .map((c) => c.id);

          const cardIds = outgoing
            .filter((c) => c.entity === "card" && acceptedSet.has(c.id))
            .map((c) => c.id);

          const sessionIds = outgoing
            .filter((c) => c.entity === "session" && acceptedSet.has(c.id))
            .map((c) => c.id);

          await this.markClean("deck", deckIds);
          await this.markClean("card", cardIds);
          await this.markClean("session", sessionIds);
        }
      }

      // 2) PULL
      const cursor = await getSyncCursor();
      console.log("[sync] cursor before pull:", cursor ?? "none");

      const pullJson = await pullChanges({ deviceId, cursor });
      console.log("[sync] pulled changes:", pullJson.changes?.length ?? 0);
      console.log("[sync] new cursor:", pullJson.cursor);

      // 3) APPLY + persist cursor
      await applyChanges(pullJson.changes ?? []);
      if (pullJson.cursor) await setSyncCursor(pullJson.cursor);

      console.log("SYNC OK");
    } catch (err) {
      console.error("SYNC FAILED", err);
      throw err;
    }
  },
};
