# 🔐 VaultX — Zero-Knowledge Secure Document Vault

VaultX is a high-security document vault designed under a hostile threat model.
We assume servers can be breached, devices can be stolen, and users can be coerced.

VaultX follows a strict zero-knowledge architecture — the backend never sees
plaintext data, encryption keys, or meaningful file structure.

---

## 🧠 Security Philosophy

VaultX is built on defense in depth, not trust in any single layer.

Rather than assuming encryption alone is sufficient, VaultX increases the
attacker’s cost across multiple dimensions:
- Cryptographic
- Structural
- Behavioral (real-world coercion)

---

## 🔒 Security Architecture

### Zero-Knowledge by Design

- All encryption is performed client-side
- The backend stores only encrypted, opaque binary blobs
- The server has no capability to decrypt or interpret user data

---

### Cryptography & Key Handling

- Encryption: AES-256-CBC  
- Integrity: HMAC-SHA256 (Encrypt-then-MAC)  
- Key Derivation: PBKDF2 (derived from user PIN)

#### Ephemeral Master Key

- The Master Key is derived only at unlock time
- It is never written to disk
- It exists only in memory while the vault is unlocked
- When the app is locked or backgrounded, the key is destroyed

This eliminates long-lived key exposure.

---

### Structural Fragmentation (Client-Side Sharding)

VaultX protects not only data confidentiality, but also data reconstructability.

After encryption:
- Each file is fragmented into 3 independent shards
- Each shard is assigned a random UUID
- No single shard contains enough information to reconstruct the file

This raises the cost of attack even if storage or metadata is partially compromised.

Encryption protects content.  
Fragmentation protects structure.

---

## ⚡ Core Features

### 🛡️ Duress Mode (Decoy Vault)

VaultX explicitly accounts for physical coercion scenarios.

Users configure two valid PINs:
1. Primary PIN → unlocks the real vault  
2. Duress PIN → unlocks a plausible decoy vault  

The decoy vault:
- behaves like a normal vault
- contains non-sensitive placeholder data
- provides no indication that a real vault exists

This allows safe compliance under coercion.

---

### 👆 Biometric Authentication

VaultX supports native biometric authentication (Face ID / Fingerprint).

- Biometrics act as a convenience gate, not a cryptographic key
- All cryptographic material is still derived from the PIN
- Uses the device’s secure hardware interface

---

## 🛠️ Tech Stack (Hybrid Cloud)

VaultX uses a hybrid architecture to balance security, scalability, and performance.

### 📱 Frontend (Client)
- **Framework:** React Native (Expo)
- **Language:** TypeScript
- **State Management:** Zustand
- **Encryption:** `crypto-js` (Client-side)

### ☁️ Infrastructure (Supabase)
- **Authentication:** Handles user identity and session management
- **Storage:** Stores encrypted file shards (Binary Blobs)
- **Database:** PostgreSQL (via Supabase) for app metadata

### ⚙️ Application Backend (Python)
- **Framework:** FastAPI
- **Database:** MongoDB (AsyncIOMotor) for high-performance logs and analytics
- **Role:** Handles business logic, complex data processing, and potential future server-side verification (Zero Knowledge Proofs).

---

## 🚀 Getting Started

### Prerequisites
- Node.js
- Python 3.8+
- Expo CLI
- Supabase Project
- MongoDB Instance (Local or Atlas)

---

### 1. Supabase Setup

1. Create a new Supabase project  
2. Create a storage bucket named `vault-shards`  
3. Enable binary storage (PDF / image / video)  
4. Copy your project credentials  

Update `frontend/src/services/auth/supabaseClient.ts`:

```typescript
const SUPABASE_URL = 'your_supabase_url';
const SUPABASE_ANON_KEY = 'your_supabase_anon_key';
```

---

### 2. Python Backend Setup

The FastAPI backend handles core application logic.

```bash
cd backend
# Install dependencies
pip install -r requirements.txt

# Configure environment variables
# Create a .env file with:
# MONGO_URL=your_mongodb_url
# DB_NAME=vaultx

# Start the server
uvicorn server:app --reload
```
Runs on `http://localhost:8000`.

---

### 3. Frontend Setup

```bash
cd frontend
# Install dependencies
npm install

# Start the Expo server
npx expo start
```

Run on:
- Android Emulator (press `a`)
- iOS Simulator (press `i`)
- Physical device via Expo Go

---

## ⚠️ Important Security Note (Intentional Tradeoff)

VaultX does not support account recovery.

Because:
- encryption keys are never stored
- the server has zero knowledge
- there is no trusted recovery authority

Forgetting your PIN permanently destroys access to your data.

This is a deliberate design decision, prioritizing confidentiality over
recoverability — similar to hardware wallets and high-assurance security systems.

---

## 🏁 Summary

- Zero-knowledge, client-side encryption
- Structural fragmentation to raise attack cost
- Explicit handling of physical coercion threats
- Clear and intentional security tradeoffs

VaultX is designed for users who assume the worst.
