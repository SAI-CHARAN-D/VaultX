// VaultX Splash Screen - Entry point with state-driven navigation
import React, { useEffect } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../src/theme/theme';
import { useAuthStore } from '../src/store/authStore';

export default function SplashScreen() {
  const { appState, isLoading, secureData } = useAuthStore();

  useEffect(() => {
    if (isLoading) return;

    // State-driven navigation
    const timer = setTimeout(() => {
      switch (appState) {
        case 'UNAUTHENTICATED':
          router.replace('/auth/signin');
          break;
        case 'AUTHENTICATED':
          // Need to complete setup
          if (!secureData || !secureData.setupComplete) {
            router.replace('/setup/pin');
          } else {
            router.replace('/vault/unlock');
          }
          break;
        case 'VAULT_LOCKED':
          router.replace('/vault/unlock');
          break;
        case 'VAULT_UNLOCKED':
          router.replace('/vault/');
          break;
        case 'DURESS_MODE':
          router.replace('/vault/decoy');
          break;
      }
    }, 1500);

    return () => clearTimeout(timer);
  }, [appState, isLoading, secureData]);

  return (
    <View style={styles.container}>
      <View style={styles.logoContainer}>
        <View style={styles.iconWrapper}>
          <Ionicons name="shield-checkmark" size={64} color={theme.colors.textPrimary} />
        </View>
        <Text style={styles.title}>VaultX</Text>
        <Text style={styles.subtitle}>Zero-Knowledge Document Vault</Text>
      </View>
      
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="small" color={theme.colors.textMuted} />
        <Text style={styles.loadingText}>
          {isLoading ? 'Initializing...' : 'Loading vault...'}
        </Text>
      </View>

      <View style={styles.footer}>
        <Text style={styles.footerText}>End-to-end encrypted</Text>
        <View style={styles.footerDot} />
        <Text style={styles.footerText}>Client-side only</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.lg,
  },
  logoContainer: {
    alignItems: 'center',
  },
  iconWrapper: {
    width: 120,
    height: 120,
    borderRadius: 28,
    backgroundColor: theme.colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: theme.spacing.lg,
  },
  title: {
    fontSize: 36,
    fontWeight: '700',
    color: theme.colors.textPrimary,
    letterSpacing: -1,
  },
  subtitle: {
    fontSize: theme.typography.body.fontSize,
    color: theme.colors.textMuted,
    marginTop: theme.spacing.sm,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: theme.spacing.xxl,
  },
  loadingText: {
    fontSize: theme.typography.bodySmall.fontSize,
    color: theme.colors.textMuted,
    marginLeft: theme.spacing.sm,
  },
  footer: {
    position: 'absolute',
    bottom: 48,
    flexDirection: 'row',
    alignItems: 'center',
  },
  footerText: {
    fontSize: theme.typography.caption.fontSize,
    color: theme.colors.textMuted,
  },
  footerDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: theme.colors.textMuted,
    marginHorizontal: theme.spacing.sm,
  },
});
