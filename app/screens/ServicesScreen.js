import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, TextInput, ActivityIndicator, Modal } from 'react-native';
import { collection, onSnapshot, doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../services/firebase';
import { useTheme } from '../context/ThemeContext';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import ValidationModal from '../components/ValidationModal';

export default function ServicesScreen() {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedService, setSelectedService] = useState(null);

  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'services'), (snap) => {
      setServices(snap.docs.map(d => ({ id: d.id, ...d.data() })).sort((a,b) => b.date.localeCompare(a.date)));
      setLoading(false);
    });
    return () => unsub();
  }, []);

  const filtered = services.filter(s => 
    s.provider_name.toLowerCase().includes(search.toLowerCase()) ||
    s.site.toLowerCase().includes(search.toLowerCase()) ||
    s.agent_name.toLowerCase().includes(search.toLowerCase())
  );

  const StatusBadge = ({ status }) => {
    const map = {
      pending: { label: 'En attente', color: theme.colors.warning, bg: '#FFFBEB' },
      validated: { label: 'Approuvé', color: theme.colors.success, bg: '#ECFDF5' },
      disputed: { label: 'Contesté', color: theme.colors.error, bg: '#FEF2F2' }
    };
    const s = map[status] || map.pending;
    return <View style={[styles.badge, { backgroundColor: s.bg }]}><Text style={[styles.badgeText, { color: s.color }]}>{s.label}</Text></View>;
  };

  const renderItem = ({ item }) => (
    <TouchableOpacity style={[styles.card, { backgroundColor: theme.colors.card }]} onPress={() => { setSelectedService(item); setModalVisible(true); }}>
      <View style={styles.cardHeader}>
        <Text style={styles.provider}>{item.provider_name}</Text>
        <StatusBadge status={item.status || 'pending'} />
      </View>
      <Text style={styles.site}>📍 {item.site}</Text>
      <Text style={styles.meta}>📅 {item.date} | ⏱ {item.start_time} - {item.end_time} | 👤 {item.agent_name}</Text>
    </TouchableOpacity>
  );

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background, paddingTop: insets.top }]}>
      <View style={[styles.header, { backgroundColor: theme.colors.primary }]}>
        <Text style={styles.headerTitle}>Prestations</Text>
        <View style={styles.searchBox}>
          <MaterialIcons name="search" size={20} color="rgba(255,255,255,0.7)" />
          <TextInput style={styles.input} placeholder="Rechercher prestataire, site, agent..." placeholderTextColor="rgba(255,255,255,0.6)" value={search} onChangeText={setSearch} />
        </View>
      </View>

      {loading ? <ActivityIndicator style={styles.center} size="large" color={theme.colors.primary} /> : (
        <FlatList data={filtered} keyExtractor={i => i.id} renderItem={renderItem} contentContainerStyle={styles.list} />
      )}

      <ValidationModal visible={modalVisible} onClose={() => setModalVisible(false)} service={selectedService} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { padding: 16, borderBottomLeftRadius: 16, borderBottomRightRadius: 16 },
  headerTitle: { fontSize: 20, fontWeight: 'bold', color: '#FFF', marginBottom: 12 },
  searchBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 8 },
  input: { flex: 1, marginLeft: 8, color: '#FFF', fontSize: 14 },
  list: { padding: 16, paddingBottom: 80 },
  card: { padding: 16, borderRadius: 12, marginBottom: 10, shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 6, elevation: 2 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  provider: { fontSize: 15, fontWeight: 'bold', color: '#1E293B', flex: 1, marginRight: 8 },
  badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  badgeText: { fontSize: 11, fontWeight: '600' },
  site: { fontSize: 13, color: '#64748B', marginBottom: 4 },
  meta: { fontSize: 12, color: '#94A3B8' },
  center: { flex: 1, justifyContent: 'center' }
});