// 📦 App.js — SikaKpɛ — VERSION COMPLÈTE CORRIGÉE
import React, { useEffect, useState } from 'react';
import { Platform, View, Text, ActivityIndicator, TouchableOpacity, ScrollView } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import * as SplashScreen from 'expo-splash-screen';
import { Ionicons } from '@expo/vector-icons';

// 🔐 Firebase (config réelle centralisée)
import { db, auth, ensureAuth } from './app/services/firebase';
import { onAuthStateChanged, signInAnonymously } from 'firebase/auth';

// 🖥️ Écrans existants
import DashboardScreen from './app/screens/DashboardScreen';
import ServicesScreen from './app/screens/ServicesScreen';
import SettingsScreen from './app/screens/SettingsScreen';
import AdminScreen from './app/screens/AdminScreen';

// 🛡️ Module Sécurité
import CheckInScreen from './app/screens/CheckInScreen';
import AgencyVerificationScreen from './app/screens/AgencyVerificationScreen';

// ⚙️ Splash screen
SplashScreen.preventAutoHideAsync();

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

// ─────────────────────────────────────────────────────────────
// 🔐 Stack Sécurité
// ─────────────────────────────────────────────────────────────
function SecurityStack() {
  return (
    <Stack.Navigator screenOptions={{ 
      headerStyle: { backgroundColor: '#fff' }, 
      headerTintColor: '#1a202c',
      headerBackTitle: 'Retour'
    }}>
      <Stack.Screen name="SecurityMenu" component={SecurityMenuScreen} options={{ headerShown: false }} />
      <Stack.Screen name="CheckIn" component={CheckInScreen} options={{ title: '📍 Check-in' }} />
      <Stack.Screen name="AgencyVerification" component={AgencyVerificationScreen} options={{ title: '🛡️ Vérification' }} />
    </Stack.Navigator>
  );
}

// ─────────────────────────────────────────────────────────────
// 🧭 Menu Sécurité — DESIGN PRO & ORIENTÉ ACTION (UNIQUE DÉCLARATION)
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

      {/* ℹ️ Info pro */}
      <View style={{ marginTop: 8, padding: 12, backgroundColor: '#fff', borderRadius: 10, borderLeftWidth: 3, borderLeftColor: '#dd6b20' }}>
        <Text style={{ fontSize: 12, color: '#718096', lineHeight: 16 }}>
          🔒 <Text style={{ fontWeight: '500' }}>Confidentialité :</Text> Vos données sont sécurisées et visibles uniquement par l'administration SikaKpɛ.
        </Text>
      </View>
    </View>
  );
}

// ─────────────────────────────────────────────────────────────
// 🧭 Navigation principale (Bottom Tabs)
// ─────────────────────────────────────────────────────────────
function MainTabs() {
  return (
    <Tab.Navigator screenOptions={({ route }) => ({
      tabBarIcon: ({ color, size }) => {
        const icons = {
          Dashboard: 'home-outline',
          Services: 'list-outline',
          Sécurité: 'shield-checkmark-outline',
          Paramètres: 'settings-outline',
          Admin: 'people-outline'
        };
        return <Ionicons name={icons[route.name] || 'circle-outline'} size={size} color={color} />;
      },
      tabBarActiveTintColor: '#1a365d',
      tabBarInactiveTintColor: '#666',
      tabBarStyle: { backgroundColor: '#fff', borderTopColor: '#e2e8f0', paddingBottom: 6, paddingTop: 6, height: 60 },
      headerStyle: { backgroundColor: '#fff', elevation: 0 },
      headerTintColor: '#1a202c'
    })}>
      <Tab.Screen name="Dashboard" component={DashboardScreen} options={{ title: '📊 Tableau de bord' }} />
      <Tab.Screen name="Services" component={ServicesScreen} options={{ title: '📋 Prestations' }} />
      <Tab.Screen name="Sécurité" component={SecurityStack} options={{ title: '🛡️ Sécurité' }} />
      <Tab.Screen name="Paramètres" component={SettingsScreen} options={{ title: '⚙️ Paramètres' }} />
      <Tab.Screen name="Admin" component={AdminScreen} options={{ title: '👮 Admin' }} />
    </Tab.Navigator>
  );
}

// ─────────────────────────────────────────────────────────────
// 🎯 Composant principal App (Auth + Splash + PWA)
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
        setLoading(false);
      }
    };
    initAuth();
  }, []);

  // 🎨 Loading fallback
  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f7fafc' }}>
        <ActivityIndicator size="large" color="#1a365d" />
        <Text style={{ color: '#1a202c', marginTop: 10 }}>Chargement...</Text>
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
  return <AppContent />;
}