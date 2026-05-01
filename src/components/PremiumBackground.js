import React from 'react';
import { View, StyleSheet } from 'react-native';

import colors from '../theme/colors';

export default function PremiumBackground({ children }) {
  return (
    <View style={styles.container}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
});
