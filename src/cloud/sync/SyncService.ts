import type { CardRecord } from "../../models/card";
import type { DeckRecord } from "../../models/deck";
import type { StudySession } from "../../models/session";

import { getCardsAll, setCards } from "../../storage/cards";
import { getDecksAll, setDecks } from "../../storage/decks";
import { getSessions, setSessions } from "../../storage/sessions";

import { getCursor, getOrCreateDeviceId, setCursor } from "./meta";
import type { Change, PullResponse, PushResponse } from "./types";

// Public repo safe: base URL comes from env
const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL;

function requireBaseUrl(): string {
  if (!API_BASE_URL) {
    throw new Error("Missing EXPO_PUBLIC_API_BASE_URL");
  }
  return API_BASE_URL;
}

async function applyRemoteChanges(changes: Change[]): Promise<void> {
  if (changes.length === 0) return;

  // enforce ordering just in case
  const ordered = [...changes].sort((a, b) => a.ts.localeCompare(b.ts));
  const now = new Date().toISOString();

  const deckChanges = ordered.filter((c) => c.entity === "deck");
  const cardChanges = ordered.filter((c) => c.entity === "card");
  const sessionChanges = ordered.filter((c) => c.entity === "session");

  // ----- Apply decks -----
  if (deckChanges.length) {
    const decks = await getDecksAll();
    const byId = new Map(decks.map((d) => [d.id, d]));

    for (const ch of deckChanges) {
      const incoming = ch.record as DeckRecord;
      const existing = byId.get(ch.id);

      // idempotency guard: skip older/equal updates
      if (existing?.updatedAt && existing.updatedAt >= ch.ts) continue;

      if (ch.op === "delete") {
        if (existing) {
          byId.set(ch.id, {
            ...existing,
            deletedAt: (incoming as any).deletedAt ?? ch.ts,
            updatedAt: ch.ts,
            dirty: false,
            lastSyncedAt: now,
          });
        }
        continue;
      }

      byId.set(ch.id, { ...incoming, dirty: false, lastSyncedAt: now });
    }

    await setDecks(Array.from(byId.values()));
  }

  // ----- Apply cards (group by deckId) -----
  if (cardChanges.length) {
    const byDeckId = new Map<string, Change[]>();

    for (const ch of cardChanges) {
      const incoming = ch.record as CardRecord;
      const deckId = (incoming as any).deckId as string | undefined;
      if (!deckId) continue;
      if (!byDeckId.has(deckId)) byDeckId.set(deckId, []);
      byDeckId.get(deckId)!.push(ch);
    }

    for (const [deckId, deckCardChanges] of byDeckId.entries()) {
      const cards = await getCardsAll(deckId);
      const byId = new Map(cards.map((c) => [c.id, c]));

      for (const ch of deckCardChanges) {
        const incoming = ch.record as CardRecord;
        const existing = byId.get(ch.id);

        if (existing?.updatedAt && existing.updatedAt >= ch.ts) continue;

        if (ch.op === "delete") {
          if (existing) {
            byId.set(ch.id, {
              ...existing,
              deletedAt: (incoming as any).deletedAt ?? ch.ts,
              updatedAt: ch.ts,
              dirty: false,
              lastSyncedAt: now,
            });
          }
          continue;
        }

        byId.set(ch.id, { ...incoming, dirty: false, lastSyncedAt: now });
      }

      await setCards(deckId, Array.from(byId.values()));
    }
  }

  // ----- Apply sessions -----
  if (sessionChanges.length) {
    const sessions = await getSessions();
    const byId = new Map((sessions as any[]).map((s) => [s.id, s]));

    for (const ch of sessionChanges) {
      const incoming = ch.record as unknown as StudySession;
      const existing = byId.get(ch.id);

      if (existing?.updatedAt && existing.updatedAt >= ch.ts) continue;

      if (ch.op === "delete") {
        if (existing) {
          byId.set(ch.id, {
            ...existing,
            deletedAt: (incoming as any).deletedAt ?? ch.ts,
            updatedAt: ch.ts,
            dirty: false,
            lastSyncedAt: now,
          });
        }
        continue;
      }

      byId.set(ch.id, { ...(incoming as any), dirty: false, lastSyncedAt: now });
    }

    await setSessions(Array.from(byId.values()) as any);
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
        record: deck as DeckRecord,
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
          record: card as CardRecord,
          ts: card.updatedAt,
        });
      }
    }

    const sessions = await getSessions();
    for (const session of sessions as any[]) {
      if (!session?.dirty) continue;
      changes.push({
        id: session.id,
        entity: "session",
        op: session.deletedAt ? "delete" : "upsert",
        record: session as StudySession,
        ts: session.updatedAt ?? new Date().toISOString(),
      });
    }

    return changes;
  },

  async markClean(entity: "deck" | "card" | "session", ids: string[]): Promise<void> {
    if (ids.length === 0) return;
    const now = new Date().toISOString();
    const idSet = new Set(ids);

    if (entity === "deck") {
      const decks = await getDecksAll();
      const updated = decks.map((d) =>
        idSet.has(d.id) ? { ...d, dirty: false, lastSyncedAt: now } : d
      );
      await setDecks(updated);
      return;
    }

    if (entity === "session") {
      const sessions = await getSessions();
      const updated = (sessions as any[]).map((s) =>
        idSet.has(s.id) ? { ...s, dirty: false, lastSyncedAt: now } : s
      );
      await setSessions(updated as any);
      return;
    }

    // cards: need scan all decks because cards stored by deck bucket
    const decks = await getDecksAll();
    for (const deck of decks) {
      const cards = await getCardsAll(deck.id);
      const updated = cards.map((c) =>
        idSet.has(c.id) ? { ...c, dirty: false, lastSyncedAt: now } : c
      );
      await setCards(deck.id, updated);
    }
  },

  async syncOnce(): Promise<void> {
    const baseUrl = requireBaseUrl();
    const deviceId = await getOrCreateDeviceId();

    // 1) PUSH
    const dirty = await this.collectDirty();
    if (dirty.length > 0) {
      const pushRes = await fetch(`${baseUrl}/sync/push`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ deviceId, changes: dirty }),
      });

      if (!pushRes.ok) throw new Error(`push failed: ${pushRes.status}`);

      const pushJson = (await pushRes.json()) as PushResponse;
      const accepted = Array.isArray(pushJson.accepted) ? pushJson.accepted : [];
      if (accepted.length > 0) {
        // group accepted by entity based on outgoing list
        const acceptedSet = new Set(accepted);

        const deckIds = dirty.filter((c) => c.entity === "deck" && acceptedSet.has(c.id)).map((c) => c.id);
        const cardIds = dirty.filter((c) => c.entity === "card" && acceptedSet.has(c.id)).map((c) => c.id);
        const sessionIds = dirty.filter((c) => c.entity === "session" && acceptedSet.has(c.id)).map((c) => c.id);

        await this.markClean("deck", deckIds);
        await this.markClean("card", cardIds);
        await this.markClean("session", sessionIds);
      }
    }

    // 2) PULL
    const cursor = await getCursor();
    const pullUrl = new URL(`${baseUrl}/sync/pull`);
    pullUrl.searchParams.set("deviceId", deviceId);
    if (cursor) pullUrl.searchParams.set("cursor", cursor);

    const pullRes = await fetch(pullUrl.toString(), { method: "GET" });
    if (!pullRes.ok) throw new Error(`pull failed: ${pullRes.status}`);

    const pullJson = (await pullRes.json()) as PullResponse;

    // 3) APPLY + persist cursor
    await applyRemoteChanges(pullJson.changes ?? []);
    await setCursor(pullJson.cursor);
  },
};