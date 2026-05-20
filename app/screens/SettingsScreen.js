// app/screens/SettingsScreen.js
import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';

export default function SettingsScreen() {
  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>⚙️ Paramètres</Text>
        <Text style={styles.subtitle}>Personnaliser SikaKpɛ</Text>
      </View>
      <View style={styles.card}>
        <Text style={styles.cardText}>✅ Fonctionnalité en développement</Text>
        <Text style={styles.cardText}>🔜 Bientôt disponible :</Text>
        <Text style={styles.bullet}>• Mode sombre / clair</Text>
        <Text style={styles.bullet}>• Notifications push</Text>
        <Text style={styles.bullet}>• Gestion du compte</Text>
        <Text style={styles.bullet}>• Langue (Français / Ewe / Kabye)</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F0F4FF' },
  header: { padding: 20, backgroundColor: '#1E40AF', borderBottomLeftRadius: 20, borderBottomRightRadius: 20 },
  title: { fontSize: 22, fontWeight: 'bold', color: '#FFF' },
  subtitle: { fontSize: 14, color: 'rgba(255,255,255,0.8)', marginTop: 4 },
  card: { margin: 16, padding: 16, backgroundColor: '#FFF', borderRadius: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 3, elevation: 2 },
  cardText: { fontSize: 14, color: '#1E293B', marginBottom: 8 },
  bullet: { fontSize: 13, color: '#64748B', marginLeft: 8, marginBottom: 4 }
});