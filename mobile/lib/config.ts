import Constants from 'expo-constants';
import { Platform } from 'react-native';

function getApiUrl(): string {
  // Explicit override always wins
  if (process.env.EXPO_PUBLIC_API_URL) return process.env.EXPO_PUBLIC_API_URL;
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
export const API_KEY = process.env.EXPO_PUBLIC_API_KEY ?? '';
