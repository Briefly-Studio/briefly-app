import AsyncStorage from "@react-native-async-storage/async-storage";
import type { StudySession } from "../models/session";

const KEY = "briefly.sessions.v1";

async function safeParse(raw: string | null): Promise<StudySession[]> {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as StudySession[]) : [];
  } catch {
    return [];
  }
}

export async function getSessions(): Promise<StudySession[]> {
  const raw = await AsyncStorage.getItem(KEY);
  return safeParse(raw);
}

export async function setSessions(sessions: StudySession[]): Promise<void> {
  await AsyncStorage.setItem(KEY, JSON.stringify(sessions));
}

export async function addSession(session: StudySession): Promise<StudySession[]> {
  const existing = await getSessions();
  const updated = [session, ...existing];
  await setSessions(updated);
  return updated;
}

export async function getSessionsForDeck(deckId: string): Promise<StudySession[]> {
  const all = await getSessions();
  return all.filter((s) => s.deckId === deckId);
}

export async function deleteSessionsForDeck(deckId: string): Promise<void> {
  const all = await getSessions();
  const updated = all.filter((s) => s.deckId !== deckId);
  await setSessions(updated);
}
