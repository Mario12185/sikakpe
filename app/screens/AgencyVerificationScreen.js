// 📦 app/screens/AgencyVerificationScreen.js — MVP
import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Alert, ScrollView } from 'react-native';

const COLORS = { primary: '#1a365d', success: '#00aa55', background: '#f7fafc', card: '#ffffff', text: '#1a202c', textSecondary: '#4a5568' };

export default function AgencyVerificationScreen() {
  const [status] = useState('pending'); // 'none' | 'pending' | 'verified' | 'rejected'

  const getStatus = () => {
    if (status === 'verified') return { label: '✅ Agence Vérifiée', color: COLORS.success, desc: 'Votre agence est approuvée et visible par les clients.' };
    if (status === 'rejected') return { label: '❌ Vérification refusée', color: COLORS.error, desc: 'Contactez le support pour corriger les documents.' };
    if (status === 'pending') return { label: '⏳ En attente', color: COLORS.warning, desc: 'Vos documents sont en cours de validation.' };
    return { label: '📄 Non soumis', color: COLORS.textSecondary, desc: 'Soumettez vos documents pour obtenir le badge Vérifié.' };
  };

  const s = getStatus();

  return (
    <ScrollView style={{ flex: 1, backgroundColor: COLORS.background, padding: 20 }}>
      <View style={{ marginBottom: 24 }}><Text style={{ fontSize: 24, fontWeight: '700', color: COLORS.primary }}>🛡️ Vérification Agence</Text><Text style={{ fontSize: 14, color: COLORS.textSecondary }}>Soumettez vos documents légaux pour être visible comme agence vérifiée.</Text></View>
      
      {/* Statut */}
      <View style={{ backgroundColor: COLORS.card, borderRadius: 16, padding: 20, marginBottom: 16, borderLeftWidth: 4, borderLeftColor: s.color, elevation: 2 }}>
        <Text style={{ fontSize: 18, fontWeight: '600', color: s.color, marginBottom: 4 }}>{s.label}</Text>
        <Text style={{ fontSize: 14, color: COLORS.textSecondary }}>{s.desc}</Text>
      </View>

      {/* Documents requis */}
      <Text style={{ fontSize: 16, fontWeight: '600', color: COLORS.text, marginBottom: 12 }}>📋 Documents requis</Text>
      {['Licence d\'exploitation', 'Attestation NINA', 'Assurance responsabilité civile'].map((doc, i) => (
        <View key={i} style={{ backgroundColor: COLORS.card, borderRadius: 12, padding: 14, marginBottom: 8, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <Text style={{ fontSize: 14, color: COLORS.text }}>{doc}</Text>
          <Ionicons name={status === 'verified' ? 'checkmark-circle' : 'cloud-upload-outline'} size={20} color={status === 'verified' ? COLORS.success : COLORS.textSecondary} />
        </View>
      ))}

      {/* Bouton d'action */}
      <TouchableOpacity style={{ backgroundColor: status === 'verified' ? COLORS.textSecondary : COLORS.primary, paddingVertical: 14, borderRadius: 12, alignItems: 'center', marginTop: 8 }} onPress={() => Alert.alert('📤 Upload', 'Fonctionnalité d\'upload à venir. Pour l\'instant, envoyez vos documents par email à support@sikakpe.tg')}>
        <Text style={{ color: '#fff', fontWeight: '600', fontSize: 16 }}>{status === 'verified' ? '✓ Vérifié' : '📤 Soumettre mes documents'}</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}
// Ajoute cet import en haut si Ionicons n'est pas déjà importé:
import { Ionicons } from '@expo/vector-icons';