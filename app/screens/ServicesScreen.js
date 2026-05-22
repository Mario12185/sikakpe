// 📦 app/screens/ServicesScreen.js — MVP
import React, { useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const COLORS = { primary: '#1a365d', success: '#00aa55', warning: '#dd6b20', error: '#c53030', background: '#f7fafc', card: '#ffffff', text: '#1a202c', textSecondary: '#4a5568' };

export default function ServicesScreen({ navigation }) {
  const [services] = useState([
    { id: '1', title: 'Gardiennage nocturne', client: 'Entreprise X', status: 'approved', date: '20/05' },
    { id: '2', title: 'Surveillance événement', client: 'Mairie de Lomé', status: 'pending', date: '21/05' },
  ]);

  const getStatusBadge = (status) => {
    const map = { approved: { bg: '#d1fae5', text: '#065f46', label: '✅ Approuvé' }, pending: { bg: '#fef3c7', text: '#92400e', label: '⏳ En attente' }, rejected: { bg: '#fee2e2', text: '#991b1b', label: '❌ Contesté' } };
    return map[status] || map.pending;
  };

  const renderItem = ({ item }) => {
    const badge = getStatusBadge(item.status);
    return (
      <TouchableOpacity style={{ backgroundColor: COLORS.card, borderRadius: 16, padding: 16, marginBottom: 12, borderLeftWidth: 4, borderLeftColor: item.status === 'approved' ? COLORS.success : COLORS.warning, elevation: 2 }} onPress={() => Alert.alert('📋 Détail', `Prestation: ${item.title}\nClient: ${item.client}\nStatut: ${badge.label}`)}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 16, fontWeight: '600', color: COLORS.text, marginBottom: 4 }}>{item.title}</Text>
            <Text style={{ fontSize: 13, color: COLORS.textSecondary }}>Client: {item.client} • {item.date}</Text>
            <View style={{ marginTop: 8, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12, backgroundColor: badge.bg, alignSelf: 'flex-start' }}><Text style={{ fontSize: 11, color: badge.text, fontWeight: '600' }}>{badge.label}</Text></View>
          </View>
          <Ionicons name="chevron-forward" size={18} color={COLORS.textSecondary} />
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={{ flex: 1, backgroundColor: COLORS.background }}>
      <FlatList data={services} renderItem={renderItem} keyExtractor={i => i.id} contentContainerStyle={{ padding: 20 }} ListHeaderComponent={<View style={{ marginBottom: 16 }}><Text style={{ fontSize: 24, fontWeight: '700', color: COLORS.primary }}>📋 Prestations</Text><Text style={{ fontSize: 14, color: COLORS.textSecondary }}>Gérez toutes vos demandes de gardiennage</Text></View>} ListFooterComponent={<TouchableOpacity style={{ backgroundColor: COLORS.primary, padding: 14, borderRadius: 12, alignItems: 'center', marginTop: 8 }} onPress={() => Alert.alert('➕ Nouvelle prestation', 'Fonctionnalité à venir — contactez l\'admin pour créer une demande.') }><Text style={{ color: '#fff', fontWeight: '600' }}>+ Ajouter une prestation</Text></TouchableOpacity>} />
    </View>
  );
}