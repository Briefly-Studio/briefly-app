import * as DocumentPicker from "expo-document-picker";
import * as FileSystem from "expo-file-system/legacy";
import { useRouter } from "expo-router";
import { useState } from "react";
import { Alert, Pressable, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { importDeckFromJson } from "../src/domain/deckPortability";

const APP_BG = "#2FA4A3";

export default function ImportDeckScreen() {
  const router = useRouter();
  const [selectedFile, setSelectedFile] = useState<{ name: string; uri: string } | null>(
    null
  );
  const [busy, setBusy] = useState(false);

  const canImport = !!selectedFile && !busy;

  const onChooseFile = async () => {
    const result = await DocumentPicker.getDocumentAsync({
      type: "*/*",
      copyToCacheDirectory: true,
    });

    if (result.canceled || !result.assets?.length) return;

    const asset = result.assets[0];
    setSelectedFile({ name: asset.name ?? "deck.briefly", uri: asset.uri });
  };

  const onImport = async () => {
    if (!canImport) return;
    const file = selectedFile;
    if (!file) return;
    try {
      setBusy(true);
      const raw = await FileSystem.readAsStringAsync(file.uri, {
        encoding: FileSystem.EncodingType.UTF8,
      });
      const cleaned = raw.replace(/^\uFEFF/, "").trim();
      const parsed = JSON.parse(cleaned);
      if (
        !parsed ||
        typeof parsed !== "object" ||
        !("version" in parsed) ||
        !("deck" in parsed) ||
        !("cards" in parsed) ||
        !Array.isArray((parsed as { cards?: unknown }).cards)
      ) {
        throw new Error("Invalid export file");
      }

      const newDeckId = await importDeckFromJson(cleaned);
      Alert.alert("Imported", "Deck imported successfully.");
      router.replace(`/deck/${newDeckId}`);
    } catch (error) {
      console.error(error);
      Alert.alert(
        "Import failed",
        error instanceof Error ? error.message : "Unable to read or parse the file."
      );
    } finally {
      setBusy(false);
    }
  };

  return (
    <SafeAreaView style={styles.screen}>
      <Text style={styles.title}>Import deck</Text>
      <Text style={styles.subtitle}>Choose a .briefly file to import</Text>

      <View style={styles.card}>
        <Text style={styles.cardText}>
          {selectedFile ? selectedFile.name : "No file selected"}
        </Text>
      </View>

      <View style={styles.actions}>
        <Pressable onPress={onChooseFile} style={styles.secondaryBtn}>
          <Text style={styles.secondaryText}>Choose file</Text>
        </Pressable>

        <Pressable
          onPress={onImport}
          disabled={!canImport}
          style={[styles.primaryBtn, !canImport && { opacity: 0.5 }]}
        >
          <Text style={styles.primaryText}>Import</Text>
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
    gap: 12,
  },
  title: { fontSize: 30, fontWeight: "900", color: "white", marginTop: 4 },
  subtitle: { color: "white", opacity: 0.8, marginBottom: 6 },
  card: {
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.25)",
    backgroundColor: "rgba(255,255,255,0.16)",
  },
  cardText: { color: "white", opacity: 0.9, fontWeight: "800" },
  actions: { flexDirection: "row", gap: 10 },
  primaryBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: "#2247a3ff",
    alignItems: "center",
  },
  primaryText: { color: "white", fontWeight: "900", fontSize: 16 },
  secondaryBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.35)",
    backgroundColor: "rgba(255,255,255,0.12)",
    alignItems: "center",
  },
  secondaryText: { color: "white", fontWeight: "900", fontSize: 16 },
});
