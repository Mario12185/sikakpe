// 📦 app/screens/DashboardScreen.js — MVP
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { auth } from '../services/firebase';

const COLORS = { primary: '#1a365d', success: '#00aa55', warning: '#dd6b20', error: '#c53030', background: '#f7fafc', card: '#ffffff', text: '#1a202c', textSecondary: '#4a5568' };

export default function DashboardScreen({ navigation }) {
  // 📊 Données fictives (à connecter à Firestore plus tard)
  const stats = [
    { label: 'En attente', value: '0', icon: 'time-outline', color: COLORS.warning },
    { label: 'Approuvées', value: '1', icon: 'checkmark-circle-outline', color: COLORS.success },
    { label: 'Contestées', value: '0', icon: 'alert-circle-outline', color: COLORS.error },
  ];

  return (
    <ScrollView style={{ flex: 1, backgroundColor: COLORS.background }} contentContainerStyle={{ padding: 20 }}>
      {/* 🎯 En-tête */}
      <View style={{ marginBottom: 24 }}>
        <Text style={{ fontSize: 26, fontWeight: '700', color: COLORS.primary }}>🇹🇬 SikaKpɛ</Text>
        <Text style={{ fontSize: 14, color: COLORS.textSecondary, marginTop: 4 }}>Validation des prestations de gardiennage</Text>
      </View>

      {/* 📊 Statistiques */}
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginHorizontal: -8 }}>
        {stats.map((stat, i) => (
          <View key={i} style={{ flex: 1, minWidth: '48%', margin: 8, backgroundColor: COLORS.card, borderRadius: 16, padding: 16, borderLeftWidth: 4, borderLeftColor: stat.color, elevation: 2 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
              <Ionicons name={stat.icon} size={18} color={stat.color} />
              <Text style={{ marginLeft: 8, fontSize: 13, color: COLORS.textSecondary, fontWeight: '500' }}>{stat.label}</Text>
            </View>
            <Text style={{ fontSize: 28, fontWeight: '700', color: COLORS.primary }}>{stat.value}</Text>
          </View>
        ))}
      </View>

      {/* 🚀 Actions rapides */}
      <View style={{ marginTop: 24 }}>
        <Text style={{ fontSize: 18, fontWeight: '600', color: COLORS.text, marginBottom: 12 }}>⚡ Actions rapides</Text>
        
        <TouchableOpacity style={{ backgroundColor: COLORS.card, borderRadius: 16, padding: 16, flexDirection: 'row', alignItems: 'center', marginBottom: 12, elevation: 2 }} onPress={() => navigation.navigate('Services')}>
          <View style={{ width: 44, height: 44, borderRadius: 12, backgroundColor: COLORS.primary, alignItems: 'center', justifyContent: 'center', marginRight: 12 }}><Ionicons name="add-circle-outline" size={22} color="#fff" /></View>
          <View style={{ flex: 1 }}><Text style={{ fontSize: 15, fontWeight: '600', color: COLORS.text }}>Nouvelle prestation</Text><Text style={{ fontSize: 13, color: COLORS.textSecondary }}>Créer une demande de gardiennage</Text></View>
          <Ionicons name="chevron-forward" size={18} color={COLORS.textSecondary} />
        </TouchableOpacity>

        <TouchableOpacity style={{ backgroundColor: COLORS.card, borderRadius: 16, padding: 16, flexDirection: 'row', alignItems: 'center', elevation: 2 }} onPress={() => navigation.navigate('Sécurité')}>
          <View style={{ width: 44, height: 44, borderRadius: 12, backgroundColor: COLORS.success, alignItems: 'center', justifyContent: 'center', marginRight: 12 }}><Ionicons name="shield-checkmark-outline" size={22} color="#fff" /></View>
          <View style={{ flex: 1 }}><Text style={{ fontSize: 15, fontWeight: '600', color: COLORS.text }}>Vérifier un gardien</Text><Text style={{ fontSize: 13, color: COLORS.textSecondary }}>Scanner un code de présence</Text></View>
          <Ionicons name="chevron-forward" size={18} color={COLORS.textSecondary} />
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}