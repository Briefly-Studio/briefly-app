
import { useRouter } from "expo-router";
import { Pressable, StyleSheet, Text, View } from "react-native";

export default function DecksHome() {
   const router = useRouter();
  return (
    <View style={styles.container}>
    <View style={styles.emptyState}>
      <Text style={styles.title}>Briefly</Text>
      <Text style={styles.subtitle}>You do not have any decks yet.</Text>

      <Pressable style={styles.button} onPress={() => router.push("/create-deck")}>
        <Text style={styles.buttonText}>+ Create your first deck</Text>
      </Pressable>

      </View>
    </View>
  );
}
const styles = StyleSheet.create({

  container: {
    flex: 1,
    backgroundColor: "#2f9d9fff",
    alignItems: "center",
    justifyContent: "center",
    padding: 24
  },

  emptyState: {
    alignItems: "center"
  },

  title: {
    fontSize: 36,
    fontWeight: "700",
    color: "A1A1AA",
    marginBottom: 32,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 16,
    color: "#ffffffff",
    marginBottom: 32,
    textAlign: "center"},
  button: {
    backgroundColor: "#2563EB",
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 12,
  },
  buttonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600"
  },
});