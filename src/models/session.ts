export type StudyMode = "review" | "quiz";

export type StudySession = {
  id: string;            // unique session id
  deckId: string;        // which deck was studied
  mode: StudyMode;       // review or quiz
  startedAt: number;     // epoch ms
  finishedAt: number;    // epoch ms

  // metrics
  total: number;         // total cards attempted
  correct?: number;      // quiz only (or if you decide to grade review later)
  percent?: number;      // quiz only (0-100)
};

export type SessionRecord = StudySession & {
  rev: number;
  updatedAt: string;
  deletedAt?: string;
  dirty?: boolean;
  lastSyncedAt?: string;
};

export function upgradeSession(s: any): SessionRecord {
  if (s && typeof s.rev === "number" && typeof s.updatedAt === "string") {
    return { ...s, dirty: s.dirty ?? false };
  }

  const updatedAt =
    typeof s?.finishedAt === "number"
      ? new Date(s.finishedAt).toISOString()
      : typeof s?.startedAt === "number"
      ? new Date(s.startedAt).toISOString()
      : new Date().toISOString();

  return {
    id: typeof s?.id === "string" ? s.id : "",
    deckId: typeof s?.deckId === "string" ? s.deckId : "",
    mode: s?.mode === "quiz" ? "quiz" : "review",
    startedAt: typeof s?.startedAt === "number" ? s.startedAt : Date.now(),
    finishedAt: typeof s?.finishedAt === "number" ? s.finishedAt : Date.now(),
    total: typeof s?.total === "number" ? s.total : 0,
    correct: typeof s?.correct === "number" ? s.correct : undefined,
    percent: typeof s?.percent === "number" ? s.percent : undefined,
    rev: 0,
    updatedAt,
    dirty: false,
  };
}
