import { useRouter } from "expo-router";
import { useState } from "react";
import { Alert, Pressable, Text, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { makeId, type Deck } from "../src/models/deck";
import { addDeck } from "../src/storage/decks";

export default function CreateDeck() {
  const router = useRouter();
  const [title, setTitle] = useState("");

  async function onCreate() {
    const trimmed = title.trim();
    if (!trimmed) {
      Alert.alert("Deck title required", "Please enter a name for your deck.");
      return;
    }

    const deck: Deck = {
      id: makeId(),
      title: trimmed,
      createdAt: new Date().toISOString(),
    };

    await addDeck(deck);
    router.back();
  }
  
  return (
    <SafeAreaView style={{ flex: 1 }}>
      <View style={{ flex: 1, paddingHorizontal: 20, paddingTop: 12, gap: 16 }}>
        <Text style={{ fontSize: 24, fontWeight: "700" }}>Create deck</Text>

        <TextInput
          value={title}
          onChangeText={setTitle}
          placeholder="Deck title"
          autoFocus
          style={{
            borderWidth: 1,
            borderColor: "rgba(0, 0, 0, 0.12)",
            padding: 14,
            borderRadius: 12,
            fontSize: 16,
          }}
        />

        <View style={{ flexDirection: "row", gap: 12 }}>
          <Pressable
            onPress={() => router.back()}
            style={{
              paddingVertical: 12,
              paddingHorizontal: 14,
              borderRadius: 12,
              borderWidth: 1,
              borderColor: "rgba(0, 0, 0, 0.12)",
            }}
          >
            <Text style={{ fontWeight: "600" }}>Cancel</Text>
          </Pressable>

          <Pressable
            onPress={onCreate}
            style={{
              paddingVertical: 12,
              paddingHorizontal: 14,
              borderRadius: 12,
              borderWidth: 1,
              borderColor: "rgba(0, 0, 0, 0.12)",
            }}
          >
            <Text style={{ fontWeight: "600" }}>Create</Text>
          </Pressable>
        </View>
      </View>
    </SafeAreaView>
  );
}
