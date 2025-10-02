import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = 'READ_NOTIFICATIONS';

export const saveReadNotification = async (id: string) => {
  try {
    const stored = await AsyncStorage.getItem(STORAGE_KEY);
    const parsed: string[] = stored ? JSON.parse(stored) : [];
    const updated = Array.from(new Set([...parsed, id]));
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  } catch (err) {
    console.error('Error saving read notification:', err);
  }
};

export const getReadNotifications = async (): Promise<string[]> => {
  try {
    const stored = await AsyncStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch (err) {
    console.error('Error loading read notifications:', err);
    return [];
  }
};
