// 📦 app/screens/AdminScreen.js — GESTION DES AGENCES (Validation)
import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, Alert, ActivityIndicator, Linking } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { getFirestore, collection, onSnapshot, doc, updateDoc } from 'firebase/firestore';

const db = getFirestore();

const COLORS = { 
  primary: '#1a365d', success: '#00aa55', warning: '#dd6b20', error: '#c53030', 
  background: '#f7fafc', card: '#ffffff', text: '#1a202c', textSecondary: '#4a5568', border: '#e2e8f0' 
};

export default function AdminScreen() {
  const [agencies, setAgencies] = useState([]);
  const [loading, setLoading] = useState(true);

  // 🔍 Écoute temps réel de toutes les agences
  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, 'agencies'),
      (snapshot) => {
        const list = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        // Trier : les demandes 'pending' apparaissent en premier
        list.sort((a, b) => (a.status === 'pending' ? -1 : 1));
        setAgencies(list);
        setLoading(false);
      },
      (err) => {
        console.error('❌ Admin Error:', err);
        setLoading(false);
      }
    );
    return () => unsubscribe();
  }, []);

  // ✅❌ Action de validation / rejet
  const handleStatusChange = async (agencyId, currentStatus, newStatus) => {
    if (currentStatus === 'verified' || currentStatus === 'rejected') return;

    const actionText = newStatus === 'verified' ? 'valider (badge Vérifié)' : 'rejeter';
    
    Alert.alert(
      `🔐 Confirmation`,
      `Voulez-vous vraiment ${actionText} cette agence ?`,
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: newStatus === 'verified' ? '✅ Valider' : '❌ Refuser',
          style: newStatus === 'verified' ? 'default' : 'destructive',
          onPress: async () => {
            try {
              await updateDoc(doc(db, 'agencies', agencyId), {
                status: newStatus,
                reviewedAt: new Date()
              });
              Alert.alert('✅ Succès', `Agence ${newStatus === 'verified' ? 'validée' : 'refusée'}.`);
            } catch (e) {
              Alert.alert('❌ Erreur', e.message);
            }
          }
        }
      ]
    );
  };

  const getStatusBadge = (status) => {
    const map = {
      verified: { bg: '#d1fae5', text: '#065f46', label: '✅ Vérifiée', icon: 'checkmark-circle' },
      rejected: { bg: '#fee2e2', text: '#991b1b', label: '❌ Refusée', icon: 'close-circle' },
      pending: { bg: '#fef3c7', text: '#92400e', label: '⏳ En attente', icon: 'time-outline' }
    };
    return map[status] || map.pending;
  };

  if (loading) return <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}><ActivityIndicator size="large" color={COLORS.primary} /></View>;

  return (
    <View style={{ flex: 1, backgroundColor: COLORS.background }}>
      <FlatList
        data={agencies}
        keyExtractor={item => item.id}
        contentContainerStyle={{ padding: 20 }}
        ListHeaderComponent={
          <View style={{ marginBottom: 20 }}>
            <Text style={{ fontSize: 24, fontWeight: '700', color: COLORS.primary }}>👮 Administration</Text>
            <Text style={{ fontSize: 14, color: COLORS.textSecondary }}>Gérez les demandes de vérification des agences.</Text>
          </View>
        }
        ListEmptyComponent={<Text style={{ textAlign: 'center', color: COLORS.textSecondary, marginTop: 40 }}>Aucune agence enregistrée pour le moment.</Text>}
        renderItem={({ item }) => {
          const badge = getStatusBadge(item.status);
          const isPending = item.status === 'pending';

          return (
            <View style={{ backgroundColor: COLORS.card, borderRadius: 16, padding: 16, marginBottom: 12, borderLeftWidth: 4, borderLeftColor: badge.text, elevation: 2 }}>
              
              {/* En-tête Carte */}
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                <Text style={{ fontSize: 16, fontWeight: '700', color: COLORS.text }}>{item.name || 'Nom inconnu'}</Text>
                <View style={{ paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12, backgroundColor: badge.bg }}>
                  <Text style={{ fontSize: 11, color: badge.text, fontWeight: '600' }}>{badge.label}</Text>
                </View>
              </View>

              {/* Détails */}
              <Text style={{ fontSize: 13, color: COLORS.textSecondary, marginBottom: 4 }}>📞 {item.contact || 'Pas de contact'}</Text>
              <Text style={{ fontSize: 13, color: COLORS.textSecondary, marginBottom: 12 }}>🆔 ID: {item.id.substring(0, 8)}...</Text>

              {/* Documents uploadés */}
              {item.documents && (
                <View style={{ flexDirection: 'row', gap: 8, marginBottom: 12 }}>
                  {Object.keys(item.documents).length > 0 && (
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                      <Ionicons name="documents-outline" size={16} color={COLORS.success} />
                      <Text style={{ fontSize: 12, color: COLORS.success, marginLeft: 4 }}>Docs présents</Text>
                    </View>
                  )}
                </View>
              )}

              {/* Actions (Uniquement si En attente) */}
              {isPending && (
                <View style={{ flexDirection: 'row', marginTop: 8 }}>
                  <TouchableOpacity 
                    style={{ flex: 1, marginRight: 8, backgroundColor: COLORS.success, paddingVertical: 10, borderRadius: 8, alignItems: 'center', flexDirection: 'row', justifyContent: 'center' }} 
                    onPress={() => handleStatusChange(item.id, item.status, 'verified')}
                  >
                    <Ionicons name="shield-checkmark" size={18} color="#fff" style={{ marginRight: 6 }} />
                    <Text style={{ color: '#fff', fontWeight: '600' }}>Valider</Text>
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={{ flex: 1, backgroundColor: COLORS.error, paddingVertical: 10, borderRadius: 8, alignItems: 'center', flexDirection: 'row', justifyContent: 'center' }} 
                    onPress={() => handleStatusChange(item.id, item.status, 'rejected')}
                  >
                    <Ionicons name="shield-outline" size={18} color="#fff" style={{ marginRight: 6 }} />
                    <Text style={{ color: '#fff', fontWeight: '600' }}>Refuser</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          );
        }}
      />
    </View>
  );
}