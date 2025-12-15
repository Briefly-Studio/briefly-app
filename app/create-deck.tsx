import { View, Text, StyleSheet, TextInput, Pressable } from "react-native";
import { useRouter } from "expo-router";
import { useState } from "react";

export default function CreateDeck() {
  const router = useRouter();
  const [title, setTitle] = useState("");

  return (
    <View style={styles.container}>
      <Text style={styles.h1}>Create Deck</Text>

      <Text style={styles.label}>Deck title</Text>
      <TextInput
        value={title}
        onChangeText={setTitle}
        placeholder="e.g., AWS SysOps — Load Balancers"
        placeholderTextColor="#6B7280"
        style={styles.input}
      />

      <View style={styles.row}>
        <Pressable style={[styles.button, styles.secondary]} onPress={() => router.back()}>
          <Text style={styles.buttonText}>Cancel</Text>
        </Pressable>

        <Pressable
          style={[styles.button, styles.primary, !title.trim() && styles.disabled]}
          disabled={!title.trim()}
          onPress={() => {
            // Next step: save to storage + return to DecksHome
            router.back();
          }}
        >
          <Text style={styles.buttonText}>Create</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0B0B0F",
    padding: 24,
    paddingTop: 64,
  },
  h1: { color: "#FFF", fontSize: 28, fontWeight: "700", marginBottom: 24 },
  label: { color: "#A1A1AA", marginBottom: 8, fontSize: 14 },
  input: {
    backgroundColor: "#111827",
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: "#FFF",
    borderWidth: 1,
    borderColor: "#1F2937",
    marginBottom: 24,
    fontSize: 16,
  },
  row: { flexDirection: "row", gap: 12 },
  button: {
    flex: 1,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
  },
  primary: { backgroundColor: "#2563EB" },
  secondary: { backgroundColor: "#1F2937" },
  disabled: { opacity: 0.5 },
  buttonText: { color: "#FFF", fontSize: 16, fontWeight: "600" },
});
