import AsyncStorage from "@react-native-async-storage/async-storage";

const KEY_DEVICE_ID = "interval.sync.deviceId";
const KEY_CURSOR = "interval.sync.cursor";

function randomId(): string {
  return `dev_${Math.random().toString(16).slice(2)}_${Date.now().toString(16)}`;
}

export async function getOrCreateDeviceId(): Promise<string> {
  const existing = await AsyncStorage.getItem(KEY_DEVICE_ID);
  if (existing) return existing;
  const id = randomId();
  await AsyncStorage.setItem(KEY_DEVICE_ID, id);
  return id;
}

export async function getCursor(): Promise<string | undefined> {
  const c = await AsyncStorage.getItem(KEY_CURSOR);
  return c ?? undefined;
}

export async function setCursor(cursor: string): Promise<void> {
  await AsyncStorage.setItem(KEY_CURSOR, cursor);
}
