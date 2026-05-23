// 📦 app/screens/AgencyVerificationScreen.js — MVP SIMPLE (upload Base64 + Firestore)
import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, Alert, ScrollView, ActivityIndicator, Platform } from 'react-native';
import { db, auth, ensureAuth } from '../services/firebase';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';

const COLORS = { primary: '#1a365d', success: '#00aa55', background: '#f7fafc', card: '#ffffff', text: '#1a202c' };

export default function AgencyVerificationScreen() {
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [agency, setAgency] = useState(null);
  const fileInputRef = useRef(null);
  const [currentDoc, setCurrentDoc] = useState(null);

  useEffect(() => {
    (async () => {
      await ensureAuth();
      const uid = auth.currentUser?.uid;
      if (uid) {
        const snap = await getDoc(doc(db, 'agencies', uid));
        if (snap.exists()) setAgency(snap.data());
      }
      setLoading(false);
    })();
  }, []);

  const handleFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file || !currentDoc) return;
    setUploading(true);
    try {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const uid = auth.currentUser?.uid;
        await setDoc(doc(db, 'agencies', uid), {
          documents: { [`${currentDoc}Url`]: reader.result },
          status: 'pending',
          updatedAt: new Date()
        }, { merge: true });
        const snap = await getDoc(doc(db, 'agencies', uid));
        if (snap.exists()) setAgency(snap.data());
        Alert.alert('✅ Document enregistré');
        setUploading(false);
        setCurrentDoc(null);
      };
      reader.readAsDataURL(file);
    } catch (err) {
      Alert.alert('❌ Erreur', err.message);
      setUploading(false);
    }
  };

  const startUpload = (docKey) => {
    if (Platform.OS === 'web') {
      setCurrentDoc(docKey);
      fileInputRef.current?.click();
    } else {
      Alert.alert('📱 Mobile', 'Utilisez Chrome sur PC pour tester l\'upload MVP.');
    }
  };

  const submit = async () => {
    const uid = auth.currentUser?.uid;
    const docs = agency?.documents || {};
    if (!docs.licenceUrl || !docs.ninaUrl || !docs.insuranceUrl) {
      Alert.alert('⚠️ Incomplet', 'Uploadez les 3 documents d\'abord.');
      return;
    }
    await setDoc(doc(db, 'agencies', uid), { status: 'pending', submittedAt: serverTimestamp() }, { merge: true });
    setAgency(prev => prev ? { ...prev, status: 'pending' } : null);
    Alert.alert('✅ Soumis', 'En attente de validation admin.');
  };

  if (loading) return <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}><ActivityIndicator /><Text>Chargement...</Text></View>;

  const status = agency?.status || 'none';
  const docs = agency?.documents || {};

  return (
    <ScrollView style={{ flex: 1, padding: 20, backgroundColor: COLORS.background }}>
      <input type="file" accept="image/*" ref={fileInputRef} style={{ display: 'none' }} onChange={handleFile} />
      
      <Text style={{ fontSize: 22, fontWeight: 'bold', color: COLORS.primary, marginBottom: 8 }}>🛡️ Vérification Agence</Text>
      <Text style={{ color: '#666', marginBottom: 20 }}>Statut: <Text style={{ fontWeight: 'bold', color: status === 'pending' ? COLORS.success : COLORS.text }}>{status}</Text></Text>

      {['licence', 'nina', 'insurance'].map(key => {
        const uploaded = !!docs[`${key}Url`];
        return (
          <TouchableOpacity 
            key={key} 
            onPress={() => !uploaded && startUpload(key)} 
            disabled={uploaded || uploading}
            style={{ backgroundColor: COLORS.card, padding: 16, marginBottom: 12, borderRadius: 12, borderLeftWidth: 4, borderLeftColor: uploaded ? COLORS.success : COLORS.primary }}
          >
            <Text style={{ fontWeight: '600' }}>{key === 'licence' ? 'Licence' : key === 'nina' ? 'NINA' : 'Assurance'}</Text>
            {uploaded ? (
              <Text style={{ color: COLORS.success, marginTop: 4 }}>✓ Enregistré</Text>
            ) : (
              <Text style={{ color: COLORS.primary, marginTop: 4 }}>→ Cliquer pour uploader</Text>
            )}
          </TouchableOpacity>
        );
      })}

      <TouchableOpacity 
        onPress={submit} 
        disabled={uploading || status === 'verified'}
        style={{ backgroundColor: status === 'verified' ? '#666' : COLORS.primary, padding: 14, borderRadius: 10, alignItems: 'center', marginTop: 20 }}
      >
        <Text style={{ color: '#fff', fontWeight: 'bold' }}>{status === 'verified' ? '✓ Vérifiée' : '📤 Soumettre pour vérification'}</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}