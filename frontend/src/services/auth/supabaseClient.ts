// Supabase Client - Zero Knowledge Vault
// Used ONLY for authentication and encrypted blob storage
// NEVER stores keys, PINs, salts, or file metadata

import { createClient, SupabaseClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://uazhvhyfhzhmgfxwbxpq.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVhemh2aHlmaHpobWdmeHdieHBxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAzOTkyOTMsImV4cCI6MjA4NTk3NTI5M30.I3h6kTOx66uf756y8YbTXBZuiNVxyOShNVc-r4VIJ_A';

export const STORAGE_BUCKET = 'vault-shards';

let supabaseInstance: SupabaseClient | null = null;
let AsyncStorageModule: any = null;

// Get AsyncStorage module lazily
function getAsyncStorage() {
  if (!AsyncStorageModule && typeof window !== 'undefined') {
    try {
      AsyncStorageModule = require('@react-native-async-storage/async-storage').default;
    } catch (e) {
      console.warn('AsyncStorage not available');
    }
  }
  return AsyncStorageModule;
}

// Custom storage wrapper
const storage = {
  getItem: async (key: string): Promise<string | null> => {
    const AsyncStorage = getAsyncStorage();
    if (!AsyncStorage) return null;
    try {
      return await AsyncStorage.getItem(key);
    } catch {
      return null;
    }
  },
  setItem: async (key: string, value: string): Promise<void> => {
    const AsyncStorage = getAsyncStorage();
    if (!AsyncStorage) return;
    try {
      await AsyncStorage.setItem(key, value);
    } catch {}
  },
  removeItem: async (key: string): Promise<void> => {
    const AsyncStorage = getAsyncStorage();
    if (!AsyncStorage) return;
    try {
      await AsyncStorage.removeItem(key);
    } catch {}
  },
};

// Lazy initialization
export function getSupabase(): SupabaseClient {
  if (!supabaseInstance) {
    const isClient = typeof window !== 'undefined';
    
    supabaseInstance = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: {
        storage: isClient ? storage : undefined,
        autoRefreshToken: isClient,
        persistSession: isClient,
        detectSessionInUrl: false,
        flowType: 'implicit',
      },
    });
  }
  return supabaseInstance;
}

// Backward compatible export
export const supabase = {
  get auth() {
    return getSupabase().auth;
  },
  get storage() {
    return getSupabase().storage;
  },
  from(table: string) {
    return getSupabase().from(table);
  },
};
