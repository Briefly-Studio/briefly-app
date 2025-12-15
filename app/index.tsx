import { useFocusEffect } from "@react-navigation/native";
import { useRouter } from "expo-router";
import { useCallback, useState } from "react";
import { FlatList, Pressable, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import type { Deck } from "../src/models/deck";
import { getDecks } from "../src/storage/decks";

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

  const isEmpty = loaded && decks.length === 0;

  if (isEmpty) {
    //This matches the “before” style
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
      </SafeAreaView>
    );
  }

  // Deck list state (rectangles/cards from prior version)
  return (
    <SafeAreaView style={styles.listScreen}>
      <View style={styles.listHeader}>
        <Text style={styles.listTitle}>Briefly</Text>

        <Pressable
          onPress={() => router.push("/create-deck")}
          style={styles.newDeckBtn}
        >
          <Text style={styles.newDeckBtnText}>+ Deck</Text>
        </Pressable>
      </View>

      <FlatList
        data={decks}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>{item.title}</Text>
            <Text style={styles.cardMeta}>
              Created {new Date(item.createdAt).toLocaleDateString()}
            </Text>
          </View>
        )}
      />
    </SafeAreaView>
  );
}
const APP_BG = "#2FA4A3"; // teal background like original

const styles = StyleSheet.create({
  // --- Empty state (BEFORE look) ---
  emptyScreen: {
    flex: 1,
    backgroundColor: APP_BG,          
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
    gap: 12,
  },
  emptyTitle: { fontSize: 34, fontWeight: "800", color: "black" },
  emptySubtitle: { fontSize: 16, opacity: 0.85, textAlign: "center", color: "white" },
  emptyPrimaryBtn: {
    marginTop: 12,
    paddingVertical: 14,
    paddingHorizontal: 18,
    borderRadius: 14,
    backgroundColor: "#2247a3ff",
  },
  emptyPrimaryBtnText: { color: "white", fontWeight: "700", fontSize: 16 },

  // --- List state ---
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

  newDeckBtn: {
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.35)", // better on teal
    backgroundColor: "rgba(255,255,255,0.15)", //  subtle pill feel
  },
  newDeckBtnText: { fontSize: 16, fontWeight: "700", color: "white" },

  list: { paddingBottom: 24, gap: 12 },

  card: {
    padding: 18,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.25)",   // better on teal
    backgroundColor: "rgba(255,255,255,0.16)", // soft glass card
  },
  cardTitle: { fontSize: 20, fontWeight: "800", color: "white" },
  cardMeta: { marginTop: 6, opacity: 0.85, color: "white" },
});

