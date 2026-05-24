import React, { useEffect, useState } from 'react';
import { View, Text, ActivityIndicator } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import { auth } from './app/services/firebase';
import { onAuthStateChanged } from 'firebase/auth';

import AuthScreen from './app/screens/AuthScreen';
import DashboardScreen from './app/screens/DashboardScreen';
import SitesScreen from './app/screens/SitesScreen';
import ReportsScreen from './app/screens/ReportsScreen';
import SubscriptionScreen from './app/screens/SubscriptionScreen';
import CheckInScreen from './app/screens/CheckInScreen';
import PublicCheckInScreen from './app/screens/PublicCheckInScreen';
import SettingsScreen from './app/screens/SettingsScreen';

const Tab = createBottomTabNavigator();

function MainTabs() {
  return (
    <Tab.Navigator screenOptions={({ route }) => ({
      tabBarIcon: ({ color, size }) => {
        const icons = { Dashboard: 'stats-chart-outline', 'Mes Sites': 'location-outline', Rapports: 'document-text-outline', Abonnement: 'card-outline', Paramètres: 'settings-outline' };
        return <Ionicons name={icons[route.name] || 'circle-outline'} size={size} color={color} />;
      },
      tabBarActiveTintColor: '#1a365d', tabBarInactiveTintColor: '#999',
      tabBarStyle: { backgroundColor: '#fff', borderTopColor: '#eee', height: 60, paddingBottom: 5 },
      headerStyle: { backgroundColor: '#fff', elevation: 0 }, headerTintColor: '#1a202c'
    })}>
      <Tab.Screen name="Dashboard" component={DashboardScreen} options={{ title: '📊 Tableau de bord' }} />
      <Tab.Screen name="Mes Sites" component={SitesScreen} options={{ title: '📍 Mes Sites' }} />
      <Tab.Screen name="Rapports" component={ReportsScreen} options={{ title: '📋 Rapports' }} />
      <Tab.Screen name="Abonnement" component={SubscriptionScreen} options={{ title: '💳 Abonnement' }} />
      <Tab.Screen name="Paramètres" component={SettingsScreen} options={{ title: '⚙️ Paramètres' }} />
      <Tab.Screen name="CheckIn" component={CheckInScreen} options={{ title: '🛡️ Check-in' }} />
      <Tab.Screen name="CheckInPublic" component={PublicCheckInScreen} options={{ tabBarButton: () => null }} />
    </Tab.Navigator>
  );
}

export default function App() {
  const [user, setUser] = useState(undefined);
  const [initializing, setInitializing] = useState(true);

  useEffect(() => {
    console.log('🔄 App mounted - setting up auth listeners');
    
    // 🔐 1. Vérification SYNCHRONE immédiate (fallback principal)
    const checkCurrentUser = () => {
      const current = auth.currentUser;
      console.log('🔍 auth.currentUser check:', current ? 'CONNECTÉ' : 'NON CONNECTÉ');
      if (current) {
        setUser(current);
        setInitializing(false);
      }
    };
    
    // Exécution immédiate
    checkCurrentUser();

    // 🔐 2. Listener onAuthStateChanged (secours)
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      console.log('🔐 onAuthStateChanged fired | user:', currentUser ? 'CONNECTÉ' : 'NON CONNECTÉ');
      setUser(currentUser || null);
      setInitializing(false);
    });

    // 🔐 3. Fallback asynchrone 500ms après (couvre le cas Web où l'événement est manqué)
    const fallbackTimer = setTimeout(() => {
      if (initializing) {
        console.log('⏳ Fallback async check triggered');
        checkCurrentUser();
        if (initializing) {
          console.warn('⚠️ Auth still initializing after fallback - forcing AuthScreen');
          setInitializing(false);
          setUser(null);
        }
      }
    }, 500);

    return () => {
      unsubscribe();
      clearTimeout(fallbackTimer);
    };
  }, []);

  // ⏳ Loader pendant l'initialisation
  if (initializing || user === undefined) {
    return <View style={{flex:1,justifyContent:'center',alignItems:'center',backgroundColor:'#f7fafc'}}><ActivityIndicator size="large" color="#1a365d" /><Text style={{marginTop:10}}>Initialisation...</Text></View>;
  }

  console.log('🎨 Rendering decision | user:', user ? 'CONNECTÉ → MainTabs' : 'NON CONNECTÉ → AuthScreen');

  return (
    <SafeAreaProvider>
      <NavigationContainer>
        {user ? <MainTabs /> : <AuthScreen />}
      </NavigationContainer>
    </SafeAreaProvider>
  );
}
