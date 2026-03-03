import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function FeedScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.label}>COMMUNITY FEED</Text>
      <Text style={styles.sub}>Coming soon...</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#060d12', alignItems: 'center', justifyContent: 'center' },
  label: { color: '#4dd9ac', fontSize: 11, letterSpacing: 3 },
  sub: { color: '#1a4a35', fontSize: 13, marginTop: 8 },
});