import { useRouter } from "expo-router";
import { Alert, Pressable, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { SyncService } from "../src/cloud/sync/SyncService";
import { forceFullResyncPrep, resetLocalData } from "../src/storage/devReset";

const APP_BG = "#2FA4A3";

export default function DevToolsScreen() {
  const router = useRouter();

  if (!__DEV__) {
    return (
      <SafeAreaView style={styles.screen}>
        <Pressable onPress={() => router.back()} style={styles.pill}>
          <Text style={styles.pillText}>← Back</Text>
        </Pressable>
        <Text style={styles.title}>Dev Tools</Text>
        <Text style={styles.subtle}>This screen is only available in development.</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.screen}>
      <View style={styles.headerRow}>
        <Pressable onPress={() => router.back()} style={styles.pill}>
          <Text style={styles.pillText}>← Back</Text>
        </Pressable>
      </View>

      <Text style={styles.title}>Dev Tools</Text>
      <Text style={styles.subtle}>Use for debugging only</Text>

      <Pressable
        onPress={async () => {
          await forceFullResyncPrep();
          await SyncService.syncOnce();
          Alert.alert("Force Resync complete");
        }}
        style={styles.secondaryBtn}
      >
        <Text style={styles.secondaryText}>Force Resync</Text>
      </Pressable>

      <Pressable
        onPress={async () => {
          await resetLocalData();
          Alert.alert("Reset done");
        }}
        style={styles.secondaryBtn}
      >
        <Text style={styles.secondaryText}>Reset Local Data</Text>
      </Pressable>
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
  title: { fontSize: 30, fontWeight: "900", color: "white", marginTop: 4 },
  subtle: { color: "white", opacity: 0.85 },
  secondaryBtn: {
    marginTop: 6,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.35)",
    backgroundColor: "rgba(255,255,255,0.12)",
    alignItems: "center",
  },
  secondaryText: { color: "white", fontWeight: "900", fontSize: 16 },
});
