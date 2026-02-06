// Supabase Client - Zero Knowledge Vault
// Used ONLY for authentication and encrypted blob storage
// NEVER stores keys, PINs, salts, or file metadata

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { Platform } from 'react-native';

const SUPABASE_URL = 'https://uazhvhyfhzhmgfxwbxpq.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVhemh2aHlmaHpobWdmeHdieHBxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAzOTkyOTMsImV4cCI6MjA4NTk3NTI5M30.I3h6kTOx66uf756y8YbTXBZuiNVxyOShNVc-r4VIJ_A';

export const STORAGE_BUCKET = 'vault-shards';

let supabaseInstance: SupabaseClient | null = null;

// Get AsyncStorage only on client side
async function getStorage() {
  if (typeof window === 'undefined') {
    return undefined;
  }
  const AsyncStorage = await import('@react-native-async-storage/async-storage');
  return AsyncStorage.default;
}

// Lazy initialization to avoid SSR issues
export function getSupabase(): SupabaseClient {
  if (!supabaseInstance) {
    supabaseInstance = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: {
        storage: {
          getItem: async (key: string) => {
            if (typeof window === 'undefined') return null;
            const AsyncStorage = (await import('@react-native-async-storage/async-storage')).default;
            return AsyncStorage.getItem(key);
          },
          setItem: async (key: string, value: string) => {
            if (typeof window === 'undefined') return;
            const AsyncStorage = (await import('@react-native-async-storage/async-storage')).default;
            await AsyncStorage.setItem(key, value);
          },
          removeItem: async (key: string) => {
            if (typeof window === 'undefined') return;
            const AsyncStorage = (await import('@react-native-async-storage/async-storage')).default;
            await AsyncStorage.removeItem(key);
          },
        },
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: false,
      },
    });
  }
  return supabaseInstance;
}

// Export supabase as a getter proxy for backward compatibility
export const supabase = new Proxy({} as SupabaseClient, {
  get(_, prop) {
    const client = getSupabase();
    const value = (client as any)[prop];
    if (typeof value === 'function') {
      return value.bind(client);
    }
    return value;
  },
});
