import { Stack } from "expo-router";
import { View } from "react-native";

export default function Layout() {
  return (
    <View style={{ flex: 1, backgroundColor: "#2FA4A3" }}>
      <Stack screenOptions={{ headerShown: false }} />
    </View>
  );
}
