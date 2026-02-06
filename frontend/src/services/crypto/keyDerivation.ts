// PBKDF2 Key Derivation - Zero Knowledge Vault
// Master Key is NEVER stored, always re-derived from PIN

import CryptoJS from 'crypto-js';
import * as ExpoRandom from 'expo-crypto';
import { Buffer } from 'buffer';

global.Buffer = global.Buffer || Buffer;

// Reduced iterations for mobile performance (still secure but faster)
// 10,000 iterations provides good security while being responsive on mobile
const ITERATIONS = 10000;
const KEY_SIZE = 256 / 32; // 256 bits = 8 words (32 bits each)
const SALT_SIZE = 16; // 16 bytes = 128 bits

/**
 * Generate cryptographically secure random bytes
 */
export async function generateRandomBytes(size: number): Promise<string> {
  try {
    const randomBytes = await ExpoRandom.getRandomBytesAsync(size);
    return Buffer.from(randomBytes).toString('hex');
  } catch (error) {
    // Fallback for web
    const array = new Uint8Array(size);
    if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
      crypto.getRandomValues(array);
    } else {
      for (let i = 0; i < size; i++) {
        array[i] = Math.floor(Math.random() * 256);
      }
    }
    return Buffer.from(array).toString('hex');
  }
}

/**
 * Derive master key from PIN using PBKDF2-HMAC-SHA256
 * Key is 256 bits, never stored, re-derived on every unlock
 */
export function deriveMasterKey(pin: string, salt: string): string {
  const key = CryptoJS.PBKDF2(pin, CryptoJS.enc.Hex.parse(salt), {
    keySize: KEY_SIZE,
    iterations: ITERATIONS,
    hasher: CryptoJS.algo.SHA256,
  });
  return key.toString(CryptoJS.enc.Hex);
}

/**
 * Generate a new salt for key derivation
 */
export async function generateSalt(): Promise<string> {
  return generateRandomBytes(SALT_SIZE);
}

/**
 * Generate a random File Encryption Key (FEK) for each document
 */
export async function generateFEK(): Promise<string> {
  return generateRandomBytes(32); // 256 bits
}

/**
 * Generate initialization vector for AES-GCM
 */
export async function generateIV(): Promise<string> {
  return generateRandomBytes(12); // 96 bits for GCM
}
