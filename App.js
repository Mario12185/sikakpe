// 📦 App.js — SikaKpɛ (Version avec module Sécurité)
import React, { useEffect, useState } from 'react';
import { Platform, StyleSheet, View, Text, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import * as SplashScreen from 'expo-splash-screen';
import { Ionicons } from '@expo/vector-icons';

// 🔐 Firebase
import { auth, db } from './app/services/firebase';
import { signInAnonymously, onAuthStateChanged, signOut } from 'firebase/auth';

// 🎨 Contexte Thème
import { ThemeProvider, useTheme } from './app/context/ThemeContext';

// 🖥️ Écrans existants (adapte les chemins si nécessaire)
import DashboardScreen from './app/screens/DashboardScreen';
import ServicesScreen from './app/screens/ServicesScreen';
import SettingsScreen from './app/screens/SettingsScreen';

// 🛡️ NOUVEAUX ÉCRANS — Module Sécurité
import CheckInScreen from './src/screens/CheckInScreen';
import AgencyVerificationScreen from './src/screens/AgencyVerificationScreen';

// ⚙️ Prévention du splash screen auto
SplashScreen.preventAutoHideAsync();

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

// ─────────────────────────────────────────────────────────────
// 🔐 Stack pour l'onglet "Sécurité" — VERSION SANS useTheme (CORRIGÉ)
// ─────────────────────────────────────────────────────────────
function SecurityStack() {
  // 🎨 Couleurs fixes (pas de useTheme pour éviter les crashes)
  const colors = {
    card: '#ffffff',
    text: '#000000',
    background: '#f5f5f5'
  };

  return (
    <Stack.Navigator 
      screenOptions={{ 
        headerStyle: { backgroundColor: colors.card }, 
        headerTintColor: colors.text,
        headerBackTitle: 'Retour'
      }}
    >
      <Stack.Screen 
        name="SecurityMenu" 
        component={SecurityMenuScreen} 
        options={{ title: '🛡️ Sécurité', headerShown: false }} 
      />
      <Stack.Screen 
        name="CheckIn" 
        component={CheckInScreen} 
        options={{ title: '📍 Check-in QR/GPS', headerShown: true }} 
      />
      <Stack.Screen 
        name="AgencyVerification" 
        component={AgencyVerificationScreen} 
        options={{ title: '🛡️ Vérification Agence', headerShown: true }} 
      />
    </Stack.Navigator>
  );
}

// ─────────────────────────────────────────────────────────────
// 🧭 Menu principal de l'onglet Sécurité — VERSION SIMPLIFIÉE
// ─────────────────────────────────────────────────────────────
function SecurityMenuScreen({ navigation }) {
  // 🔐 Couleurs avec fallback sécurisé (pas de useTheme pour éviter les bugs)
  const colors = {
    background: '#f5f5f5',
    card: '#ffffff',
    text: '#000000',
    textSecondary: '#666666',
  };

  return (
    <View style={{ flex: 1, padding: 20, backgroundColor: colors.background }}>
      <Text style={{ fontSize: 22, fontWeight: 'bold', marginBottom: 8, color: colors.text }}>
        🛡️ Module Sécurité
      </Text>
      <Text style={{ fontSize: 14, color: colors.textSecondary, marginBottom: 24, lineHeight: 20 }}>
        Contrôlez la présence des gardiens et vérifiez les agréments des agences.
      </Text>
      
      {/* 📍 Carte Check-in QR/GPS */}
      <TouchableOpacity 
        style={{
          padding: 20,
          backgroundColor: colors.card,
          borderRadius: 12,
          marginBottom: 16,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.1,
          shadowRadius: 4,
          elevation: 3,
        }}
        onPress={() => navigation.navigate('CheckIn')}
      >
        <Text style={{ fontSize: 24, marginBottom: 8 }}>📍</Text>
        <Text style={{ fontSize: 18, fontWeight: '600', color: colors.text, marginBottom: 4 }}>
          Check-in QR/GPS
        </Text>
        <Text style={{ fontSize: 13, color: colors.textSecondary, lineHeight: 18 }}>
          Scanner le QR du site pour valider la présence du gardien
        </Text>
      </TouchableOpacity>

      {/* 🛡️ Carte Vérification Agence */}
      <TouchableOpacity 
        style={{
          padding: 20,
          backgroundColor: colors.card,
          borderRadius: 12,
          marginBottom: 16,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.1,
          shadowRadius: 4,
          elevation: 3,
        }}
        onPress={() => navigation.navigate('AgencyVerification')}
      >
        <Text style={{ fontSize: 24, marginBottom: 8 }}>🛡️</Text>
        <Text style={{ fontSize: 18, fontWeight: '600', color: colors.text, marginBottom: 4 }}>
          Vérification Agence
        </Text>
        <Text style={{ fontSize: 13, color: colors.textSecondary, lineHeight: 18 }}>
          Uploader les documents légaux pour obtenir le badge "Vérifié"
        </Text>
      </TouchableOpacity>
    </View>
  );
}

// ─────────────────────────────────────────────────────────────
// 🧭 Navigation principale (Bottom Tabs) — CORRIGÉ
// ─────────────────────────────────────────────────────────────
function MainTabs() {
  // 🔐 Sécurité : récupérer le thème avec fallback robuste
  let colors = {
    background: '#f5f5f5',
    card: '#ffffff',
    text: '#000000',
    textSecondary: '#666666',
    border: '#e0e0e0'
  };
  let isDark = false;
  
  try {
    const theme = useTheme?.();
    if (theme?.colors) colors = theme.colors;
    if (typeof theme?.isDark === 'boolean') isDark = theme.isDark;
  } catch (e) {
    // Fallback silencieux si le contexte n'est pas prêt
    console.warn('⚠️ Theme context not ready, using defaults');
  }

  // 🎨 Options des onglets (avec couleurs sécurisées)
  const getTabOptions = ({ route }) => ({
    tabBarIcon: ({ color, size }) => {
      const icons = {
        Dashboard: 'home-outline',
        Services: 'list-outline',
        Sécurité: 'shield-checkmark-outline',
        Paramètres: 'settings-outline',
      };
      return <Ionicons name={icons[route.name] || 'circle-outline'} size={size} color={color} />;
    },
    tabBarActiveTintColor: '#0066CC',
    tabBarInactiveTintColor: colors.textSecondary || '#666666',
    tabBarStyle: { 
      backgroundColor: colors.card || '#ffffff', 
      borderTopColor: colors.border || '#e0e0e0' 
    },
    headerStyle: { 
      backgroundColor: colors.card || '#ffffff' 
    },
    headerTintColor: colors.text || '#000000',
  });
  
  return (
    <Tab.Navigator screenOptions={getTabOptions}>
      <Tab.Screen name="Dashboard" component={DashboardScreen} options={{ title: '📊 Tableau de bord' }} />
      <Tab.Screen name="Services" component={ServicesScreen} options={{ title: '📋 Prestations' }} />
      <Tab.Screen name="Sécurité" component={SecurityStack} options={{ title: '🛡️ Sécurité' }} />
      <Tab.Screen name="Paramètres" component={SettingsScreen} options={{ title: '⚙️ Paramètres' }} />
    </Tab.Navigator>
  );
}

/// ─────────────────────────────────────────────────────────────
// 🎯 Composant principal App (avec Auth + PWA + Splash) — CORRIGÉ
// ─────────────────────────────────────────────────────────────
function AppContent() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // 🔐 Sécurité : récupérer le thème avec fallback
  const themeContext = useTheme?.() || {};
  const colors = themeContext.colors || {
    background: '#ffffff',
    card: '#ffffff',
    text: '#000000',
    textSecondary: '#666666',
    border: '#eeeeee'
  };
  const isDark = themeContext.isDark || false;

  // 🎯 Effet PWA + Splash Screen (Sécurisé Android & Web) — INCHANGÉ
  useEffect(() => {
    const hideSplash = async () => {
      try {
        await new Promise(resolve => setTimeout(resolve, 500));
        await SplashScreen.hideAsync();
      } catch (e) { /* Ignore si splash déjà caché */ }
    };
    hideSplash();

    // 📲 Prompt PWA (UNIQUEMENT sur Web)
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      const handleInstall = (e) => {
        e.preventDefault();
        window.deferredPrompt = e;
      };
      const handleInstalled = () => {
        window.deferredPrompt = null;
      };
      
      window.addEventListener('beforeinstallprompt', handleInstall);
      window.addEventListener('appinstalled', handleInstalled);

      return () => {
        window.removeEventListener('beforeinstallprompt', handleInstall);
        window.removeEventListener('appinstalled', handleInstalled);
      };
    }
  }, []);

  // 🔐 Auth Firebase anonyme
  useEffect(() => {
    const initAuth = async () => {
      try {
        const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
          setUser(currentUser);
          setLoading(false);
        });
        if (!auth.currentUser) {
          await signInAnonymously(auth);
        }
        return unsubscribe;
      } catch (e) {
        console.error('❌ Auth error:', e);
        Alert.alert('Erreur de connexion', 'Veuillez réessayer.');
        setLoading(false);
      }
    };
    initAuth();
  }, []);

  // 🎨 Fallback visuel pendant le chargement
  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background }}>
        <ActivityIndicator size="large" color="#0066CC" />
        <Text style={{ color: colors.text, marginTop: 10 }}>Chargement...</Text>
      </View>
    );
  }

  return (
    <SafeAreaProvider>
      <NavigationContainer>
        <MainTabs />
      </NavigationContainer>
    </SafeAreaProvider>
  );
}

// ─────────────────────────────────────────────────────────────
// 🎨 Styles
// ─────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: { flex: 1, padding: 20 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 8 },
  desc: { fontSize: 14, marginBottom: 24, lineHeight: 20 },
  card: {
    padding: 20,
    borderRadius: 12,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardTitle: { fontSize: 18, fontWeight: '600', marginTop: 12, marginBottom: 4 },
  cardDesc: { fontSize: 13, lineHeight: 18 },
});

// ─────────────────────────────────────────────────────────────
// 🚀 Export final (avec ThemeProvider)
// ─────────────────────────────────────────────────────────────
export default function App() {
  return (
    <ThemeProvider>
      <AppContent />
    </ThemeProvider>
  );
}