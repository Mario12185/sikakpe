import React, { useEffect, useState } from 'react';
import { View, Text, ActivityIndicator } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import * as SplashScreen from 'expo-splash-screen';
import { Ionicons } from '@expo/vector-icons';

import { auth } from './app/services/firebase';
import { onAuthStateChanged } from 'firebase/auth';

import DashboardScreen from './app/screens/DashboardScreen';
import SitesScreen from './app/screens/SitesScreen';
import ReportsScreen from './app/screens/ReportsScreen';
import SubscriptionScreen from './app/screens/SubscriptionScreen';
import CheckInScreen from './app/screens/CheckInScreen';
import PublicCheckInScreen from './app/screens/PublicCheckInScreen';
import AuthScreen from './app/screens/AuthScreen';

SplashScreen.preventAutoHideAsync();
const Tab = createBottomTabNavigator();

function MainTabs() {
  return (
    <Tab.Navigator screenOptions={({ route }) => ({
      tabBarIcon: ({ color, size }) => {
        const icons = { Dashboard: 'stats-chart-outline', 'Mes Sites': 'location-outline', Rapports: 'document-text-outline', Abonnement: 'card-outline' };
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
      <Tab.Screen name="CheckIn" component={CheckInScreen} options={{ title: '🛡️ Check-in' }} />
      <Tab.Screen name="CheckInPublic" component={PublicCheckInScreen} options={{ tabBarButton: () => null }} />
    </Tab.Navigator>
  );
}

export default function App() {
  const [user, setUser] = useState(undefined); // undefined = chargement, null = pas connecté, object = connecté

  useEffect(() => {
    // 🔍 Écoute l'état d'authentification SANS forcer de connexion
    const unsub = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser || null);
    });
    return unsub;
  }, []);

  // ⏳ Affiche un loader tant que Firebase vérifie l'état de connexion
  if (user === undefined) {
    return <View style={{flex:1,justifyContent:'center',alignItems:'center',backgroundColor:'#f7fafc'}}><ActivityIndicator size="large" color="#1a365d" /><Text style={{marginTop:10}}>Vérification...</Text></View>;
  }

  return (
    <SafeAreaProvider>
      <NavigationContainer>
        {/* ✅ Si user = null → AuthScreen, sinon → MainTabs */}
        {user ? <MainTabs /> : <AuthScreen />}
      </NavigationContainer>
    </SafeAreaProvider>
  );
}
