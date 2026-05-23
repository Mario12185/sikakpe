// 📦 App.js — SikaKpɛ — DESIGN PRO GARANTI (sans dépendance thème externe)
import React, { useEffect, useState } from 'react';
import { Platform, StyleSheet, View, Text, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import * as SplashScreen from 'expo-splash-screen';
import { Ionicons } from '@expo/vector-icons';
import AdminScreen from './app/screens/AdminScreen';

// 🔐 Firebase
import { auth, db } from './app/services/firebase';
import { signInAnonymously, onAuthStateChanged } from 'firebase/auth';

// 🎨 Contexte Thème (optionnel — fallback intégré)
import { ThemeProvider, useTheme } from './app/context/ThemeContext';

// 🖥️ Écrans existants
import DashboardScreen from './app/screens/DashboardScreen';
import ServicesScreen from './app/screens/ServicesScreen';
import SettingsScreen from './app/screens/SettingsScreen';

// 🛡️ Module Sécurité
// ✅ CHEMIN CORRECT (app/screens existe)
import CheckInScreen from './app/screens/CheckInScreen';
import AgencyVerificationScreen from './app/screens/AgencyVerificationScreen';

// ⚙️ Splash screen
SplashScreen.preventAutoHideAsync();

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

// ─────────────────────────────────────────────────────────────
// 🎨 PALETTE PRO — UTILISÉE PARTOUT (garantie cohérence)
// ─────────────────────────────────────────────────────────────
const COLORS = {
  primary: '#1a365d',        // Bleu marine - autorité
  primaryLight: '#2c5282',   // Bleu moyen - hover
  success: '#00aa55',        // Vert - validation
  warning: '#dd6b20',        // Orange - attention
  error: '#c53030',          // Rouge - erreur
  background: '#f7fafc',     // Fond clair
  card: '#ffffff',           // Cartes
  text: '#1a202c',           // Texte principal
  textSecondary: '#4a5568',  // Texte secondaire
  border: '#e2e8f0',         // Bordures
};

// 🔐 Stack Sécurité (dans App.js)
function SecurityStack() {
  return (
    <Stack.Navigator screenOptions={{ headerStyle: { backgroundColor: '#fff' }, headerTintColor: '#1a202c' }}>
      <Stack.Screen name="SecurityMenu" component={SecurityMenuScreen} options={{ headerShown: false }} />
      <Stack.Screen name="CheckIn" component={CheckInScreen} options={{ title: '📍 Check-in' }} />
      <Stack.Screen name="AgencyVerification" component={AgencyVerificationScreen} options={{ title: '🛡️ Vérification' }} />
    </Stack.Navigator>
  );
}

// 🧭 Menu Sécurité (simple)
function SecurityMenuScreen({ navigation }) {
  return (
    <View style={{ flex: 1, padding: 20, backgroundColor: '#f7fafc' }}>
      <Text style={{ fontSize: 24, fontWeight: 'bold', color: '#1a365d', marginBottom: 8 }}>🛡️ Sécurité & Contrôle</Text>
      <Text style={{ color: '#666', marginBottom: 24 }}>Validez la présence des gardiens et gérez les agréments.</Text>
      
      <TouchableOpacity 
        style={{ backgroundColor: '#fff', padding: 20, borderRadius: 16, marginBottom: 16, borderLeftWidth: 4, borderLeftColor: '#1a365d', elevation: 2 }}
        onPress={() => navigation.navigate('CheckIn')}
      >
        <Text style={{ fontSize: 18, fontWeight: '600' }}>📍 Check-in QR/GPS</Text>
        <Text style={{ color: '#666', marginTop: 4 }}>Scanner ou saisir un code de site</Text>
      </TouchableOpacity>
      
      <TouchableOpacity 
        style={{ backgroundColor: '#fff', padding: 20, borderRadius: 16, borderLeftWidth: 4, borderLeftColor: '#00aa55', elevation: 2 }}
        onPress={() => navigation.navigate('AgencyVerification')}
      >
        <Text style={{ fontSize: 18, fontWeight: '600' }}>🛡️ Vérification Agence</Text>
        <Text style={{ color: '#666', marginTop: 4 }}>Soumettre vos documents légaux</Text>
      </TouchableOpacity>
    </View>
  );
}

// ─────────────────────────────────────────────────────────────
// 🧭 Menu Sécurité — DESIGN PRO & ORIENTÉ ACTION
// ─────────────────────────────────────────────────────────────
function SecurityMenuScreen({ navigation }) {
  return (
    <View style={{ flex: 1, backgroundColor: '#f7fafc', padding: 20 }}>
      
      {/* 🎯 En-tête */}
      <View style={{ marginBottom: 24 }}>
        <Text style={{ fontSize: 24, fontWeight: '700', color: '#1a365d', marginBottom: 6 }}>🛡️ Sécurité & Contrôle</Text>
        <Text style={{ fontSize: 14, color: '#4a5568', lineHeight: 20 }}>
          Validez la présence des gardiens et gérez les agréments des agences partenaires.
        </Text>
      </View>

      {/* 📍 Carte Check-in QR/GPS */}
      <TouchableOpacity 
        style={{
          backgroundColor: '#ffffff', borderRadius: 16, padding: 20, marginBottom: 16,
          borderLeftWidth: 4, borderLeftColor: '#1a365d',
          shadowColor: '#1a365d', shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.08, shadowRadius: 8, elevation: 3
        }}
        onPress={() => navigation.navigate('CheckIn')}
        activeOpacity={0.8}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 10 }}>
          <View style={{ width: 44, height: 44, borderRadius: 10, backgroundColor: '#ebf8ff', justifyContent: 'center', alignItems: 'center', marginRight: 12 }}>
            <Text style={{ fontSize: 22 }}>📍</Text>
          </View>
          <Text style={{ fontSize: 17, fontWeight: '600', color: '#1a202c' }}>Check-in QR/GPS</Text>
        </View>
        <Text style={{ fontSize: 13, color: '#4a5568', marginBottom: 14, lineHeight: 18 }}>
          Saisissez ou scannez le code du site pour enregistrer votre arrivée et valider votre présence.
        </Text>
        <View style={{ backgroundColor: '#1a365d', paddingVertical: 10, paddingHorizontal: 14, borderRadius: 8, alignSelf: 'flex-start' }}>
          <Text style={{ color: '#fff', fontWeight: '600', fontSize: 14 }}>→ Commencer le check-in</Text>
        </View>
      </TouchableOpacity>

      {/* 🛡️ Carte Vérification Agence */}
      <TouchableOpacity 
        style={{
          backgroundColor: '#ffffff', borderRadius: 16, padding: 20, marginBottom: 16,
          borderLeftWidth: 4, borderLeftColor: '#00aa55',
          shadowColor: '#00aa55', shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.08, shadowRadius: 8, elevation: 3
        }}
        onPress={() => navigation.navigate('AgencyVerification')}
        activeOpacity={0.8}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 10 }}>
          <View style={{ width: 44, height: 44, borderRadius: 10, backgroundColor: '#d1fae5', justifyContent: 'center', alignItems: 'center', marginRight: 12 }}>
            <Text style={{ fontSize: 22 }}>🛡️</Text>
          </View>
          <Text style={{ fontSize: 17, fontWeight: '600', color: '#1a202c' }}>Vérification Agence</Text>
        </View>
        <Text style={{ fontSize: 13, color: '#4a5568', marginBottom: 14, lineHeight: 18 }}>
          Uploadez vos documents légaux (licence, NINA, assurance) pour obtenir le badge "Agence Vérifiée".
        </Text>
        <View style={{ backgroundColor: '#00aa55', paddingVertical: 10, paddingHorizontal: 14, borderRadius: 8, alignSelf: 'flex-start' }}>
          <Text style={{ color: '#fff', fontWeight: '600', fontSize: 14 }}>→ Soumettre mes documents</Text>
        </View>
      </TouchableOpacity>

      {/* ℹ️ Info pro (remplace l'astuce dév) */}
      <View style={{ marginTop: 8, padding: 12, backgroundColor: '#fff', borderRadius: 10, borderLeftWidth: 3, borderLeftColor: '#dd6b20' }}>
        <Text style={{ fontSize: 12, color: '#718096', lineHeight: 16 }}>
          🔒 <Text style={{ fontWeight: '500' }}>Confidentialité :</Text> Vos données de présence et documents sont sécurisés et visibles uniquement par l'administration SikaKpɛ.
        </Text>
      </View>

    </View>
  );
}

