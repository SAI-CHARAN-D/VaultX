// File Sharding Service - Zero Knowledge Vault
// Splits encrypted files into 3 shards with no metadata

const SHARD_COUNT = 3;

// Simple UUID generator for React Native
function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

export interface Shard {
  id: string; // Random UUID, no relation to original file
  data: string; // Base64 chunk of encrypted data
  index: number; // Position for reassembly (stored locally only)
}

/**
 * Split encrypted data into 3 shards
 * Each shard has a random UUID filename - no metadata preserved
 */
export function splitIntoShards(encryptedData: string): Shard[] {
  const dataLength = encryptedData.length;
  const baseSize = Math.ceil(dataLength / SHARD_COUNT);
  
  const shards: Shard[] = [];
  
  for (let i = 0; i < SHARD_COUNT; i++) {
    const start = i * baseSize;
    const end = Math.min((i + 1) * baseSize, dataLength);
    const chunk = encryptedData.substring(start, end);
    
    shards.push({
      id: uuidv4(), // Random UUID - no relation to original file
      data: chunk,
      index: i,
    });
  }
  
  return shards;
}

/**
 * Reassemble shards back into encrypted data
 * Shards must be provided in correct order (by index)
 */
export function reassembleShards(shards: Shard[]): string {
  // Sort by index to ensure correct order
  const sortedShards = [...shards].sort((a, b) => a.index - b.index);
  
  // Validate we have all shards
  if (sortedShards.length !== SHARD_COUNT) {
    throw new Error(`Expected ${SHARD_COUNT} shards, got ${sortedShards.length}`);
  }
  
  // Validate indices are sequential
  for (let i = 0; i < SHARD_COUNT; i++) {
    if (sortedShards[i].index !== i) {
      throw new Error(`Missing shard at index ${i}`);
    }
  }
  
  // Concatenate data
  return sortedShards.map(s => s.data).join('');
}

// Simple UUID generator for React Native
function uuidv4(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}
