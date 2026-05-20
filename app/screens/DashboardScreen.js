import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { collection, onSnapshot } from 'firebase/firestore';
import { db } from '../services/firebase';
import { useTheme } from '../context/ThemeContext';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import InstallPrompt from '../components/InstallPrompt';

export default function DashboardScreen({ navigation }) {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const [stats, setStats] = useState({ pending: 0, validated: 0, disputed: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'services'), (snap) => {
      const data = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      setStats({
        pending: data.filter(s => s.status === 'pending').length,
        validated: data.filter(s => s.status === 'validated').length,
        disputed: data.filter(s => s.status === 'disputed').length,
      });
      setLoading(false);
    });
    return () => unsub();
  }, []);

  const StatCard = ({ icon, label, count, color, bg }) => (
    <View style={[styles.statCard, { backgroundColor: bg }]}>
      <MaterialIcons name={icon} size={24} color={color} />
      <Text style={[styles.statCount, { color }]}>{count}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );

  if (loading) return <View style={styles.center}><ActivityIndicator size="large" color={theme.colors.primary} /></View>;

  return (
    <ScrollView style={[styles.container, { paddingTop: insets.top + 10, backgroundColor: theme.colors.background }]}>
      <View style={[styles.header, { backgroundColor: theme.colors.primary }]}>
        <Text style={styles.headerTitle}>ðŸ‡¹ðŸ‡¬ SikaKpÉ›</Text>
        <Text style={styles.headerSub}>Validation des prestations de gardiennage</Text>
      </View>
    <InstallPrompt />
    <View style={styles.statsRow}>
        <StatCard icon="hourglass-empty" label="En attente" count={stats.pending} color={theme.colors.warning} bg="#FFFBEB" />
        <StatCard icon="check-circle" label="ApprouvÃ©es" count={stats.validated} color={theme.colors.success} bg="#ECFDF5" />
        <StatCard icon="cancel" label="ContestÃ©es" count={stats.disputed} color={theme.colors.error} bg="#FEF2F2" />
      </View>

      <TouchableOpacity style={styles.fab} onPress={() => navigation.navigate('Services')}>
        <MaterialIcons name="list-alt" size={24} color="#FFF" />
        <Text style={styles.fabText}>Voir toutes les prestations</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { padding: 20, paddingBottom: 30, borderBottomLeftRadius: 20, borderBottomRightRadius: 20 },
  headerTitle: { fontSize: 24, fontWeight: 'bold', color: '#FFF', marginBottom: 4 },
  headerSub: { fontSize: 14, color: 'rgba(255,255,255,0.8)' },
  statsRow: { flexDirection: 'row', paddingHorizontal: 16, marginTop: -15, justifyContent: 'space-between' },
  statCard: { flex: 1, marginHorizontal: 4, padding: 16, borderRadius: 12, alignItems: 'center', shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 5, elevation: 2 },
  statCount: { fontSize: 26, fontWeight: 'bold', marginVertical: 4 },
  statLabel: { fontSize: 12, textAlign: 'center', color: '#64748B' },
  fab: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#1E40AF', margin: 20, padding: 14, borderRadius: 12, shadowColor: '#000', shadowOpacity: 0.2, shadowRadius: 6, elevation: 4 },
  fabText: { color: '#FFF', fontWeight: 'bold', fontSize: 15, marginLeft: 8 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' }
});
