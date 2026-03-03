import { useFocusEffect } from "@react-navigation/native";
import { useRouter } from "expo-router";
import { useCallback, useState } from "react";
import {
  Alert,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import AsyncStorage from "@react-native-async-storage/async-storage";

import { SyncService } from "../src/cloud/sync/SyncService";
import type { DeckRecord } from "../src/models/deck";
import { getCardsAll, setCards } from "../src/storage/cards";
import { cardsKeyForDeck } from "../src/storage/keys";
import { getDecksAll, setDecks } from "../src/storage/decks";

const APP_BG = "#2FA4A3";

export default function RecentlyDeletedScreen() {
  const router = useRouter();
  const [decks, setDecksState] = useState<DeckRecord[]>([]);
  const [loaded, setLoaded] = useState(false);

  const loadDeleted = useCallback(async () => {
    const allDecks = await getDecksAll();
    const deleted = allDecks
      .filter((deck) => deck.deletedAt)
      .sort((a, b) => {
        const aTime = a.deletedAt ? Date.parse(a.deletedAt) : 0;
        const bTime = b.deletedAt ? Date.parse(b.deletedAt) : 0;
        return bTime - aTime;
      });
    setDecksState(deleted);
    setLoaded(true);
  }, []);

  useFocusEffect(
    useCallback(() => {
      let alive = true;
      (async () => {
        await loadDeleted();
        if (!alive) return;
      })();
      return () => {
        alive = false;
      };
    }, [loadDeleted])
  );

  const restoreDeck = async (deck: DeckRecord) => {
    const allDecks = await getDecksAll();
    const now = new Date().toISOString();
    let newRev = 0;
    const updated = allDecks.map((item) => {
      if (item.id !== deck.id) return item;
      newRev = (item.rev ?? 0) + 1;
      return {
        ...item,
        deletedAt: undefined,
        updatedAt: now,
        rev: newRev,
        dirty: true,
        lastSyncedAt: undefined,
      };
    });
    await setDecks(updated);
    const allCards = await getCardsAll(deck.id);
    const updatedCards = allCards.map((card) => {
      if (!card.deletedAt) return card;
      return {
        ...card,
        deletedAt: undefined,
        updatedAt: now,
        rev: (card.rev ?? 0) + 1,
        dirty: true,
      };
    });
    await setCards(deck.id, updatedCards);
    await SyncService.syncOnce();
    await loadDeleted();
    Alert.alert("Restored");
  };

  const purgeDeleted = async () => {
    const allDecks = await getDecksAll();
    const deletedIds = allDecks.filter((d) => d.deletedAt).map((d) => d.id);
    const updated = allDecks.filter((d) => !d.deletedAt);
    await setDecks(updated);
    for (const id of deletedIds) {
      try {
        await AsyncStorage.removeItem(cardsKeyForDeck(id));
      } catch {
        // ignore
      }
    }
    await loadDeleted();
  };

  return (
    <SafeAreaView style={styles.screen}>
      <View style={styles.headerRow}>
        <Pressable onPress={() => router.back()} style={styles.pill}>
          <Text style={styles.pillText}>← Back</Text>
        </Pressable>
        {__DEV__ && (
          <Pressable onPress={purgeDeleted} style={styles.newDeckBtn}>
            <Text style={styles.newDeckBtnText}>Empty Trash</Text>
          </Pressable>
        )}
      </View>

      <Text style={styles.title}>Recently Deleted</Text>

      {loaded && decks.length === 0 ? (
        <View style={styles.emptyCard}>
          <Text style={styles.emptyText}>No deleted decks.</Text>
        </View>
      ) : (
        <FlatList
          data={decks}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => (
            <View style={styles.deletedCard}>
              <View style={styles.deletedCardInfo}>
                <Text style={styles.deletedCardTitle}>{item.title}</Text>
                <Text style={styles.deletedCardMeta}>
                  Deleted{" "}
                  {item.deletedAt ? new Date(item.deletedAt).toLocaleDateString() : "—"}
                </Text>
              </View>
              {__DEV__ && (
                <Pressable
                  onPress={() => restoreDeck(item)}
                  style={styles.restoreBtn}
                >
                  <Text style={styles.restoreBtnText}>Restore</Text>
                </Pressable>
              )}
            </View>
          )}
        />
      )}
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
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  pill: {
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.35)",
    backgroundColor: "rgba(255,255,255,0.15)",
  },
  pillText: { color: "white", fontWeight: "700" },
  newDeckBtn: {
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.35)",
    backgroundColor: "rgba(255,255,255,0.15)",
  },
  newDeckBtnText: { fontSize: 16, fontWeight: "700", color: "white" },
  title: { marginTop: 16, fontSize: 30, fontWeight: "800", color: "black" },
  list: { paddingTop: 14, paddingBottom: 24, gap: 12 },
  emptyCard: {
    marginTop: 16,
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.25)",
    backgroundColor: "rgba(255,255,255,0.16)",
  },
  emptyText: { color: "white", opacity: 0.85 },
  deletedCard: {
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.2)",
    backgroundColor: "rgba(255,255,255,0.08)",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  deletedCardInfo: { flex: 1 },
  deletedCardTitle: { color: "white", fontWeight: "800" },
  deletedCardMeta: { color: "white", opacity: 0.75, marginTop: 4 },
  restoreBtn: {
    marginLeft: 12,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.35)",
    backgroundColor: "rgba(255,255,255,0.12)",
  },
  restoreBtnText: { color: "white", fontWeight: "800", fontSize: 12 },
});
