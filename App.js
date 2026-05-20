// App.js - SikaKpɛ 🇹🇬
import React, { useEffect, useState } from 'react';
import { View, ActivityIndicator, StyleSheet, Platform } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import * as SplashScreen from 'expo-splash-screen';
import { auth, db } from './app/services/firebase';
import { signInAnonymously, onAuthStateChanged } from 'firebase/auth';
import { ThemeProvider } from './app/context/ThemeContext';
import { MaterialIcons } from '@expo/vector-icons';

// Screens
import DashboardScreen from './app/screens/DashboardScreen';
import ServicesScreen from './app/screens/ServicesScreen';
import ReportsScreen from './app/screens/ReportsScreen';
import SettingsScreen from './app/screens/SettingsScreen';

const Tab = createBottomTabNavigator();

// 🎬 Empêcher le masquage automatique du splash screen (le temps que l'app charge)
SplashScreen.preventAutoHideAsync();

export default function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // 🔐 Auth Firebase + 📱 PWA + 🎬 SplashScreen
  useEffect(() => {
    // 1. Auth Firebase (anonyme)
    const unsub = onAuthStateChanged(auth, (u) => {
      if (!u) signInAnonymously(auth).catch(console.warn);
      setUser(u);
      setLoading(false);
    });

    // 2. Masquer le splash screen après 500ms (le temps que l'UI se rende)
    const hideSplash = async () => {
      await new Promise(resolve => setTimeout(resolve, 500));
      await SplashScreen.hideAsync();
    };
    hideSplash();

    // 3. 📲 Prompt d'installation PWA (Chrome/Edge desktop & Android)
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      // Événement : l'app peut être installée
      window.addEventListener('beforeinstallprompt', (e) => {
        e.preventDefault(); // Empêche le prompt automatique du navigateur
        // Stocke pour un bouton "Installer" personnalisé (optionnel)
        window.deferredPrompt = e;
        console.log('💡 SikaKpɛ est installable : [⋮] → Installer l\'application');
      });

      // Événement : l'app a été installée
      window.addEventListener('appinstalled', () => {
        console.log('✅ SikaKpɛ installé en PWA !');
        window.deferredPrompt = null;
      });

      // Détecter le mode d'affichage (pour debug)
      if (window.matchMedia('(display-mode: standalone)').matches) {
        console.log('📱 SikaKpɛ lancé en mode PWA (standalone)');
      }
    }

    // Cleanup
    return () => {
      unsub();
      if (Platform.OS === 'web' && typeof window !== 'undefined') {
        window.removeEventListener('beforeinstallprompt', () => {});
        window.removeEventListener('appinstalled', () => {});
      }
    };
  }, []);

  // 🔄 Écran de chargement pendant l'init Firebase
  if (loading || !user) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#1E40AF" />
      </View>
    );
  }

  // 🎯 Interface principale avec navigation par onglets
  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <NavigationContainer>
          <Tab.Navigator 
            screenOptions={({ route }) => ({
              headerShown: false,
              tabBarActiveTintColor: '#1E40AF',
              tabBarInactiveTintColor: '#64748B',
              tabBarLabelStyle: { fontSize: 11, fontWeight: '600' },
              tabBarIcon: ({ color, size }) => {
                const icons = { 
                  Dashboard: 'dashboard', 
                  Services: 'security', 
                  Reports: 'assessment', 
                  Settings: 'settings' 
                };
                return <MaterialIcons name={icons[route.name] || 'home'} size={size} color={color} />;
              }
            })}
          >
            <Tab.Screen name="Dashboard" component={DashboardScreen} />
            <Tab.Screen name="Services" component={ServicesScreen} />
            <Tab.Screen name="Reports" component={ReportsScreen} />
            <Tab.Screen name="Settings" component={SettingsScreen} />
          </Tab.Navigator>
        </NavigationContainer>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({ 
  center: { 
    flex: 1, 
    justifyContent: 'center', 
    alignItems: 'center', 
    backgroundColor: '#F0F4FF' 
  } 
});