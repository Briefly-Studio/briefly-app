import { useFocusEffect } from "@react-navigation/native";
import { useRouter } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import {
  Alert,
  FlatList,
  Pressable,
  Platform,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { SyncService } from "../src/cloud/sync/SyncService";
import { onSyncComplete } from "../src/cloud/sync/syncSignal";
import type { DeckRecord } from "../src/models/deck";
import { deleteCardsForDeck } from "../src/storage/cards";
import { deleteDeckById, getDecksAll, setDecks } from "../src/storage/decks";
import { forceFullResyncPrep, resetLocalData } from "../src/storage/devReset";

const APP_BG = "#2FA4A3"; // teal background like original

export default function DecksHome() {
  const router = useRouter();
  const [decks, setDecksState] = useState<DeckRecord[]>([]);
  const [loaded, setLoaded] = useState(false);

  const loadDecks = useCallback(async () => {
    const allDecks = await getDecksAll();
    const data = allDecks.filter((deck) => !deck.deletedAt);
    console.log("[home] decks total:", allDecks.length, "active:", data.length);
    setDecksState(data);
    setLoaded(true);
  }, []);

  useFocusEffect(
    useCallback(() => {
      let alive = true;
      (async () => {
        await loadDecks();
        if (!alive) return;
      })();
      return () => {
        alive = false;
      };
    }, [loadDecks])
  );

  useEffect(() => {
    const unsub = onSyncComplete(() => {
      loadDecks();
    });
    return unsub;
  }, [loadDecks]);

  const confirmDelete = (deck: DeckRecord) => {
    Alert.alert("Delete deck?", `“${deck.title}” will be removed from this device.`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          // Delete deck record
          await deleteDeckById(deck.id);

          // Delete cards stored for that deck (cascade delete)
          await deleteCardsForDeck(deck.id);

          await loadDecks();
        },
      },
    ]);
  };

  const renameDeck = (deck: DeckRecord) => {
    if (Platform.OS === "ios" && typeof Alert.prompt === "function") {
      Alert.prompt(
        "Rename deck",
        undefined,
        async (text) => {
          const title = text.trim();
          if (!title) return;
          const allDecks = await getDecksAll();
          const now = new Date().toISOString();
          const updated = allDecks.map((item) => {
            if (item.id !== deck.id) return item;
            return {
              ...item,
              title,
              updatedAt: now,
              rev: (item.rev ?? 0) + 1,
              dirty: true,
            };
          });
          await setDecks(updated);
          await SyncService.syncOnce();
          await loadDecks();
        },
        "plain-text",
        deck.title
      );
      return;
    }

    Alert.alert("Rename not available", "Rename is currently supported on iOS only.");
  };

  const isEmpty = loaded && decks.length === 0;

  if (isEmpty) {
    return (
      <SafeAreaView style={styles.emptyScreen}>
        <Text style={styles.emptyTitle}>Interval</Text>
        <Text style={styles.emptySubtitle}>You do not have any decks yet.</Text>

        <Pressable
          onPress={() => router.push("/recently-deleted")}
          style={styles.newDeckBtn}
        >
          <Text style={styles.newDeckBtnText}>Recently Deleted</Text>
        </Pressable>

        <Pressable
          onPress={() => router.push("/create-deck")}
          style={styles.emptyPrimaryBtn}
        >
          <Text style={styles.emptyPrimaryBtnText}>+ Create your first deck</Text>
        </Pressable>

        <Pressable
          onPress={() => router.push("/import")}
          style={styles.newDeckBtn}
        >
          <Text style={styles.newDeckBtnText}>Import deck</Text>
        </Pressable>

        {__DEV__ && (
          <View style={styles.devRow}>
            <Pressable
              onPress={async () => {
                await forceFullResyncPrep();
                await SyncService.syncOnce();
                await loadDecks();
              }}
              style={styles.resetBtn}
            >
              <Text style={styles.resetBtnText}>Force Resync</Text>
            </Pressable>
            <Pressable
              onPress={async () => {
                await resetLocalData();
                await loadDecks();
                Alert.alert("Reset done");
              }}
              style={styles.resetBtn}
            >
              <Text style={styles.resetBtnText}>Reset</Text>
            </Pressable>
          </View>
        )}

      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.listScreen}>
      <View style={styles.listHeader}>
        <Text style={styles.listTitle}>Interval</Text>

        <View style={styles.headerButtons}>
          {__DEV__ && (
            <>
              <Pressable
                onPress={async () => {
                  await forceFullResyncPrep();
                  await SyncService.syncOnce();
                  await loadDecks();
                }}
                style={styles.resetBtn}
              >
                <Text style={styles.resetBtnText}>Force Resync</Text>
              </Pressable>
              <Pressable
                onPress={async () => {
                  await resetLocalData();
                  await loadDecks();
                  Alert.alert("Reset done");
                }}
                style={styles.resetBtn}
              >
                <Text style={styles.resetBtnText}>Reset</Text>
              </Pressable>
            </>
          )}
          <Pressable onPress={() => router.push("/import")} style={styles.newDeckBtn}>
            <Text style={styles.newDeckBtnText}>Import deck</Text>
          </Pressable>
          <Pressable
            onPress={() => router.push("/recently-deleted")}
            style={styles.newDeckBtn}
          >
            <Text style={styles.newDeckBtnText}>Recently Deleted</Text>
          </Pressable>
          <Pressable
            onPress={() => router.push("/create-deck")}
            style={styles.newDeckBtn}
          >
            <Text style={styles.newDeckBtnText}>+ Deck</Text>
          </Pressable>
        </View>
      </View>

      <FlatList
        data={decks}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <Pressable
            onPress={() => router.push(`/deck/${item.id}`)}
            onLongPress={() =>
              Alert.alert("Deck actions", undefined, [
                { text: "Rename", onPress: () => renameDeck(item) },
                { text: "Delete", style: "destructive", onPress: () => confirmDelete(item) },
                { text: "Cancel", style: "cancel" },
              ])
            }
            delayLongPress={350}
            style={styles.card}
          >
            <Text style={styles.cardTitle}>{item.title}</Text>
            <Text style={styles.cardMeta}>
              Created {new Date(item.createdAt).toLocaleDateString()}
            </Text>
          </Pressable>
        )}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  emptyScreen: {
    flex: 1,
    backgroundColor: APP_BG,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
    gap: 12,
  },
  emptyTitle: { fontSize: 34, fontWeight: "800", color: "black" },
  emptySubtitle: {
    fontSize: 16,
    opacity: 0.85,
    textAlign: "center",
    color: "white",
  },
  emptyPrimaryBtn: {
    marginTop: 12,
    paddingVertical: 14,
    paddingHorizontal: 18,
    borderRadius: 14,
    backgroundColor: "#2247a3ff",
  },
  emptyPrimaryBtnText: { color: "white", fontWeight: "700", fontSize: 16 },

  listScreen: {
    flex: 1,
    backgroundColor: APP_BG,
    paddingHorizontal: 20,
    paddingTop: 10,
  },
  listHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingBottom: 12,
  },
  listTitle: { fontSize: 30, fontWeight: "800", color: "black" },
  headerButtons: {
    flexDirection: "row",
    gap: 8,
    flexWrap: "wrap",
    justifyContent: "flex-end",
  },
  devRow: { flexDirection: "row", gap: 8 },

  resetBtn: {
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.35)",
    backgroundColor: "rgba(255,255,255,0.12)",
  },
  resetBtnText: { fontSize: 14, fontWeight: "700", color: "white" },

  newDeckBtn: {
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.35)",
    backgroundColor: "rgba(255,255,255,0.15)",
  },
  newDeckBtnText: { fontSize: 16, fontWeight: "700", color: "white" },

  list: { paddingBottom: 24, gap: 12 },

  card: {
    padding: 18,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.25)",
    backgroundColor: "rgba(255,255,255,0.16)",
  },
  cardTitle: { fontSize: 20, fontWeight: "800", color: "white" },
  cardMeta: { marginTop: 6, opacity: 0.85, color: "white" },
});
