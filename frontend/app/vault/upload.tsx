// VaultX Upload Screen - Encrypt & Upload Documents
import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../../src/theme/theme';
import { Button } from '../../src/components/Button';
import { LoadingOverlay } from '../../src/components/LoadingOverlay';
import { useAuthStore } from '../../src/store/authStore';
import { pickDocument, uploadDocument } from '../../src/services/vault/vaultService';
import type { UploadProgress } from '../../src/types';

export default function UploadScreen() {
  const [selectedFile, setSelectedFile] = useState<{
    uri: string;
    name: string;
    mimeType: string;
    size: number;
  } | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState<UploadProgress | null>(null);
  
  const { masterKey, user, addDocument } = useAuthStore();

  const handleSelectFile = async () => {
    const result = await pickDocument();
    
    if (result.success && result.uri) {
      // Check file size (50MB limit)
      if ((result.size || 0) > 50 * 1024 * 1024) {
        Alert.alert('File Too Large', 'Please select a file under 50MB');
        return;
      }
      
      setSelectedFile({
        uri: result.uri,
        name: result.name || 'document',
        mimeType: result.mimeType || 'application/octet-stream',
        size: result.size || 0,
      });
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      Alert.alert('Error', 'Please select a file first');
      return;
    }
    
    if (!masterKey) {
      Alert.alert('Error', 'Vault is locked. Please unlock first.');
      router.replace('/vault/unlock');
      return;
    }
    
    if (!user) {
      Alert.alert('Error', 'Not authenticated. Please sign in.');
      router.replace('/auth/signin');
      return;
    }
    
    setIsUploading(true);
    setProgress({ stage: 'encrypting', progress: 0 });
    
    console.log('Starting upload for:', selectedFile.name);
    console.log('User ID:', user.id);
    console.log('Master key available:', !!masterKey);
    
    try {
      const result = await uploadDocument(
        selectedFile.uri,
        selectedFile.name,
        selectedFile.mimeType,
        selectedFile.size,
        masterKey,
        user.id,
        (prog) => {
          console.log('Progress:', prog);
          setProgress(prog);
        }
      );
      
      console.log('Upload result:', result);
      
      if (result.success && result.document) {
        await addDocument(result.document);
        Alert.alert(
          'Upload Complete',
          `"${selectedFile.name}" has been encrypted and uploaded securely.`,
          [{ text: 'OK', onPress: () => router.back() }]
        );
      } else {
        console.error('Upload failed:', result.error);
        Alert.alert('Upload Failed', result.error || 'Unknown error. Check if vault-shards bucket exists in Supabase.');
      }
    } catch (error: any) {
      console.error('Upload exception:', error);
      Alert.alert('Upload Failed', error.message || 'Unknown error');
    } finally {
      setIsUploading(false);
      setProgress(null);
    }
  };

  const formatSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const getProgressMessage = (): string => {
    if (!progress) return 'Processing...';
    
    switch (progress.stage) {
      case 'encrypting':
        return `Encrypting... ${progress.progress}%`;
      case 'sharding':
        return `Splitting into shards... ${progress.progress}%`;
      case 'uploading':
        return `Uploading shard ${progress.currentShard}/${progress.totalShards}...`;
      default:
        return 'Processing...';
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={theme.colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Upload Document</Text>
        <View style={styles.placeholder} />
      </View>

      <View style={styles.content}>
        {!selectedFile ? (
          <TouchableOpacity style={styles.dropzone} onPress={handleSelectFile} activeOpacity={0.7}>
            <View style={styles.dropzoneIcon}>
              <Ionicons name="cloud-upload-outline" size={48} color={theme.colors.textMuted} />
            </View>
            <Text style={styles.dropzoneTitle}>Select a Document</Text>
            <Text style={styles.dropzoneSubtitle}>PDF or Image up to 50MB</Text>
          </TouchableOpacity>
        ) : (
          <View style={styles.selectedFile}>
            <View style={styles.fileIcon}>
              <Ionicons
                name={selectedFile.mimeType.startsWith('image/') ? 'image' : 'document-text'}
                size={32}
                color={theme.colors.textPrimary}
              />
            </View>
            <View style={styles.fileInfo}>
              <Text style={styles.fileName} numberOfLines={2}>{selectedFile.name}</Text>
              <Text style={styles.fileSize}>{formatSize(selectedFile.size)}</Text>
            </View>
            <TouchableOpacity style={styles.removeButton} onPress={() => setSelectedFile(null)}>
              <Ionicons name="close-circle" size={24} color={theme.colors.textMuted} />
            </TouchableOpacity>
          </View>
        )}

        <View style={styles.securityInfo}>
          <View style={styles.securityItem}>
            <Ionicons name="lock-closed" size={16} color={theme.colors.textMuted} />
            <Text style={styles.securityText}>AES-256 encryption</Text>
          </View>
          <View style={styles.securityItem}>
            <Ionicons name="git-branch" size={16} color={theme.colors.textMuted} />
            <Text style={styles.securityText}>Split into 3 shards</Text>
          </View>
          <View style={styles.securityItem}>
            <Ionicons name="cloud-offline" size={16} color={theme.colors.textMuted} />
            <Text style={styles.securityText}>Server sees only encrypted blobs</Text>
          </View>
        </View>
      </View>

      <View style={styles.footer}>
        {selectedFile && (
          <Button
            title="Encrypt & Upload"
            onPress={handleUpload}
            loading={isUploading}
          />
        )}
        {!selectedFile && (
          <Button
            title="Select Document"
            onPress={handleSelectFile}
          />
        )}
      </View>
      
      <LoadingOverlay
        visible={isUploading}
        message={getProgressMessage()}
        progress={progress?.progress}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  backButton: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: theme.typography.h3.fontSize,
    fontWeight: theme.typography.h3.fontWeight,
    color: theme.colors.textPrimary,
  },
  placeholder: {
    width: 44,
  },
  content: {
    flex: 1,
    padding: theme.spacing.lg,
  },
  dropzone: {
    borderWidth: 2,
    borderColor: theme.colors.border,
    borderStyle: 'dashed',
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.xxl,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dropzoneIcon: {
    width: 80,
    height: 80,
    borderRadius: 20,
    backgroundColor: theme.colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: theme.spacing.lg,
  },
  dropzoneTitle: {
    fontSize: theme.typography.h3.fontSize,
    fontWeight: theme.typography.h3.fontWeight,
    color: theme.colors.textPrimary,
  },
  dropzoneSubtitle: {
    fontSize: theme.typography.body.fontSize,
    color: theme.colors.textMuted,
    marginTop: theme.spacing.sm,
  },
  selectedFile: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.lg,
  },
  fileIcon: {
    width: 56,
    height: 56,
    borderRadius: 14,
    backgroundColor: theme.colors.surfaceHighlight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  fileInfo: {
    flex: 1,
    marginLeft: theme.spacing.md,
  },
  fileName: {
    fontSize: theme.typography.body.fontSize,
    fontWeight: '500',
    color: theme.colors.textPrimary,
  },
  fileSize: {
    fontSize: theme.typography.caption.fontSize,
    color: theme.colors.textMuted,
    marginTop: theme.spacing.xs,
  },
  removeButton: {
    padding: theme.spacing.sm,
  },
  securityInfo: {
    marginTop: theme.spacing.xl,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.lg,
  },
  securityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  securityText: {
    fontSize: theme.typography.bodySmall.fontSize,
    color: theme.colors.textMuted,
    marginLeft: theme.spacing.md,
  },
  footer: {
    padding: theme.spacing.lg,
  },
});
