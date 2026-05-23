import React, { useEffect, useState } from 'react';
import { View, Text, ActivityIndicator } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import * as SplashScreen from 'expo-splash-screen';
import { Ionicons } from '@expo/vector-icons';

import { db, auth, ensureAuth } from './app/services/firebase';
import { onAuthStateChanged } from 'firebase/auth';

import DashboardScreen from './app/screens/DashboardScreen';
import SitesScreen from './app/screens/SitesScreen';
import ReportsScreen from './app/screens/ReportsScreen';
import SubscriptionScreen from './app/screens/SubscriptionScreen';
import CheckInScreen from './app/screens/CheckInScreen';

SplashScreen.preventAutoHideAsync();
const Tab = createBottomTabNavigator();

// ✅ Export direct et correct du composant principal
export default function App() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let unsub;
    const init = async () => {
      try {
        await ensureAuth();
        unsub = onAuthStateChanged(auth, () => setLoading(false));
      } catch (e) {
        console.error('❌ Erreur init:', e);
        setError(e.message);
        setLoading(false);
      }
    };
    init();
    return () => { if (unsub) unsub(); };
  }, []);

  if (error) {
    return (
      <View style={{flex:1,justifyContent:'center',alignItems:'center',padding:20,backgroundColor:'#fff'}}>
        <Text style={{color:'red',fontSize:16,fontWeight:'bold'}}>Erreur Critique</Text>
        <Text style={{color:'#666',marginTop:10,textAlign:'center'}}>{error}</Text>
      </View>
    );
  }

  if (loading) return <View style={{flex:1,justifyContent:'center',alignItems:'center',backgroundColor:'#f7fafc'}}><ActivityIndicator size="large" color="#1a365d" /><Text style={{marginTop:10,color:'#666'}}>Chargement de SikaKpɛ...</Text></View>;

  return (
    <SafeAreaProvider>
      <NavigationContainer>
        <Tab.Navigator screenOptions={({ route }) => ({
          tabBarIcon: ({ color, size }) => {
            const icons = { Dashboard: 'stats-chart-outline', 'Mes Sites': 'location-outline', Rapports: 'document-text-outline', Abonnement: 'card-outline', CheckIn: 'scan-outline' };
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
        </Tab.Navigator>
      </NavigationContainer>
    </SafeAreaProvider>
  );
}
