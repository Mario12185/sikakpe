import React, { useEffect, useState } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { SafeAreaProvider } from 'react-native-safe-area-context';
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

export default function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      if (!u) signInAnonymously(auth).catch(console.warn);
      setUser(u);
      setLoading(false);
    });
    return unsub;
  }, []);

  if (loading || !user) return <View style={styles.center}><ActivityIndicator size="large" color="#1E40AF" /></View>;

  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <NavigationContainer>
          <Tab.Navigator screenOptions={({ route }) => ({
            headerShown: false,
            tabBarActiveTintColor: '#1E40AF',
            tabBarInactiveTintColor: '#64748B',
            tabBarLabelStyle: { fontSize: 11, fontWeight: '600' },
            tabBarIcon: ({ color, size }) => {
              const icons = { Dashboard: 'dashboard', Services: 'security', Reports: 'assessment', Settings: 'settings' };
              return <MaterialIcons name={icons[route.name] || 'home'} size={size} color={color} />;
            }
          })}>
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

const styles = StyleSheet.create({ center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F0F4FF' } });