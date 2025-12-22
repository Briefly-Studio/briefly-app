import { useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useMemo, useState } from "react";
import {
  Alert,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import type { Card } from "../../../src/models/card";
import type { Deck } from "../../../src/models/deck";
import type { StudySession } from "../../../src/models/session";
import { deleteCard, getCards } from "../../../src/storage/cards";
import { getDeckById } from "../../../src/storage/decks";
import {
  deleteSessionsForDeck,
  getSessionsForDeck,
} from "../../../src/storage/sessions";

const APP_BG = "#2FA4A3";

const formatTimestamp = (value: number) =>
  new Date(value).toLocaleString(undefined, {
    dateStyle: "short",
    timeStyle: "short",
  });

const formatDuration = (startedAt: number, finishedAt: number) => {
  const diff = Math.max(0, finishedAt - startedAt);
  const totalSeconds = Math.floor(diff / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return minutes > 0 ? `${minutes}m ${seconds}s` : `${seconds}s`;
};

// ✅ helpers for stats
const msToMinutes = (ms: number) => Math.round(ms / 60000);

const startOfDay = (t: number) => {
  const d = new Date(t);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
};

const daysAgo = (n: number) => {
  const d = new Date();
  d.setDate(d.getDate() - n);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
};

// Optional streak helper (not shown unless you want to render it)
const computeStreakDays = (sessions: StudySession[]) => {
  if (sessions.length === 0) return 0;

  // unique study days (based on finishedAt)
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
};

export default function DeckDetails() {
  const router = useRouter();

  const params = useLocalSearchParams();
  const idParam = params.id;
  const id =
    typeof idParam === "string"
      ? idParam
      : Array.isArray(idParam)
      ? idParam[0]
      : "";

  const [deck, setDeck] = useState<Deck | null>(null);
  const [cards, setCards] = useState<Card[]>([]);
  const [sessions, setSessions] = useState<StudySession[]>([]);
  const [loaded, setLoaded] = useState(false);

  // ✅ IMPORTANT: always go back to main/home from this screen to prevent loop
  const goBackHome = () => {
    // If your home route is /(tabs), change "/" to "/(tabs)"
    router.replace("/");
  };

  useFocusEffect(
    useCallback(() => {
      let alive = true;

      (async () => {
        if (!id) return;
        const d = await getDeckById(id);
        const c = await getCards(id);
        const s = await getSessionsForDeck(id);

        if (alive) {
          setDeck(d);
          setCards(c);
          setSessions(s);
          setLoaded(true);
        }
      })();

      return () => {
        alive = false;
      };
    }, [id])
  );

  const goAddCard = () => router.push(`/deck/${id}/add-card`);
  const goReview = () => router.push(`/deck/${id}/review`);
  const goQuiz = () => router.push(`/deck/${id}/quiz`);
  const goHistory = () => router.push(`/deck/${id}/history`);

  const confirmDeleteCard = (card: Card) => {
    Alert.alert("Delete card?", "This card will be removed from this deck.", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          const updated = await deleteCard(id, card.id);
          setCards(updated);
        },
      },
    ]);
  };

  // (unused for now, but safe to keep if you’ll wire it later)
  const confirmClearHistory = () => {
    Alert.alert(
      "Clear study history?",
      "This will remove all sessions for this deck.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Clear",
          style: "destructive",
          onPress: async () => {
            await deleteSessionsForDeck(id);
            setSessions([]);
          },
        },
      ]
    );
  };

  const isEmptyCards = loaded && deck && cards.length === 0;

  const recentSessions = useMemo(() => {
    if (sessions.length === 0) return [];
    return [...sessions]
      .sort((a, b) => b.finishedAt - a.finishedAt)
      .slice(0, 5);
  }, [sessions]);

  // ✅ Stats summary
  const stats = useMemo(() => {
    if (sessions.length === 0) {
      return {
        totalSessions: 0,
        todaySessions: 0,
        todayMinutes: 0,
        weekSessions: 0,
        bestQuizPercent: null as number | null,
        avgQuizPercent7d: null as number | null,
        streakDays: 0,
      };
    }

    const now = Date.now();
    const todayStart = startOfDay(now);
    const weekStart = daysAgo(6); // last 7 days inclusive

    const today = sessions.filter((s) => s.finishedAt >= todayStart);
    const week = sessions.filter((s) => s.finishedAt >= weekStart);

    const todayMs = today.reduce(
      (sum, s) => sum + Math.max(0, s.finishedAt - s.startedAt),
      0
    );

    const quiz = sessions.filter(
      (s) => s.mode === "quiz" && typeof s.percent === "number"
    );
    const bestQuizPercent =
      quiz.length === 0 ? null : Math.max(...quiz.map((s) => s.percent as number));

    const quiz7d = week.filter(
      (s) => s.mode === "quiz" && typeof s.percent === "number"
    );
    const avgQuizPercent7d =
      quiz7d.length === 0
        ? null
        : Math.round(
            quiz7d.reduce((sum, s) => sum + (s.percent as number), 0) /
              quiz7d.length
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
  }, [sessions]);

  if (!loaded) {
    return (
      <SafeAreaView style={styles.screen}>
        <Text style={styles.subtle}>Loading…</Text>
      </SafeAreaView>
    );
  }

  if (!deck) {
    return (
      <SafeAreaView style={styles.screen}>
        <Pressable onPress={goBackHome} style={styles.pill}>
          <Text style={styles.pillText}>← Back</Text>
        </Pressable>
        <Text style={styles.subtle}>Deck not found.</Text>
      </SafeAreaView>
    );
  }

  if (isEmptyCards) {
    return (
      <SafeAreaView style={styles.screen}>
        <Pressable onPress={goBackHome} style={styles.pill}>
          <Text style={styles.pillText}>← Back</Text>
        </Pressable>

        <View style={styles.center}>
          <Text style={styles.deckTitle}>{deck.title}</Text>
          <Text style={styles.subtle}>
            Created {new Date(deck.createdAt).toLocaleString()}
          </Text>

          <Pressable onPress={goAddCard} style={styles.primaryBtn}>
            <Text style={styles.primaryBtnText}>+ Add your first card</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  // ✅ Show “Study history button row” (compact)
  const lastSession = recentSessions[0];

  return (
    <SafeAreaView style={styles.screen}>
      <View style={styles.topRow}>
        <Pressable onPress={goBackHome} style={styles.pill}>
          <Text style={styles.pillText}>← Back</Text>
        </Pressable>
      </View>

      <Text style={styles.deckTitle}>{deck.title}</Text>
      <Text style={styles.subtle}>
        Created {new Date(deck.createdAt).toLocaleString()}
      </Text>

      <Pressable onPress={goReview} style={styles.secondaryBtn}>
        <Text style={styles.secondaryBtnText}>▶ Start review</Text>
      </Pressable>

      <Pressable onPress={goQuiz} style={styles.secondaryBtn}>
        <Text style={styles.secondaryBtnText}>🧠 Start quiz</Text>
      </Pressable>

      {/* ✅ Stats card */}
      <View style={[styles.card, { marginTop: 14, gap: 8 }]}>
        <Text style={{ color: "white", fontWeight: "900", fontSize: 16 }}>
          Stats
        </Text>

        <Text style={{ color: "white", opacity: 0.9 }}>
          Today: {stats.todaySessions} sessions • {stats.todayMinutes} min
        </Text>

        <Text style={{ color: "white", opacity: 0.9 }}>
          Last 7 days: {stats.weekSessions} sessions
          {stats.avgQuizPercent7d !== null
            ? ` • avg quiz ${stats.avgQuizPercent7d}%`
            : ""}
        </Text>

        <Text style={{ color: "white", opacity: 0.9 }}>
          Best quiz:{" "}
          {stats.bestQuizPercent !== null ? `${stats.bestQuizPercent}%` : "—"}
        </Text>

        <Text style={{ color: "white", opacity: 0.9 }}>
          Streak: {stats.streakDays} day{stats.streakDays === 1 ? "" : "s"}
        </Text>

        <Text style={{ color: "white", opacity: 0.75, fontSize: 12 }}>
          Total sessions: {stats.totalSessions}
        </Text>
      </View>

      {/* ✅ Study history button */}
      <Pressable onPress={goHistory} style={styles.historyButton}>
        <View style={{ flex: 1, gap: 6 }}>
          <Text style={styles.historyButtonTitle}>
            Study history ({sessions.length})
          </Text>

          {lastSession ? (
            <Text style={styles.historyButtonSubtitle}>
              {formatTimestamp(lastSession.finishedAt)} •{" "}
              {lastSession.mode === "quiz"
                ? `Quiz • ${
                    typeof lastSession.percent === "number"
                      ? `${lastSession.percent}% • `
                      : ""
                  }`
                : "Review • "}
              {lastSession.total} cards •{" "}
              {formatDuration(lastSession.startedAt, lastSession.finishedAt)}
            </Text>
          ) : (
            <Text style={styles.historyButtonSubtitle}>
              No study history yet. Start a review or quiz.
            </Text>
          )}
        </View>

        <Text style={styles.chevron}>›</Text>
      </Pressable>

      <FlatList
        data={cards}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ paddingTop: 14, paddingBottom: 110, gap: 12 }}
        renderItem={({ item }) => (
          <Pressable
            onPress={() => router.push(`/deck/${id}/edit-card/${item.id}`)}
            onLongPress={() => confirmDeleteCard(item)}
            delayLongPress={350}
            style={styles.card}
          >
            <Text style={styles.cardFront}>{item.front}</Text>
            <Text style={styles.cardBack}>{item.back}</Text>
            <Text style={styles.hint}>Tap to edit • Long-press to delete</Text>
          </Pressable>
        )}
      />

      <View style={styles.bottomBar}>
        <Pressable onPress={goAddCard} style={styles.primaryBtnWide}>
          <Text style={styles.primaryBtnText}>+ Card</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: APP_BG,
    paddingHorizontal: 20,
    paddingTop: 10,
  },
  topRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  pill: {
    alignSelf: "flex-start",
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.35)",
    backgroundColor: "rgba(255,255,255,0.15)",
  },
  pillText: { fontWeight: "700", color: "white" },

  deckTitle: {
    marginTop: 16,
    fontSize: 40,
    fontWeight: "900",
    color: "white",
  },
  subtle: { marginTop: 8, color: "white", opacity: 0.85 },

  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
  },

  primaryBtn: {
    marginTop: 10,
    paddingVertical: 14,
    paddingHorizontal: 18,
    borderRadius: 14,
    backgroundColor: "#2247a3ff",
  },
  primaryBtnWide: {
    width: "100%",
    paddingVertical: 14,
    borderRadius: 14,
    backgroundColor: "#2247a3ff",
    alignItems: "center",
  },
  primaryBtnText: { color: "white", fontWeight: "800", fontSize: 16 },

  secondaryBtn: {
    marginTop: 14,
    paddingVertical: 14,
    borderRadius: 14,
    backgroundColor: "rgba(255,255,255,0.15)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.25)",
    alignItems: "center",
  },
  secondaryBtnText: { color: "white", fontWeight: "900", fontSize: 16 },

  card: {
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.25)",
    backgroundColor: "rgba(255,255,255,0.16)",
  },
  cardFront: { color: "white", fontWeight: "900", fontSize: 18 },
  cardBack: { marginTop: 8, color: "white", opacity: 0.9 },
  hint: { marginTop: 10, color: "white", opacity: 0.65, fontSize: 12 },

  historyButton: {
    marginTop: 14,
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.25)",
    backgroundColor: "rgba(255,255,255,0.14)",
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  historyButtonTitle: {
    color: "white",
    fontWeight: "900",
    fontSize: 16,
  },
  historyButtonSubtitle: {
    color: "white",
    opacity: 0.85,
    fontSize: 12,
    fontWeight: "700",
  },
  chevron: {
    color: "white",
    fontSize: 28,
    fontWeight: "900",
    opacity: 0.85,
  },

  bottomBar: {
    position: "absolute",
    left: 20,
    right: 20,
    bottom: 16,
  },
});
