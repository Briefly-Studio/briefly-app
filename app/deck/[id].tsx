import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { Pressable, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import type { Deck } from "../../src/models/deck";
import { getDeckById } from "../../src/storage/decks";

const APP_BG = "#2FA4A3";

export default function DeckDetails() {
  const router = useRouter();

  // Robust params handling: id can be string OR string[]
  const params = useLocalSearchParams();
  const idParam = params.id;

  const id =
    typeof idParam === "string"
      ? idParam
      : Array.isArray(idParam)
      ? idParam[0]
      : undefined;

  const [deck, setDeck] = useState<Deck | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let alive = true;

    (async () => {
      if (!id) return;
      const data = await getDeckById(id);
      if (alive) {
        setDeck(data);
        setLoaded(true);
      }
    })();

    return () => {
      alive = false;
    };
  }, [id]);

  return (
    <SafeAreaView
      style={{
        flex: 1,
        backgroundColor: APP_BG, //ensures background matches app
        paddingHorizontal: 20,
        paddingTop: 10,
      }}
    >
      <Pressable
        onPress={() => router.back()}
        style={{
          alignSelf: "flex-start",
          paddingVertical: 10,
          paddingHorizontal: 14,
          borderRadius: 12,
          borderWidth: 1,
          borderColor: "rgba(255,255,255,0.35)",
          backgroundColor: "rgba(255,255,255,0.15)",
        }}
      >
        <Text style={{ fontWeight: "700", color: "white" }}>← Back</Text>
      </Pressable>

      {!loaded ? (
        <Text style={{ marginTop: 18, color: "white", opacity: 0.85 }}>
          Loading…
        </Text>
      ) : !deck ? (
        <Text style={{ marginTop: 18, color: "white", opacity: 0.85 }}>
          Deck not found.
        </Text>
      ) : (
        <View style={{ marginTop: 18, gap: 10 }}>
          <Text style={{ fontSize: 34, fontWeight: "800", color: "white" }}>
            {deck.title}
          </Text>

          <Text style={{ color: "white", opacity: 0.85 }}>
            Created {new Date(deck.createdAt).toLocaleString()}
          </Text>

          {/* Placeholder for next phase (cards) */}
          <View
            style={{
              marginTop: 14,
              padding: 16,
              borderRadius: 16,
              borderWidth: 1,
              borderColor: "rgba(255,255,255,0.25)",
              backgroundColor: "rgba(255,255,255,0.16)",
            }}
          >
            <Text style={{ color: "white", fontWeight: "700" }}>
              Cards coming next.
            </Text>
            <Text style={{ color: "white", opacity: 0.85, marginTop: 6 }}>
              This screen is ready for adding cards inside a deck.
            </Text>
          </View>
        </View>
      )}
    </SafeAreaView>
  );
}
