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
