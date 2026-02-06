// VaultX Upload Screen - Encrypt & Upload Documents
import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, ScrollView } from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../../src/theme/theme';
import { Button } from '../../src/components/Button';
import { LoadingOverlay } from '../../src/components/LoadingOverlay';
import { useAuthStore } from '../../src/store/authStore';
import { pickDocument, uploadDocument } from '../../src/services/vault/vaultService';
import { checkBucketAccess } from '../../src/services/vault/storageService';
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
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [debugLog, setDebugLog] = useState<string[]>([]);
  
  const { masterKey, user, addDocument } = useAuthStore();

  const addLog = (msg: string) => {
    console.log(msg);
    setDebugLog(prev => [...prev, `${new Date().toLocaleTimeString()}: ${msg}`]);
  };

  const handleSelectFile = async () => {
    setErrorMessage(null);
    addLog('Selecting file...');
    
    const result = await pickDocument();
    
    if (result.success && result.uri) {
      addLog(`File selected: ${result.name}, size: ${result.size}, type: ${result.mimeType}`);
      
      // Check file size (50MB limit)
      if ((result.size || 0) > 50 * 1024 * 1024) {
        setErrorMessage('File too large. Please select a file under 50MB');
        return;
      }
      
      setSelectedFile({
        uri: result.uri,
        name: result.name || 'document',
        mimeType: result.mimeType || 'application/octet-stream',
        size: result.size || 0,
      });
    } else if (result.error && result.error !== 'Cancelled') {
      addLog(`File selection error: ${result.error}`);
      setErrorMessage(result.error);
    }
  };

  const handleTestBucket = async () => {
    addLog('Testing bucket access...');
    const result = await checkBucketAccess();
    if (result.success) {
      addLog('✓ Bucket access OK');
      Alert.alert('Success', 'Storage bucket is accessible!');
    } else {
      addLog(`✗ Bucket error: ${result.error}`);
      setErrorMessage(result.error || 'Bucket not accessible');
      Alert.alert('Error', result.error || 'Bucket not accessible');
    }
  };

  const handleUpload = async () => {
    setErrorMessage(null);
    setDebugLog([]);
    
    if (!selectedFile) {
      setErrorMessage('Please select a file first');
      return;
    }
    
    if (!masterKey) {
      setErrorMessage('Vault is locked. Master key not available.');
      addLog('ERROR: No master key - vault might be locked');
      return;
    }
    
    if (!user) {
      setErrorMessage('Not authenticated. Please sign in.');
      addLog('ERROR: No user - not authenticated');
      return;
    }
    
    setIsUploading(true);
    setProgress({ stage: 'encrypting', progress: 0 });
    
    addLog(`Starting upload for: ${selectedFile.name}`);
    addLog(`User ID: ${user.id}`);
    addLog(`File URI: ${selectedFile.uri}`);
    addLog(`File size: ${selectedFile.size} bytes`);
    addLog(`Master key available: ${!!masterKey}`);
    
    try {
      // First test bucket access
      addLog('Checking bucket access...');
      const bucketCheck = await checkBucketAccess();
      if (!bucketCheck.success) {
        throw new Error(bucketCheck.error || 'Bucket not accessible');
      }
      addLog('✓ Bucket accessible');
      
      addLog('Starting encryption and upload...');
      const result = await uploadDocument(
        selectedFile.uri,
        selectedFile.name,
        selectedFile.mimeType,
        selectedFile.size,
        masterKey,
        user.id,
        (prog) => {
          addLog(`Progress: ${prog.stage} - ${prog.progress}%`);
          setProgress(prog);
        }
      );
      
      addLog(`Upload result: success=${result.success}`);
      
      if (result.success && result.document) {
        addLog('✓ Upload complete! Adding to vault...');
        await addDocument(result.document);
        addLog('✓ Document added to vault');
        
        Alert.alert(
          'Upload Complete',
          `"${selectedFile.name}" has been encrypted and uploaded securely.`,
          [{ text: 'OK', onPress: () => router.back() }]
        );
      } else {
        const error = result.error || 'Unknown error';
        addLog(`✗ Upload failed: ${error}`);
        setErrorMessage(error);
        Alert.alert('Upload Failed', error);
      }
    } catch (error: any) {
      const errorMsg = error.message || 'Unknown error';
      addLog(`✗ Exception: ${errorMsg}`);
      setErrorMessage(errorMsg);
      Alert.alert('Upload Failed', errorMsg);
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
        <TouchableOpacity style={styles.testButton} onPress={handleTestBucket}>
          <Ionicons name="checkmark-circle-outline" size={24} color={theme.colors.textSecondary} />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
        {/* Status indicators */}
        <View style={styles.statusBar}>
          <View style={styles.statusItem}>
            <Ionicons 
              name={user ? "checkmark-circle" : "close-circle"} 
              size={16} 
              color={user ? theme.colors.successText : theme.colors.errorText} 
            />
            <Text style={styles.statusText}>Auth: {user ? 'OK' : 'No'}</Text>
          </View>
          <View style={styles.statusItem}>
            <Ionicons 
              name={masterKey ? "checkmark-circle" : "close-circle"} 
              size={16} 
              color={masterKey ? theme.colors.successText : theme.colors.errorText} 
            />
            <Text style={styles.statusText}>Key: {masterKey ? 'OK' : 'No'}</Text>
          </View>
        </View>

        {/* Error message */}
        {errorMessage && (
          <View style={styles.errorBox}>
            <Ionicons name="alert-circle" size={20} color={theme.colors.errorText} />
            <Text style={styles.errorText}>{errorMessage}</Text>
          </View>
        )}

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

        {/* Debug log */}
        {debugLog.length > 0 && (
          <View style={styles.debugBox}>
            <Text style={styles.debugTitle}>Debug Log:</Text>
            {debugLog.map((log, i) => (
              <Text key={i} style={styles.debugText}>{log}</Text>
            ))}
          </View>
        )}
      </ScrollView>

      <View style={styles.footer}>
        {selectedFile ? (
          <Button
            title="Encrypt & Upload"
            onPress={handleUpload}
            loading={isUploading}
            disabled={!masterKey || !user}
          />
        ) : (
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
  testButton: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: theme.spacing.lg,
  },
  statusBar: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: theme.spacing.md,
    gap: theme.spacing.lg,
  },
  statusItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statusText: {
    fontSize: theme.typography.caption.fontSize,
    color: theme.colors.textMuted,
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: theme.colors.error,
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    marginBottom: theme.spacing.md,
  },
  errorText: {
    flex: 1,
    fontSize: theme.typography.bodySmall.fontSize,
    color: theme.colors.errorText,
    marginLeft: theme.spacing.sm,
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
  debugBox: {
    marginTop: theme.spacing.lg,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
  },
  debugTitle: {
    fontSize: theme.typography.caption.fontSize,
    fontWeight: '600',
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.sm,
  },
  debugText: {
    fontSize: 11,
    color: theme.colors.textMuted,
    fontFamily: 'monospace',
    marginBottom: 2,
  },
  footer: {
    padding: theme.spacing.lg,
  },
});
