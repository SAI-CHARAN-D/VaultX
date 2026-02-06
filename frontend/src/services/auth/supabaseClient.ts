// Supabase Client - Zero Knowledge Vault
// Used ONLY for authentication and encrypted blob storage
// NEVER stores keys, PINs, salts, or file metadata

import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';

const SUPABASE_URL = 'https://uazhvhyfhzhmgfxwbxpq.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVhemh2aHlmaHpobWdmeHdieHBxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAzOTkyOTMsImV4cCI6MjA4NTk3NTI5M30.I3h6kTOx66uf756y8YbTXBZuiNVxyOShNVc-r4VIJ_A';

export const STORAGE_BUCKET = 'vault-shards';

// Create Supabase client
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

// Export getter function for compatibility
export function getSupabase() {
  return supabase;
}
