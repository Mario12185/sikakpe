// 📦 app/screens/ServicesScreen.js — ENREGISTREMENT FIABLE + LOGS
import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, Alert, Modal, TextInput, ActivityIndicator, KeyboardAvoidingView, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { getFirestore, collection, onSnapshot, addDoc } from 'firebase/firestore';
import { getAuth, signInAnonymously } from 'firebase/auth';

const db = getFirestore();
const auth = getAuth();

const COLORS = { 
  primary: '#1a365d', success: '#00aa55', warning: '#dd6b20', error: '#c53030', 
  background: '#f7fafc', card: '#ffffff', text: '#1a202c', textSecondary: '#4a5568', border: '#e2e8f0' 
};

export default function ServicesScreen() {
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newClient, setNewClient] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // 🔍 Écoute temps réel
  useEffect(() => {
    console.log('🔄 Écoute Firestore: collection services');
    const unsubscribe = onSnapshot(collection(db, 'services'),
      (snapshot) => {
        console.log(`📥 ${snapshot.size} prestations reçues`);
        setServices(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        setLoading(false);
        setError(null);
      },
      (err) => {
        console.error('❌ FIRESTORE LISTEN ERROR:', err.code, err.message);
        setError(err.message);
        setLoading(false);
      }
    );
    return () => unsubscribe();
  }, []);

  // ➕ Création robuste
  const handleCreate = async () => {
    console.log('👉 Début enregistrement...');
    if (!newTitle.trim() || !newClient.trim()) {
      Alert.alert('⚠️ Requis', 'Titre et Client sont obligatoires.');
      return;
    }
    
    // 🔐 Vérifier/Forcer l'auth
    if (!auth.currentUser) {
      console.log('⏳ Auth non prêt, connexion anonyme forcée...');
      try {
        await signInAnonymously(auth);
        console.log('✅ Connecté:', auth.currentUser.uid);
      } catch (e) {
        Alert.alert('❌ Authentification', 'Impossible de se connecter. Réessaie.');
        return;
      }
    }

    setSubmitting(true);
    try {
      const payload = {
        title: newTitle.trim(),
        client: newClient.trim(),
        status: 'pending',
        createdAt: new Date(), // Plus fiable que serverTimestamp() sur Web
        createdBy: auth.currentUser.uid
      };
      console.log('📤 Envoi à Firestore:', payload);
      
      const docRef = await addDoc(collection(db, 'services'), payload);
      console.log('✅ Document créé! ID:', docRef.id);
      
      setNewTitle('');
      setNewClient('');
      setModalVisible(false);
      Alert.alert('✅ Succès', 'Prestation enregistrée et visible dans la liste.');
    } catch (e) {
      console.error('❌ ADD_DOC ERROR:', e.code, e.message);
      Alert.alert('❌ Échec', `Code: ${e.code}\nMessage: ${e.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusBadge = (status) => {
    const map = {
      approved: { bg: '#d1fae5', text: '#065f46', label: '✅ Approuvé' },
      pending: { bg: '#fef3c7', text: '#92400e', label: '⏳ En attente' },
      rejected: { bg: '#fee2e2', text: '#991b1b', label: '❌ Contesté' }
    };
    return map[status] || map.pending;
  };

  if (loading) return <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.background }}><ActivityIndicator size="large" color={COLORS.primary} /><Text style={{ marginTop: 10, color: COLORS.textSecondary }}>Chargement...</Text></View>;
  if (error) return <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20, backgroundColor: COLORS.background }}><Ionicons name="alert-circle" size={48} color={COLORS.error} /><Text style={{ marginTop: 10, color: COLORS.error, textAlign: 'center', fontWeight: '600' }}>Erreur Firestore</Text><Text style={{ marginTop: 5, color: COLORS.textSecondary }}>{error}</Text><TouchableOpacity style={{ marginTop: 16, backgroundColor: COLORS.primary, padding: 12, borderRadius: 8 }} onPress={() => window.location.reload()}><Text style={{ color: '#fff' }}>🔄 Recharger</Text></TouchableOpacity></View>;

  return (
    <View style={{ flex: 1, backgroundColor: COLORS.background }}>
      <FlatList
        data={services}
        keyExtractor={item => item.id}
        contentContainerStyle={{ padding: 20 }}
        ListHeaderComponent={<View style={{ marginBottom: 16 }}><Text style={{ fontSize: 24, fontWeight: '700', color: COLORS.primary }}>📋 Prestations</Text><Text style={{ fontSize: 14, color: COLORS.textSecondary }}>Synchronisation temps réel active</Text></View>}
        ListEmptyComponent={<View style={{ alignItems: 'center', marginTop: 40 }}><Ionicons name="document-outline" size={48} color={COLORS.textSecondary} /><Text style={{ marginTop: 10, color: COLORS.textSecondary }}>Aucune prestation. Appuyez sur +</Text></View>}
        renderItem={({ item }) => {
          const badge = getStatusBadge(item.status);
          const date = item.createdAt instanceof Date ? item.createdAt.toLocaleDateString('fr-FR') : 'Date inconnue';
          return (
            <View style={{ backgroundColor: COLORS.card, borderRadius: 16, padding: 16, marginBottom: 12, borderLeftWidth: 4, borderLeftColor: badge.text, elevation: 2 }}>
              <Text style={{ fontSize: 16, fontWeight: '600', color: COLORS.text }}>{item.title}</Text>
              <Text style={{ fontSize: 13, color: COLORS.textSecondary, marginTop: 4 }}>Client: {item.client} • {date}</Text>
              <View style={{ marginTop: 8, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12, backgroundColor: badge.bg, alignSelf: 'flex-start' }}>
                <Text style={{ fontSize: 11, color: badge.text, fontWeight: '600' }}>{badge.label}</Text>
              </View>
            </View>
          );
        }}
      />

      {/* 🟢 Bouton Flottant */}
      <TouchableOpacity style={{ position: 'absolute', bottom: 24, right: 24, backgroundColor: COLORS.primary, width: 56, height: 56, borderRadius: 28, justifyContent: 'center', alignItems: 'center', elevation: 5 }} onPress={() => setModalVisible(true)}>
        <Ionicons name="add" size={28} color="#fff" />
      </TouchableOpacity>

      {/* 📝 Modal Formulaire */}
      <Modal visible={modalVisible} animationType="slide" transparent={true} onRequestClose={() => setModalVisible(false)}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1, justifyContent: 'flex-end' }}>
          <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)' }} onTouchStart={() => setModalVisible(false)}>
            <View style={{ backgroundColor: COLORS.card, borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 24 }} onTouchStart={e => e.stopPropagation()}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                <Text style={{ fontSize: 20, fontWeight: '700', color: COLORS.primary }}>➕ Nouvelle prestation</Text>
                <TouchableOpacity onPress={() => setModalVisible(false)}><Ionicons name="close" size={24} color={COLORS.textSecondary} /></TouchableOpacity>
              </View>
              <TextInput style={{ backgroundColor: '#f8fafc', borderWidth: 1, borderColor: COLORS.border, borderRadius: 10, padding: 14, fontSize: 16, marginBottom: 12 }} placeholder="Titre *" value={newTitle} onChangeText={setNewTitle} />
              <TextInput style={{ backgroundColor: '#f8fafc', borderWidth: 1, borderColor: COLORS.border, borderRadius: 10, padding: 14, fontSize: 16, marginBottom: 24 }} placeholder="Client *" value={newClient} onChangeText={setNewClient} />
              <TouchableOpacity style={{ backgroundColor: submitting ? COLORS.textSecondary : COLORS.primary, paddingVertical: 14, borderRadius: 12, alignItems: 'center' }} onPress={handleCreate} disabled={submitting}>
                {submitting ? <ActivityIndicator color="#fff" /> : <Text style={{ color: '#fff', fontWeight: '600', fontSize: 16 }}>📤 Enregistrer</Text>}
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}