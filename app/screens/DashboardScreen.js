// 📦 app/screens/DashboardScreen.js — COMPTEURS FIABLES + SYNC LOGS
import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { getFirestore, collection, query, onSnapshot } from 'firebase/firestore';

const db = getFirestore();
const COLORS = { primary: '#1a365d', success: '#00aa55', warning: '#dd6b20', error: '#c53030', background: '#f7fafc', card: '#ffffff', text: '#1a202c', textSecondary: '#4a5568' };

export default function DashboardScreen({ navigation }) {
  const [stats, setStats] = useState({ pending: 0, approved: 0, rejected: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(collection(db, 'services'));
    const unsubscribe = onSnapshot(q, 
      (snapshot) => {
        let p = 0, a = 0, r = 0;
        snapshot.forEach(doc => {
          const s = doc.data().status?.toLowerCase();
          if (s === 'pending') p++;
          else if (s === 'approved') a++;
          else if (s === 'rejected') r++;
        });
        console.log(`📊 Dashboard sync: En attente=${p}, Approuvées=${a}, Contestées=${r} (Total: ${snapshot.size})`);
        setStats({ pending: p, approved: a, rejected: r });
        setLoading(false);
      },
      (err) => { console.error('❌ Dashboard listen error:', err); setLoading(false); }
    );
    return () => unsubscribe();
  }, []);

  if (loading) return <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.background }}><ActivityIndicator size="large" color={COLORS.primary} /></View>;

  const statCards = [
    { label: 'En attente', value: stats.pending, icon: 'time-outline', color: COLORS.warning },
    { label: 'Approuvées', value: stats.approved, icon: 'checkmark-circle-outline', color: COLORS.success },
    { label: 'Contestées', value: stats.rejected, icon: 'alert-circle-outline', color: COLORS.error },
  ];

  return (
    <ScrollView style={{ flex: 1, backgroundColor: COLORS.background }} contentContainerStyle={{ padding: 20 }}>
      <Text style={{ fontSize: 26, fontWeight: '700', color: COLORS.primary, marginBottom: 4 }}>🇹🇬 SikaKpɛ</Text>
      <Text style={{ fontSize: 14, color: COLORS.textSecondary, marginBottom: 24 }}>Validation des prestations de gardiennage</Text>

      <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginHorizontal: -8 }}>
        {statCards.map((stat, i) => (
          <View key={i} style={{ flex: 1, minWidth: '48%', margin: 8, backgroundColor: COLORS.card, borderRadius: 16, padding: 16, borderLeftWidth: 4, borderLeftColor: stat.color, elevation: 2 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
              <Ionicons name={stat.icon} size={18} color={stat.color} />
              <Text style={{ marginLeft: 8, fontSize: 13, color: COLORS.textSecondary, fontWeight: '500' }}>{stat.label}</Text>
            </View>
            <Text style={{ fontSize: 28, fontWeight: '700', color: COLORS.primary }}>{stat.value}</Text>
          </View>
        ))}
      </View>

      <Text style={{ fontSize: 18, fontWeight: '600', color: COLORS.text, marginTop: 24, marginBottom: 12 }}>⚡ Actions rapides</Text>
      <TouchableOpacity style={{ backgroundColor: COLORS.card, borderRadius: 16, padding: 16, flexDirection: 'row', alignItems: 'center', marginBottom: 12, elevation: 2 }} onPress={() => navigation.navigate('Services')}>
        <View style={{ width: 44, height: 44, borderRadius: 12, backgroundColor: COLORS.primary, alignItems: 'center', justifyContent: 'center', marginRight: 12 }}><Ionicons name="list-outline" size={22} color="#fff" /></View>
        <View style={{ flex: 1 }}><Text style={{ fontSize: 15, fontWeight: '600', color: COLORS.text }}>Gérer les prestations</Text><Text style={{ fontSize: 13, color: COLORS.textSecondary }}>Approuver ou refuser</Text></View>
        <Ionicons name="chevron-forward" size={18} color={COLORS.textSecondary} />
      </TouchableOpacity>
      <TouchableOpacity style={{ backgroundColor: COLORS.card, borderRadius: 16, padding: 16, flexDirection: 'row', alignItems: 'center', elevation: 2 }} onPress={() => navigation.navigate('Sécurité')}>
        <View style={{ width: 44, height: 44, borderRadius: 12, backgroundColor: COLORS.success, alignItems: 'center', justifyContent: 'center', marginRight: 12 }}><Ionicons name="shield-checkmark-outline" size={22} color="#fff" /></View>
        <View style={{ flex: 1 }}><Text style={{ fontSize: 15, fontWeight: '600', color: COLORS.text }}>Vérifier un gardien</Text><Text style={{ fontSize: 13, color: COLORS.textSecondary }}>Scanner un code</Text></View>
        <Ionicons name="chevron-forward" size={18} color={COLORS.textSecondary} />
      </TouchableOpacity>
    </ScrollView>
  );
}