import * as Clipboard from "expo-clipboard";
import { useRouter } from "expo-router";
import { useState } from "react";
import { Alert, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { importDeckFromJson } from "../src/domain/deckPortability";

const APP_BG = "#2FA4A3";

export default function ImportDeckScreen() {
  const router = useRouter();
  const [payload, setPayload] = useState("");

  const canImport = payload.trim().length > 0;

  const onPaste = async () => {
    try {
      const text = await Clipboard.getStringAsync();
      setPayload(text);
    } catch {
      Alert.alert("Clipboard unavailable", "Please paste the JSON manually.");
    }
  };

  const onImport = async () => {
    if (!canImport) {
      Alert.alert("Nothing to import", "Paste a deck export JSON to continue.");
      return;
    }

    try {
      const deckId = await importDeckFromJson(payload.trim());
      router.replace(`/deck/${deckId}`);
    } catch (error) {
      Alert.alert(
        "Import failed",
        error instanceof Error ? error.message : "Please check the JSON and try again."
      );
    }
  };

  return (
    <SafeAreaView style={styles.screen}>
      <View style={styles.headerRow}>
        <Pressable onPress={() => router.back()} style={styles.pill}>
          <Text style={styles.pillText}>← Back</Text>
        </Pressable>

        <Pressable
          onPress={onImport}
          disabled={!canImport}
          style={[styles.primary, !canImport && { opacity: 0.5 }]}
        >
          <Text style={styles.primaryText}>Import</Text>
        </Pressable>
      </View>

      <Text style={styles.title}>Import deck</Text>

      <View style={styles.labelRow}>
        <Text style={styles.label}>Deck JSON</Text>
        <Pressable onPress={onPaste} style={styles.pasteBtn}>
          <Text style={styles.pasteBtnText}>Paste</Text>
        </Pressable>
      </View>
      <TextInput
        value={payload}
        onChangeText={setPayload}
        placeholder="Paste exported JSON here"
        placeholderTextColor="rgba(255,255,255,0.65)"
        style={styles.input}
        multiline
        textAlignVertical="top"
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: APP_BG,
    paddingHorizontal: 20,
    paddingTop: 10,
    gap: 12,
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
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
  primary: {
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 12,
    backgroundColor: "#2247a3ff",
  },
  primaryText: { color: "white", fontWeight: "900" },
  title: { fontSize: 30, fontWeight: "900", color: "black", marginTop: 4 },
  label: { color: "white", fontWeight: "800", opacity: 0.9, marginTop: 6 },
  labelRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  pasteBtn: {
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.35)",
    backgroundColor: "rgba(255,255,255,0.15)",
  },
  pasteBtnText: { color: "white", fontWeight: "800", fontSize: 12 },
  input: {
    minHeight: 220,
    borderRadius: 16,
    padding: 14,
    color: "white",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.25)",
    backgroundColor: "rgba(255,255,255,0.16)",
  },
});
