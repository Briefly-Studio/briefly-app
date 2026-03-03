import AsyncStorage from "@react-native-async-storage/async-storage";
import { DECKS_KEY } from "./keys";

const SESSIONS_KEY = "briefly.sessions.v1";
const CURSOR_KEY = "sync.cursor";

export async function resetLocalData(): Promise<void> {
  await AsyncStorage.removeItem(CURSOR_KEY);
  await AsyncStorage.removeItem(DECKS_KEY);
  await AsyncStorage.removeItem(SESSIONS_KEY);
}

export async function forceFullResyncPrep(): Promise<void> {
  await AsyncStorage.removeItem(CURSOR_KEY);
  await AsyncStorage.removeItem(DECKS_KEY);
  await AsyncStorage.removeItem(SESSIONS_KEY);
}