// ─────────────────────────────────────────────────────────────
// 🧭 Navigation principale (Bottom Tabs) — COULEURS GARANTIES
// ─────────────────────────────────────────────────────────────
function MainTabs() {
  // 🎨 Fallback sécurisé pour le thème (optionnel)
  let themeColors = COLORS;
  try {
    const theme = useTheme?.();
    if (theme?.colors) themeColors = { ...COLORS, ...theme.colors };
  } catch (e) {
    console.warn('⚠️ Theme non disponible, utilisation des couleurs par défaut');
  }

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
    tabBarActiveTintColor: COLORS.primary,        // ← Bleu marine pro
    tabBarInactiveTintColor: COLORS.textSecondary,
    tabBarStyle: { 
      backgroundColor: COLORS.card, 
      borderTopColor: COLORS.border,
      paddingBottom: 6,
      paddingTop: 6,
      height: 60
    },
    headerStyle: { backgroundColor: COLORS.card, elevation: 0, shadowOpacity: 0 },
    headerTintColor: COLORS.text,
    headerTitleStyle: { fontWeight: '600', fontSize: 17 }
  });
  
  return (
    <Tab.Navigator screenOptions={getTabOptions}>
      <Tab.Screen name="Dashboard" component={DashboardScreen} options={{ title: '📊 Tableau de bord' }} />
      <Tab.Screen name="Services" component={ServicesScreen} options={{ title: '📋 Prestations' }} />
      <Tab.Screen name="Sécurité" component={SecurityStack} options={{ title: '🛡️ Sécurité' }} />
      <Tab.Screen name="Paramètres" component={SettingsScreen} options={{ title: '⚙️ Paramètres' }} />
      <Tab.Screen name="Admin" component={AdminScreen} options={{ title: '👮 Admin' }} />
    </Tab.Navigator>
  );
}

