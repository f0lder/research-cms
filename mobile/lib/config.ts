import Constants from 'expo-constants';
import { Platform } from 'react-native';

function getApiUrl(): string {
  // Web always runs in the same browser as the dev machine
  if (Platform.OS === 'web') return 'http://localhost:3000';
  // On a device/emulator, use the Expo CLI's LAN address so the device can reach the host
  const hostUri = Constants.expoConfig?.hostUri;
  if (hostUri) {
    const host = hostUri.split(':')[0];
    return `http://${host}:3000`;
  }
  // Android emulator fallback
  if (Platform.OS === 'android') return 'http://10.0.2.2:3000';
  return 'http://localhost:3000';
}

export const API_URL = getApiUrl();
export const API_KEY = 'cms_89e59920d429a18b1b7b84f4af6f8695a99afe5ee6de4892';
