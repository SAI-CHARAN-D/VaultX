// Authentication Service - Zero Knowledge Vault
// Supabase auth is for IDENTITY ONLY, not vault access

import { supabase } from './supabaseClient';
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
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        // Disable email confirmation for easier development
        emailRedirectTo: undefined,
      },
    });
    
    if (error) {
      // Handle rate limit error with user-friendly message
      if (error.message.includes('rate limit') || error.message.includes('Rate limit')) {
        return { 
          success: false, 
          error: 'Too many signup attempts. Please wait a few minutes and try again.' 
        };
      }
      return { success: false, error: error.message };
    }
    
    if (data.user) {
      // Check if email confirmation is required
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
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    
    if (error) {
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
  await supabase.auth.signOut();
}

/**
 * Get current session
 */
export async function getSession(): Promise<User | null> {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    
    if (session?.user) {
      return {
        id: session.user.id,
        email: session.user.email || '',
      };
    }
    
    return null;
  } catch (error) {
    return null;
  }
}

/**
 * Listen to auth state changes
 */
export function onAuthStateChange(callback: (user: User | null) => void) {
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
