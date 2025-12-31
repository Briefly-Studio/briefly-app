// src/domain/deckStats.ts

import type { StudySession } from "../models/session";

export type DeckStats = {
  totalSessions: number;
  todaySessions: number;
  todayMinutes: number;
  weekSessions: number;
  bestQuizPercent: number | null;
  avgQuizPercent7d: number | null;
  streakDays: number;
};

function msToMinutes(ms: number) {
  return Math.round(ms / 60000);
}

function startOfDay(t: number) {
  const d = new Date(t);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

function daysAgoStart(n: number) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

export function computeStreakDays(sessions: StudySession[]) {
  if (sessions.length === 0) return 0;

  const days = new Set<number>();
  for (const s of sessions) {
    days.add(startOfDay(s.finishedAt));
  }

  let streak = 0;
  let cursor = startOfDay(Date.now());

  while (days.has(cursor)) {
    streak += 1;
    cursor = cursor - 24 * 60 * 60 * 1000;
  }

  return streak;
}

export function computeDeckStats(sessions: StudySession[]): DeckStats {
  if (sessions.length === 0) {
    return {
      totalSessions: 0,
      todaySessions: 0,
      todayMinutes: 0,
      weekSessions: 0,
      bestQuizPercent: null,
      avgQuizPercent7d: null,
      streakDays: 0,
    };
  }

  const now = Date.now();
  const todayStart = startOfDay(now);
  const weekStart = daysAgoStart(6); // last 7 days inclusive

  const today = sessions.filter((s) => s.finishedAt >= todayStart);
  const week = sessions.filter((s) => s.finishedAt >= weekStart);

  const todayMs = today.reduce(
    (sum, s) => sum + Math.max(0, s.finishedAt - s.startedAt),
    0
  );

  const quizAll = sessions.filter(
    (s) => s.mode === "quiz" && typeof s.percent === "number"
  );

  const bestQuizPercent =
    quizAll.length === 0
      ? null
      : Math.max(...quizAll.map((s) => s.percent as number));

  const quiz7d = week.filter(
    (s) => s.mode === "quiz" && typeof s.percent === "number"
  );

  const avgQuizPercent7d =
    quiz7d.length === 0
      ? null
      : Math.round(
          quiz7d.reduce((sum, s) => sum + (s.percent as number), 0) / quiz7d.length
        );

  const streakDays = computeStreakDays(sessions);

  return {
    totalSessions: sessions.length,
    todaySessions: today.length,
    todayMinutes: msToMinutes(todayMs),
    weekSessions: week.length,
    bestQuizPercent,
    avgQuizPercent7d,
    streakDays,
  };
}
