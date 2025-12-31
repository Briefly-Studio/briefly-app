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

import type { Deck } from "../src/models/deck";
import { deleteCardsForDeck } from "../src/storage/cards";
import { deleteDeckById, getDecks } from "../src/storage/decks";

const APP_BG = "#2FA4A3"; // teal background like original

export default function DecksHome() {
  const router = useRouter();
  const [decks, setDecks] = useState<Deck[]>([]);
  const [loaded, setLoaded] = useState(false);

  useFocusEffect(
    useCallback(() => {
      let alive = true;
      (async () => {
        const data = await getDecks();
        if (alive) {
          setDecks(data);
          setLoaded(true);
        }
      })();
      return () => {
        alive = false;
      };
    }, [])
  );

  const confirmDelete = (deck: Deck) => {
    Alert.alert("Delete deck?", `“${deck.title}” will be removed from this device.`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          // Delete deck record
          const updated = await deleteDeckById(deck.id);

          // Delete cards stored for that deck (cascade delete)
          await deleteCardsForDeck(deck.id);

          setDecks(updated);
          setLoaded(true);
        },
      },
    ]);
  };

  const isEmpty = loaded && decks.length === 0;

  if (isEmpty) {
    return (
      <SafeAreaView style={styles.emptyScreen}>
        <Text style={styles.emptyTitle}>Briefly</Text>
        <Text style={styles.emptySubtitle}>You do not have any decks yet.</Text>

        <Pressable
          onPress={() => router.push("/create-deck")}
          style={styles.emptyPrimaryBtn}
        >
          <Text style={styles.emptyPrimaryBtnText}>+ Create your first deck</Text>
        </Pressable>

        <Pressable
          onPress={() => router.push("/import-deck")}
          style={styles.newDeckBtn}
        >
          <Text style={styles.newDeckBtnText}>Import deck</Text>
        </Pressable>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.listScreen}>
      <View style={styles.listHeader}>
        <Text style={styles.listTitle}>Briefly</Text>

        <View style={styles.headerButtons}>
          <Pressable
            onPress={() => router.push("/import-deck")}
            style={styles.newDeckBtn}
          >
            <Text style={styles.newDeckBtnText}>Import</Text>
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
            onLongPress={() => confirmDelete(item)}
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
  headerButtons: { flexDirection: "row", gap: 8 },

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
