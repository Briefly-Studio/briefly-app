import AsyncStorage from "@react-native-async-storage/async-storage";

const KEY = "sync.cursor";

export async function getSyncCursor(): Promise<string | undefined> {
  const cursor = await AsyncStorage.getItem(KEY);
  return cursor ?? undefined;
}

export async function setSyncCursor(cursor: string): Promise<void> {
  await AsyncStorage.setItem(KEY, cursor);
}
