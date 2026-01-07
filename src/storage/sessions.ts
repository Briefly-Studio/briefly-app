import AsyncStorage from "@react-native-async-storage/async-storage";
import type { SessionRecord } from "../models/session";
import { upgradeSession } from "../models/session";

const KEY = "briefly.sessions.v1";

async function safeParse(raw: string | null): Promise<SessionRecord[]> {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    const upgraded = parsed.map((session) => upgradeSession(session));
    try {
      await setSessions(upgraded);
    } catch {
      // ignore
    }
    return upgraded;
  } catch {
    return [];
  }
}

export async function getSessions(): Promise<SessionRecord[]> {
  const raw = await AsyncStorage.getItem(KEY);
  return safeParse(raw);
}

export async function setSessions(sessions: SessionRecord[]): Promise<void> {
  await AsyncStorage.setItem(KEY, JSON.stringify(sessions));
}

export async function addSession(session: SessionRecord): Promise<SessionRecord[]> {
  const existing = await getSessions();
  const updated = [upgradeSession(session), ...existing];
  await setSessions(updated);
  return updated;
}

export async function getSessionsForDeck(deckId: string): Promise<SessionRecord[]> {
  const all = await getSessions();
  return all.filter((s) => s.deckId === deckId);
}

export async function deleteSessionsForDeck(deckId: string): Promise<void> {
  const all = await getSessions();
  const now = new Date().toISOString();
  const updated = all.map((session) => {
    if (session.deckId !== deckId) return session;
    if (session.deletedAt) return session;
    return {
      ...session,
      deletedAt: now,
      updatedAt: now,
      rev: session.rev + 1,
      dirty: true,
    };
  });
  await setSessions(updated);
}
