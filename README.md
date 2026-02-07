# VaultX - Zero Knowledge Secure Vault

VaultX is a high-security, zero-knowledge vault application designed to store sensitive documents with military-grade encryption. It features a robust architecture where the server never sees your data in plaintext.

## 🔒 Security Architecture

VaultX is built on a **Zero Knowledge** principle. This means:
*   **Client-Side Encryption:** All files are encrypted on your device *before* they are potentially synced or stored. The backend only ever sees encrypted blobs.
*   **AES-256 + HMAC:** We use AES-256-CBC encryption combined with HMAC-SHA256 for integrity verification.
*   **Ephemeral Master Key:** Your Master Key is derived from your PIN using PBKDF2. **It is never stored on disk.** It exists only in memory while the vault is unlocked.
*   **Sharding:** Encrypted files are split into **3 shards** with random UUIDs. No single shard contains enough information to reconstruct the file.

## ⚡ Key Features

### 🛡️ Duress Mode (Decoy Vault)
Built for extreme situations. You configure two PINs:
1.  **Primary PIN:** Unlocks your real vault.
2.  **Duress PIN:** Unlocks a **Decoy Vault**.
If you are forced to unlock your phone, entering the Duress PIN will show a completely functional, separate vault with fake data. The attacker will never know your real data exists.

### 👆 Biometric Authentication
Seamlessly unlocks your vault using your device's native FaceID or Fingerprint sensor (via `expo-local-authentication`).

## 🛠️ Tech Stack

*   **Frontend:** React Native (Expo), TypeScript, Zustand (State Management).
*   **Cloud & Auth:** Supabase (Auth, Storage, Database).
*   **Architecture:** Serverless / Client-Side heavy.

## 🚀 Getting Started

### Prerequisites
*   Node.js & npm/yarn
*   Supabase Project

### 1. Supabase Setup
This project uses Supabase for Authentication and Storage.

1.  Create a new Supabase project.
2.  Enable **Video/Image/PDF** storage in a bucket named `vault-shards`.
3.  Copy your `SUPABASE_URL` and `SUPABASE_ANON_KEY`.
4.  Update `frontend/src/services/auth/supabaseClient.ts` with your credentials:
    ```typescript
    const SUPABASE_URL = 'your_supabase_url';
    const SUPABASE_ANON_KEY = 'your_supabase_anon_key';
    ```

### 2. Frontend Setup
The mobile application built with Expo.

```bash
cd frontend
# Install dependencies
npm install

# Start the Expo server
npx expo start
```
Press `a` to run on Android Emulator, `i` for iOS Simulator, or scan the QR code with the Expo Go app on your physical device.

## ⚠️ Important Note on Security
Since the Master Key is derived from your PIN and never stored, **if you forget your PIN, your data is lost forever.** There is no "Forgot Password" reset for your encrypted vault. This is by design.
