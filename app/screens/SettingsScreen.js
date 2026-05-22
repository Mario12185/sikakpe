// 📦 app/screens/SettingsScreen.js — MVP
import React from 'react';
import { View, Text, TouchableOpacity, Alert, Switch } from 'react-native';
import { auth } from '../services/firebase';

const COLORS = { primary: '#1a365d', background: '#f7fafc', card: '#ffffff', text: '#1a202c', textSecondary: '#4a5568', border: '#e2e8f0' };

export default function SettingsScreen() {
  const [darkMode, setDarkMode] = React.useState(false);

  const handleLogout = () => {
    Alert.alert('🔐 Déconnexion', 'Voulez-vous vraiment vous déconnecter ?', [
      { text: 'Annuler', style: 'cancel' },
      { text: 'Déconnecter', style: 'destructive', onPress: async () => { await auth.signOut(); Alert.alert('✅ Déconnecté', 'À bientôt sur SikaKpɛ'); } }
    ]);
  };

  return (
    <View style={{ flex: 1, backgroundColor: COLORS.background, padding: 20 }}>
      <Text style={{ fontSize: 24, fontWeight: '700', color: COLORS.primary, marginBottom: 24 }}>⚙️ Paramètres</Text>
      
      {/* Profil */}
      <View style={{ backgroundColor: COLORS.card, borderRadius: 16, padding: 16, marginBottom: 16, elevation: 2 }}>
        <Text style={{ fontSize: 14, color: COLORS.textSecondary, marginBottom: 4 }}>Compte</Text>
        <Text style={{ fontSize: 16, fontWeight: '600', color: COLORS.text }}>{auth.currentUser?.uid ? 'Connecté (anonyme)' : 'Non connecté'}</Text>
      </View>

      {/* Préférences */}
      <Text style={{ fontSize: 16, fontWeight: '600', color: COLORS.text, marginBottom: 12 }}>Préférences</Text>
      <View style={{ backgroundColor: COLORS.card, borderRadius: 16, padding: 16, marginBottom: 16, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', elevation: 2 }}>
        <View><Text style={{ fontSize: 15, fontWeight: '500', color: COLORS.text }}>Mode sombre</Text><Text style={{ fontSize: 13, color: COLORS.textSecondary }}>Activer l'affichage sombre</Text></View>
        <Switch value={darkMode} onValueChange={setDarkMode} trackColor={{ false: COLORS.border, true: COLORS.primary }} thumbColor="#fff" />
      </View>

      {/* Informations */}
      <Text style={{ fontSize: 16, fontWeight: '600', color: COLORS.text, marginBottom: 12 }}>Informations</Text>
      <View style={{ backgroundColor: COLORS.card, borderRadius: 16, padding: 16, marginBottom: 16, elevation: 2 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8 }}><Text style={{ color: COLORS.textSecondary }}>Version</Text><Text style={{ color: COLORS.text }}>1.0.0</Text></View>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8, borderTopWidth: 1, borderTopColor: COLORS.border }}><Text style={{ color: COLORS.textSecondary }}>Support</Text><Text style={{ color: COLORS.primary }}>support@sikakpe.tg</Text></View>
      </View>

      {/* Déconnexion */}
      <TouchableOpacity style={{ backgroundColor: COLORS.error, paddingVertical: 14, borderRadius: 12, alignItems: 'center' }} onPress={handleLogout}><Text style={{ color: '#fff', fontWeight: '600', fontSize: 16 }}>🔐 Se déconnecter</Text></TouchableOpacity>
    </View>
  );
}