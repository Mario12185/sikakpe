// 📦 App.js — SikaKpɛ (Version avec module Sécurité)
import React, { useEffect, useState } from 'react';
import { Platform, StyleSheet, View, Text, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import * as SplashScreen from 'expo-splash-screen';
import { Ionicons } from '@expo/vector-icons';
// 🎨 Design System Global
import theme from './src/theme/designSystem';

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
// 🧭 Menu Sécurité — DESIGN SYSTEM GLOBAL
// ─────────────────────────────────────────────────────────────
function SecurityMenuScreen({ navigation }) {
  const { colors, spacing, typography, components } = theme;

  return (
    <View style={{ flex: 1, backgroundColor: colors.background, padding: spacing.lg }}>
      
      {/* 🎯 En-tête */}
      <View style={{ marginBottom: spacing.xl }}>
        <Text style={{ 
          fontSize: typography.sizes.xxl, 
          fontWeight: typography.weights.bold, 
          color: colors.primary,
          marginBottom: spacing.sm
        }}>
          🛡️ Sécurité & Contrôle
        </Text>
        <Text style={{ 
          fontSize: typography.sizes.md, 
          color: colors.textSecondary, 
          lineHeight: 22 
        }}>
          Validez la présence des gardiens et gérez les agréments des agences partenaires.
        </Text>
      </View>

      {/* 📍 Carte Check-in QR/GPS */}
      <TouchableOpacity 
        style={components.card}
        onPress={() => navigation.navigate('CheckIn')}
        activeOpacity={0.85}
      >
        <Text style={{ fontSize: 32, marginBottom: spacing.md }}>📍</Text>
        <Text style={{ 
          fontSize: typography.sizes.lg, 
          fontWeight: typography.weights.semibold, 
          color: colors.text, 
          marginBottom: spacing.xs 
        }}>
          Check-in QR/GPS
        </Text>
        <Text style={{ 
          fontSize: typography.sizes.sm, 
          color: colors.textSecondary, 
          lineHeight: 20, 
          marginBottom: spacing.md 
        }}>
          Le gardien scanne le QR Code du site pour valider sa présence. 
          Vérification automatique de l'identité et de la localisation.
        </Text>
        <View style={components.buttonPrimary}>
          <Text style={components.buttonPrimaryText}>→ Commencer un check-in</Text>
        </View>
      </TouchableOpacity>

      {/* 🛡️ Carte Vérification Agence */}
      <TouchableOpacity 
        style={{ ...components.card, borderLeftColor: colors.success }}
        onPress={() => navigation.navigate('AgencyVerification')}
        activeOpacity={0.85}
      >
        <Text style={{ fontSize: 32, marginBottom: spacing.md }}>🛡️</Text>
        <Text style={{ 
          fontSize: typography.sizes.lg, 
          fontWeight: typography.weights.semibold, 
          color: colors.text, 
          marginBottom: spacing.xs 
        }}>
          Vérification d'Agence
        </Text>
        <Text style={{ 
          fontSize: typography.sizes.sm, 
          color: colors.textSecondary, 
          lineHeight: 20, 
          marginBottom: spacing.md 
        }}>
          Soumettez vos documents légaux (licence, NINA, assurance) pour obtenir 
          le badge ✅ "Agence Vérifiée" visible par vos clients.
        </Text>
        <View style={{ ...components.buttonPrimary, backgroundColor: colors.success }}>
          <Text style={components.buttonPrimaryText}>→ Soumettre mes documents</Text>
        </View>
      </TouchableOpacity>

      {/* ℹ️ Info complémentaire */}
      <View style={{ 
        marginTop: spacing.sm, 
        padding: spacing.md, 
        backgroundColor: '#ebf8ff', 
        borderRadius: 12,
        borderLeftWidth: 4,
        borderLeftColor: colors.info
      }}>
        <Text style={{ color: colors.primary, fontSize: 13, lineHeight: 18 }}>
          💡 <Text style={{ fontWeight: typography.weights.semibold }}>Astuce :</Text> Pour tester le check-in, 
          générez un QR Code avec le texte `SITE-TEST-001` et assurez-vous que le site 
          existe dans Firestore avec ses coordonnées GPS.
        </Text>
      </View>
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