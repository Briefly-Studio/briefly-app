import { Stack } from "expo-router";

const APP_BG = "#2FA4A3";

export default function Layout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: {
          backgroundColor: APP_BG,
        },
      }}
    />
  );
}
