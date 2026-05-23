// 📦 app/screens/CheckInScreen.js — MVP SIMPLE (saisie manuelle uniquement)
import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Alert, TextInput, ActivityIndicator } from 'react-native';
import { db, auth, ensureAuth } from '../services/firebase';
import { doc, getDoc, addDoc, collection, serverTimestamp } from 'firebase/firestore';

const COLORS = { primary: '#1a365d', success: '#00aa55', background: '#f7fafc', card: '#ffffff', text: '#1a202c' };

export default function CheckInScreen({ navigation }) {
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);

  const handleCheckIn = async () => {
    if (!code.trim()) { Alert.alert('⚠️ Code requis', 'Entrez un code de site'); return; }
    setLoading(true);
    try {
      await ensureAuth();
      // 🔍 Vérifier que le site existe
      const siteSnap = await getDoc(doc(db, 'sites', code.trim()));
      if (!siteSnap.exists()) {
        Alert.alert('❌ Site inconnu', `Aucun site avec le code "${code.trim()}"`);
        return;
      }
      // ✅ Enregistrer le check-in
      await addDoc(collection(db, 'checkins'), {
        siteId: code.trim(),
        guardId: auth.currentUser?.uid || 'anonymous',
        type: 'check_in',
        timestamp: serverTimestamp(),
        status: 'valid'
      });
      Alert.alert('✅ Check-in réussi', `Site: ${siteSnap.data().name || code.trim()}`);
      navigation?.goBack?.();
    } catch (e) {
      Alert.alert('❌ Échec', e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={{ flex: 1, padding: 20, backgroundColor: COLORS.background }}>
      <Text style={{ fontSize: 22, fontWeight: 'bold', color: COLORS.primary, marginBottom: 8 }}>📍 Check-in QR/GPS</Text>
      <Text style={{ color: '#666', marginBottom: 20 }}>Entrez le code du site pour valider votre présence.</Text>
      
      <TextInput
        style={{ backgroundColor: COLORS.card, padding: 14, borderRadius: 10, fontSize: 16, marginBottom: 16, borderWidth: 1, borderColor: '#e2e8f0' }}
        placeholder="Ex: SITE-TEST-001"
        value={code}
        onChangeText={setCode}
        autoCapitalize="characters"
        editable={!loading}
      />
      
      <TouchableOpacity 
        style={{ backgroundColor: COLORS.primary, padding: 14, borderRadius: 10, alignItems: 'center' }} 
        onPress={handleCheckIn}
        disabled={loading}
      >
        {loading ? <ActivityIndicator color="#fff" /> : <Text style={{ color: '#fff', fontWeight: 'bold' }}>✅ Valider le check-in</Text>}
      </TouchableOpacity>
      
      <Text style={{ color: '#666', fontSize: 12, marginTop: 20, textAlign: 'center' }}>
        💡 Pour tester, créez un document `sites/SITE-TEST-001` dans Firestore
      </Text>
    </View>
  );
}