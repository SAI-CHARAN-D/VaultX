// PIN Hashing Service - Zero Knowledge Vault
// PINs are hashed and salted locally, NEVER stored in plaintext

import CryptoJS from 'crypto-js';
import { generateRandomBytes } from './keyDerivation';

// Reduced iterations for faster PIN verification on mobile
const HASH_ITERATIONS = 5000;

/**
 * Hash a PIN with salt using PBKDF2
 * Returns the hash that can be stored locally for verification
 */
export function hashPin(pin: string, salt: string): string {
  const hash = CryptoJS.PBKDF2(pin, CryptoJS.enc.Hex.parse(salt), {
    keySize: 256 / 32,
    iterations: HASH_ITERATIONS,
    hasher: CryptoJS.algo.SHA256,
  });
  return hash.toString(CryptoJS.enc.Hex);
}

/**
 * Verify a PIN against stored hash
 */
export function verifyPin(pin: string, salt: string, storedHash: string): boolean {
  const computedHash = hashPin(pin, salt);
  // Constant-time comparison to prevent timing attacks
  if (computedHash.length !== storedHash.length) return false;
  let result = 0;
  for (let i = 0; i < computedHash.length; i++) {
    result |= computedHash.charCodeAt(i) ^ storedHash.charCodeAt(i);
  }
  return result === 0;
}

/**
 * Generate a salt for PIN hashing
 */
export async function generatePinSalt(): Promise<string> {
  return generateRandomBytes(16);
}
