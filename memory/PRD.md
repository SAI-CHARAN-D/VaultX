# VaultX - Zero-Knowledge Document Vault

## Product Overview
VaultX is a zero-knowledge document vault mobile application built with Expo/React Native. All security guarantees are enforced client-side, with Supabase used ONLY for user authentication and encrypted blob storage.

## Security Architecture

### Zero-Knowledge Principles
- **Server sees only encrypted blobs** - No plaintext data ever leaves the device
- **Keys never stored on server** - Master key derived on-device from PIN
- **No metadata on server** - File names, types, and associations stored locally only
- **Duress PIN support** - Opens fake vault under threat

### Encryption Flow
1. **Key Derivation**: PBKDF2-HMAC-SHA256 with 100,000 iterations
2. **Document Encryption**: AES-256-CBC + HMAC authentication
3. **File Encryption Key (FEK)**: Random 256-bit key per document
4. **FEK Protection**: Encrypted with Master Key
5. **Sharding**: Each encrypted file split into 3 shards

### Security Components
- `/src/services/crypto/keyDerivation.ts` - PBKDF2 master key derivation
- `/src/services/crypto/encryption.ts` - AES-256 encryption/decryption
- `/src/services/crypto/sharding.ts` - File splitting into 3 shards
- `/src/services/crypto/pinHash.ts` - Secure PIN hashing

## Features

### Authentication
- Supabase email/password authentication (identity only)
- Biometric authentication (Face ID, Touch ID, Fingerprint)
- PIN-based vault unlock
- Duress PIN for fake vault access

### Document Management
- Upload PDF and image documents (up to 50MB)
- Client-side encryption before upload
- Secure in-memory viewing
- Cloud sync via encrypted shards

### Privacy Protection
- Dark mode UI (reduces screen visibility)
- No thumbnails before decryption
- Documents only decrypted in memory
- No persistent plaintext storage

## Screens

| Screen | Route | Purpose |
|--------|-------|---------|
| Splash | `/` | App entry, state-driven navigation |
| Sign In | `/auth/signin` | Supabase authentication |
| Sign Up | `/auth/signup` | Create new account |
| PIN Setup | `/setup/pin` | Create primary & duress PIN |
| Biometric Setup | `/setup/biometric` | Enable biometric unlock |
| Vault Unlock | `/vault/unlock` | PIN entry to unlock |
| Vault Home | `/vault/` | Document list |
| Upload | `/vault/upload` | Encrypt & upload documents |
| Viewer | `/vault/viewer` | Secure document viewing |
| Decoy Vault | `/vault/decoy` | Fake vault for duress mode |
| Settings | `/vault/settings` | App configuration |
| Error | `/error` | Tamper detection alert |

## State Model

```
UNAUTHENTICATED → Sign in/up required
AUTHENTICATED → Needs vault setup or unlock
VAULT_LOCKED → PIN entry required
VAULT_UNLOCKED → Full vault access
DURESS_MODE → Fake vault displayed
```

## Supabase Configuration

### Required Setup
1. Create Supabase project
2. Enable email/password authentication
3. Create private storage bucket: `vault-shards`

### Security Notes
- Supabase stores ONLY:
  - User credentials (hashed)
  - Encrypted shards (random UUID names)
- Supabase NEVER stores:
  - Encryption keys
  - PINs or salts
  - File metadata

## Tech Stack

- **Frontend**: Expo/React Native
- **State**: Zustand
- **Auth**: Supabase Auth
- **Storage**: Supabase Storage
- **Crypto**: CryptoJS (AES-256-CBC + HMAC)
- **Biometrics**: expo-local-authentication
- **Secure Storage**: expo-secure-store

## Dark Theme

```javascript
// Color Palette
background: '#0F0F0F'    // Pure black
surface: '#1E1E1E'       // Dark grey
text: '#EDEDED'          // Soft white
muted: '#BDBDBD'         // Grey
accent: '#4A4A4A'        // Subtle neutral
```

## Attacker Analysis

If Supabase is compromised, attacker sees:
- Random UUID blob files
- No file extensions or names
- No association between shards
- No decryption keys
- Cannot reconstruct original files

## Build Commands

```bash
# Development
cd frontend && yarn start

# iOS build
eas build --platform ios

# Android build  
eas build --platform android
```
