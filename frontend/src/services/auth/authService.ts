// Authentication Service - Zero Knowledge Vault
// Supabase auth is for IDENTITY ONLY, not vault access

import { getSupabase } from './supabaseClient';
import type { User } from '../../types';

export interface AuthResult {
  success: boolean;
  user?: User;
  error?: string;
}

/**
 * Sign up with email and password
 * This creates identity only - vault setup happens separately
 */
export async function signUp(email: string, password: string): Promise<AuthResult> {
  try {
    const supabase = getSupabase();
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: undefined,
      },
    });
    
    if (error) {
      if (error.message.includes('rate limit') || error.message.includes('Rate limit')) {
        return { 
          success: false, 
          error: 'Too many signup attempts. Please wait a few minutes and try again.' 
        };
      }
      return { success: false, error: error.message };
    }
    
    if (data.user) {
      if (data.user.identities && data.user.identities.length === 0) {
        return { 
          success: false, 
          error: 'This email is already registered. Please sign in instead.' 
        };
      }
      
      return {
        success: true,
        user: {
          id: data.user.id,
          email: data.user.email || email,
        },
      };
    }
    
    return { success: false, error: 'Failed to create account' };
  } catch (error: any) {
    return { success: false, error: error.message || 'Unknown error' };
  }
}

/**
 * Sign in with email and password
 */
export async function signIn(email: string, password: string): Promise<AuthResult> {
  try {
    const supabase = getSupabase();
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    
    if (error) {
      if (error.message.includes('Email not confirmed') || error.message.includes('email not confirmed')) {
        return { 
          success: false, 
          error: 'Email not confirmed. Please check your email or disable email confirmation in Supabase dashboard.' 
        };
      }
      return { success: false, error: error.message };
    }
    
    if (data.user) {
      return {
        success: true,
        user: {
          id: data.user.id,
          email: data.user.email || email,
        },
      };
    }
    
    return { success: false, error: 'Failed to sign in' };
  } catch (error: any) {
    return { success: false, error: error.message || 'Unknown error' };
  }
}

/**
 * Sign out
 */
export async function signOut(): Promise<void> {
  const supabase = getSupabase();
  await supabase.auth.signOut();
}

/**
 * Get current session
 */
export async function getSession(): Promise<User | null> {
  try {
    const supabase = getSupabase();
    const { data: { session } } = await supabase.auth.getSession();
    console.log('SESSION:', session);
    
    if (session?.user) {
      return {
        id: session.user.id,
        email: session.user.email || '',
      };
    }
    
    return null;
  } catch (error) {
    console.log('SESSION ERROR:', error);
    return null;
  }
}

/**
 * Listen to auth state changes
 */
export function onAuthStateChange(callback: (user: User | null) => void) {
  const supabase = getSupabase();
  return supabase.auth.onAuthStateChange((event, session) => {
    if (session?.user) {
      callback({
        id: session.user.id,
        email: session.user.email || '',
      });
    } else {
      callback(null);
    }
  });
}
