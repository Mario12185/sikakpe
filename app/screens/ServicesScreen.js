// 📦 app/screens/ServicesScreen.js — CONNECTÉ FIRESTORE + FORMULAIRE CRÉATION
import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, Alert, Modal, TextInput, ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { getFirestore, collection, onSnapshot, addDoc, serverTimestamp } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

const db = getFirestore();
const auth = getAuth();

const COLORS = {
  primary: '#1a365d', success: '#00aa55', warning: '#dd6b20', error: '#c53030',
  background: '#f7fafc', card: '#ffffff', text: '#1a202c', textSecondary: '#4a5568', border: '#e2e8f0'
};

export default function ServicesScreen() {
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newClient, setNewClient] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // 🔍 Écoute temps réel Firestore
  useEffect(() => {
    const q = collection(db, 'services');
    const unsubscribe = onSnapshot(q, 
      (snapshot) => {
        const list = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setServices(list);
        setLoading(false);
      },
      (error) => {
        console.error('❌ Firestore error:', error);
        setLoading(false);
      }
    );
    return () => unsubscribe();
  }, []);

  // ➕ Création d'une prestation
  const handleCreate = async () => {
    if (!newTitle.trim() || !newClient.trim()) {
      Alert.alert('⚠️ Champs requis', 'Veuillez remplir le titre et le client.');
      return;
    }
    setSubmitting(true);
    try {
      await addDoc(collection(db, 'services'), {
        title: newTitle.trim(),
        client: newClient.trim(),
        status: 'pending',
        createdAt: serverTimestamp(),
        createdBy: auth.currentUser?.uid || 'anonymous'
      });
      setNewTitle('');
      setNewClient('');
      setModalVisible(false);
      Alert.alert('✅ Prestation créée', 'La demande a été enregistrée. Statut initial : En attente.');
    } catch (e) {
      Alert.alert('❌ Échec', e.message);
    } finally {
      setSubmitting(false);
    }
  };

  // 🎨 Badge de statut
  const getStatusBadge = (status) => {
    const map = {
      approved: { bg: '#d1fae5', text: '#065f46', label: '✅ Approuvé' },
      pending: { bg: '#fef3c7', text: '#92400e', label: '⏳ En attente' },
      rejected: { bg: '#fee2e2', text: '#991b1b', label: '❌ Contesté' }
    };
    return map[status] || map.pending;
  };

  const renderItem = ({ item }) => {
    const badge = getStatusBadge(item.status);
    const date = item.createdAt?.toDate ? item.createdAt.toDate().toLocaleDateString('fr-FR') : 'Date inconnue';
    return (
      <TouchableOpacity style={{ backgroundColor: COLORS.card, borderRadius: 16, padding: 16, marginBottom: 12, borderLeftWidth: 4, borderLeftColor: badge.text, elevation: 2 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 16, fontWeight: '600', color: COLORS.text, marginBottom: 4 }}>{item.title}</Text>
            <Text style={{ fontSize: 13, color: COLORS.textSecondary }}>Client: {item.client} • {date}</Text>
            <View style={{ marginTop: 8, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12, backgroundColor: badge.bg, alignSelf: 'flex-start' }}>
              <Text style={{ fontSize: 11, color: badge.text, fontWeight: '600' }}>{badge.label}</Text>
            </View>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  if (loading) {
    return <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.background }}><ActivityIndicator size="large" color={COLORS.primary} /><Text style={{ marginTop: 12, color: COLORS.textSecondary }}>Chargement des prestations...</Text></View>;
  }

  return (
    <View style={{ flex: 1, backgroundColor: COLORS.background }}>
      <FlatList
        data={services}
        renderItem={renderItem}
        keyExtractor={item => item.id}
        contentContainerStyle={{ padding: 20 }}
        ListHeaderComponent={
          <View style={{ marginBottom: 16 }}>
            <Text style={{ fontSize: 24, fontWeight: '700', color: COLORS.primary }}>📋 Prestations</Text>
            <Text style={{ fontSize: 14, color: COLORS.textSecondary }}>Gérez toutes vos demandes de gardiennage</Text>
          </View>
        }
        ListEmptyComponent={
          <View style={{ alignItems: 'center', marginTop: 40, padding: 20 }}>
            <Ionicons name="document-outline" size={48} color={COLORS.textSecondary} />
            <Text style={{ marginTop: 12, color: COLORS.textSecondary, textAlign: 'center' }}>Aucune prestation enregistrée.<br/>Cliquez sur + pour en créer une.</Text>
          </View>
        }
      />

      {/* 🟢 Bouton Flottant Créer */}
      <TouchableOpacity
        style={{ position: 'absolute', bottom: 24, right: 24, backgroundColor: COLORS.primary, width: 56, height: 56, borderRadius: 28, justifyContent: 'center', alignItems: 'center', elevation: 5, shadowColor: COLORS.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8 }}
        onPress={() => setModalVisible(true)}
      >
        <Ionicons name="add" size={28} color="#fff" />
      </TouchableOpacity>

      {/* 📝 Modal Formulaire */}
      <Modal visible={modalVisible} animationType="slide" transparent={true} onRequestClose={() => setModalVisible(false)}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1, justifyContent: 'flex-end' }}>
          <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)' }} onTouchStart={() => setModalVisible(false)}>
            <View style={{ backgroundColor: COLORS.card, borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 24, minHeight: 300 }} onTouchStart={e => e.stopPropagation()}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                <Text style={{ fontSize: 20, fontWeight: '700', color: COLORS.primary }}>➕ Nouvelle prestation</Text>
                <TouchableOpacity onPress={() => setModalVisible(false)}><Ionicons name="close" size={24} color={COLORS.textSecondary} /></TouchableOpacity>
              </View>
              <Text style={{ fontSize: 14, color: COLORS.textSecondary, marginBottom: 16 }}>Les champs marqués * sont obligatoires.</Text>
              <TextInput style={{ backgroundColor: '#f8fafc', borderWidth: 1, borderColor: COLORS.border, borderRadius: 10, padding: 14, fontSize: 16, marginBottom: 12 }} placeholder="Titre de la prestation *" value={newTitle} onChangeText={setNewTitle} />
              <TextInput style={{ backgroundColor: '#f8fafc', borderWidth: 1, borderColor: COLORS.border, borderRadius: 10, padding: 14, fontSize: 16, marginBottom: 24 }} placeholder="Client *" value={newClient} onChangeText={setNewClient} />
              <TouchableOpacity style={{ backgroundColor: submitting ? COLORS.textSecondary : COLORS.primary, paddingVertical: 14, borderRadius: 12, alignItems: 'center' }} onPress={handleCreate} disabled={submitting}>
                {submitting ? <ActivityIndicator color="#fff" /> : <Text style={{ color: '#fff', fontWeight: '600', fontSize: 16 }}>📤 Enregistrer la demande</Text>}
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}