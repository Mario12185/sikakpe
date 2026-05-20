// app/components/InstallPrompt.js
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';

export default function InstallPrompt({ style }) {
  const { theme } = useTheme();
  const [installable, setInstallable] = useState(false);
  const [installed, setInstalled] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState(null);

  useEffect(() => {
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      const handleBeforeInstall = (e) => {
        e.preventDefault();
        setDeferredPrompt(e);
        setInstallable(true);
        console.log('💡 PWA installable detected');
      };
      const handleInstalled = () => {
        setInstalled(true);
        setInstallable(false);
        setDeferredPrompt(null);
        console.log('✅ PWA installed');
      };
      window.addEventListener('beforeinstallprompt', handleBeforeInstall);
      window.addEventListener('appinstalled', handleInstalled);
      return () => {
        window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
        window.removeEventListener('appinstalled', handleInstalled);
      };
    }
  }, []);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      console.log(`📦 Installation ${outcome}`);
      setDeferredPrompt(null);
      setInstallable(false);
    }
  };

  if (Platform.OS !== 'web' || installed || !installable) return null;

  return (
    <View style={[styles.container, style]}>
      <View style={[styles.card, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}>
        <MaterialIcons name="download" size={24} color={theme.colors.primary} />
        <View style={styles.textContainer}>
          <Text style={[styles.title, { color: theme.colors.textPrimary }]}>Installer SikaKpɛ</Text>
          <Text style={[styles.subtitle, { color: theme.colors.textSecondary }]}>
            Ajoute l'app à ton écran d'accueil pour un accès rapide 🇹🇬
          </Text>
        </View>
        <TouchableOpacity style={[styles.btn, { backgroundColor: theme.colors.primary }]} onPress={handleInstallClick}>
          <Text style={styles.btnText}>Installer</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { paddingHorizontal: 16, paddingVertical: 8 },
  card: { flexDirection: 'row', alignItems: 'center', padding: 12, borderRadius: 12, borderWidth: 1, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 },
  textContainer: { flex: 1, marginLeft: 12, marginRight: 8 },
  title: { fontSize: 14, fontWeight: '600' },
  subtitle: { fontSize: 11, marginTop: 2 },
  btn: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 8 },
  btnText: { color: '#FFF', fontWeight: '600', fontSize: 13 }
});
