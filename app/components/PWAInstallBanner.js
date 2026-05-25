import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, Animated, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function PWAInstallBanner() {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [showBanner, setShowBanner] = useState(false);
  const [fadeAnim] = useState(new Animated.Value(0));

  useEffect(() => {
    // On n'affiche ça que sur le Web, pas en natif
    if (Platform.OS !== 'web' || typeof window === 'undefined') return;

    const handler = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      
      // Afficher la bannière après 3 secondes
      setTimeout(() => {
        setShowBanner(true);
        Animated.timing(fadeAnim, { toValue: 1, duration: 500, useNativeDriver: true }).start();
      }, 3000);
    };

    window.addEventListener('beforeinstallprompt', handler);

    // Vérifier si déjà installé
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setShowBanner(false);
    }

    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setShowBanner(false);
    }
    setDeferredPrompt(null);
  };

  const dismiss = () => {
    Animated.timing(fadeAnim, { toValue: 0, duration: 300, useNativeDriver: true }).start(() => setShowBanner(false));
  };

  if (!showBanner) return null;

  return (
    <Animated.View style={{
      position: 'absolute', bottom: 20, left: 16, right: 16,
      backgroundColor: '#1a365d', borderRadius: 16, padding: 16,
      flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
      elevation: 8, shadowColor: '#000', shadowOpacity: 0.3, shadowRadius: 8, shadowOffset: { width: 0, height: 4 },
      opacity: fadeAnim, zIndex: 999
    }}>
      <View style={{ flex: 1, marginRight: 12 }}>
        <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 15 }}>📱 Installer SikaKpɛ</Text>
        <Text style={{ color: '#cbd5e1', fontSize: 12, marginTop: 2 }}>Accès rapide & plein écran</Text>
      </View>
      <TouchableOpacity onPress={handleInstall} style={{ backgroundColor: '#fff', paddingVertical: 8, paddingHorizontal: 14, borderRadius: 8 }}>
        <Text style={{ color: '#1a365d', fontWeight: 'bold', fontSize: 14 }}>Installer</Text>
      </TouchableOpacity>
      <TouchableOpacity onPress={dismiss} style={{ marginLeft: 8, padding: 4 }}>
        <Ionicons name="close-circle" size={20} color="#94a3b8" />
      </TouchableOpacity>
    </Animated.View>
  );
}
