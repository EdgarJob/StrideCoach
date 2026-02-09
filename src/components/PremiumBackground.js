import React from 'react';
import { View, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

import colors from '../theme/colors';

export default function PremiumBackground({ children }) {
  return (
    <View style={styles.container}>
      <LinearGradient
        colors={[colors.bgTop, colors.background]}
        start={{ x: 0.12, y: 0 }}
        end={{ x: 0.9, y: 1 }}
        style={StyleSheet.absoluteFill}
      />

      {/* Soft brand blobs to avoid a flat background */}
      <View pointerEvents="none" style={[styles.blob, styles.blobA]} />
      <View pointerEvents="none" style={[styles.blob, styles.blobB]} />

      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  blob: {
    position: 'absolute',
    width: 320,
    height: 320,
    borderRadius: 999,
    opacity: 1,
    transform: [{ rotate: '18deg' }],
  },
  blobA: {
    top: -170,
    right: -160,
    backgroundColor: colors.primaryAlpha20,
  },
  blobB: {
    bottom: -200,
    left: -180,
    backgroundColor: colors.accentAlpha14,
  },
});