// ─────────────────────────────────────────────────────────────
// 🎯 Composant principal App (Auth + PWA + Splash)
// ─────────────────────────────────────────────────────────────
function AppContent() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // 🎯 Splash + PWA
  useEffect(() => {
    const hideSplash = async () => {
      try {
        await new Promise(resolve => setTimeout(resolve, 500));
        await SplashScreen.hideAsync();
      } catch (e) { /* Ignore */ }
    };
    hideSplash();

    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      const handleInstall = (e) => { e.preventDefault(); window.deferredPrompt = e; };
      const handleInstalled = () => { window.deferredPrompt = null; };
      window.addEventListener('beforeinstallprompt', handleInstall);
      window.addEventListener('appinstalled', handleInstalled);
      return () => {
        window.removeEventListener('beforeinstallprompt', handleInstall);
        window.removeEventListener('appinstalled', handleInstalled);
      };
    }
  }, []);

  // 🔐 Auth Firebase
  useEffect(() => {
    const initAuth = async () => {
      try {
        const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
          setUser(currentUser);
          setLoading(false);
        });
        if (!auth.currentUser) await signInAnonymously(auth);
        return unsubscribe;
      } catch (e) {
        console.error('❌ Auth error:', e);
        Alert.alert('Erreur de connexion', 'Veuillez réessayer.');
        setLoading(false);
      }
    };
    initAuth();
  }, []);

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.background }}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={{ color: COLORS.text, marginTop: 10, fontSize: 14 }}>Chargement...</Text>
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
// 🚀 Export final
// ─────────────────────────────────────────────────────────────
export default function App() {
  return (
    <ThemeProvider>
      <AppContent />
    </ThemeProvider>
  );
}