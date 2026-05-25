import React, { useEffect, useState } from 'react';
import { View, Text, ActivityIndicator } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import { auth, db } from './app/services/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';

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

// 🚧 Écran Paywall si abonnement inactif
function PaywallScreen() {
  return (
    <View style={{flex:1, backgroundColor:'#f7fafc', justifyContent:'center', alignItems:'center', padding:20}}>
      <View style={{backgroundColor:'#fff', padding:24, borderRadius:16, elevation:4, maxWidth:400, alignItems:'center'}}>
        <Text style={{fontSize:32, marginBottom:12}}>🔒</Text>
        <Text style={{fontSize:20, fontWeight:'bold', color:'#1a365d', textAlign:'center', marginBottom:8}}>Accès restreint</Text>
        <Text style={{color:'#666', textAlign:'center', marginBottom:20, lineHeight:22}}>
          Votre abonnement est inactif ou expiré. 
          Veuillez le renouveler pour accéder au tableau de bord et à vos outils d'audit.
        </Text>
        <Text style={{fontSize:14, color:'#999', textAlign:'center'}}>SikaKpɛ • Audit de sécurité indépendant 🇹🇬</Text>
      </View>
    </View>
  );
}

export default function App() {
  const [user, setUser] = useState(undefined);
  const [subStatus, setSubStatus] = useState('checking'); // 'checking' | 'active' | 'inactive'

  useEffect(() => {
    const unsubAuth = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (!currentUser) { setSubStatus('inactive'); return; }
      
      try {
        const snap = await getDoc(doc(db, 'subscriptions', currentUser.uid));
        if (snap.exists()) {
          const data = snap.data();
          const expiresAt = data.expiresAt?.toDate ? data.expiresAt.toDate() : null;
          const isActive = data.status === 'active' && expiresAt && expiresAt > new Date();
          setSubStatus(isActive ? 'active' : 'inactive');
        } else {
          setSubStatus('inactive');
        }
      } catch (e) {
        console.error('❌ Sub check failed:', e);
        setSubStatus('inactive');
      }
    });

    // 🔒 Fallback sécurité : si Firestore met > 4s, on affiche Paywall
    const timer = setTimeout(() => { if (subStatus === 'checking') setSubStatus('inactive'); }, 4000);
    return () => { unsubAuth(); clearTimeout(timer); };
  }, []);

  if (user === undefined || subStatus === 'checking') {
    return <View style={{flex:1,justifyContent:'center',alignItems:'center',backgroundColor:'#f7fafc'}}><ActivityIndicator size="large" color="#1a365d" /><Text style={{marginTop:10}}>Vérification de votre accès...</Text></View>;
  }

  return (
    <SafeAreaProvider>
      <NavigationContainer>
        {!user ? <AuthScreen /> : subStatus === 'active' ? <MainTabs /> : <PaywallScreen />}
      </NavigationContainer>
    </SafeAreaProvider>
  );
}
