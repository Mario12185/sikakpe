// 📦 app/screens/AgencyVerificationScreen.js — MVP COMPLET (Base64 Firestore + Aperçu)
import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, Alert, ScrollView, ActivityIndicator, Platform, Image, Modal } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { getFirestore, doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { Ionicons } from '@expo/vector-icons';

const db = getFirestore();
const auth = getAuth();

const COLORS = { 
  primary: '#1a365d', success: '#00aa55', warning: '#dd6b20', error: '#c53030', 
  background: '#f7fafc', card: '#ffffff', text: '#1a202c', textSecondary: '#4a5568' 
};

export default function AgencyVerificationScreen() {
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [agencyData, setAgencyData] = useState(null);
  const [previewImage, setPreviewImage] = useState(null);

  // 🔍 Charger les données de l'agence au montage
  useEffect(() => {
    const loadAgency = async () => {
      const userId = auth.currentUser?.uid;
      if (!userId) return;
      try {
        setLoading(true);
        const snap = await getDoc(doc(db, 'agencies', userId));
        if (snap.exists()) setAgencyData(snap.data());
      } catch (e) { console.warn('⚠️ Load failed:', e.message); }
      finally { setLoading(false); }
    };
    loadAgency();
  }, []);

  // 🖼️ Pick + convert to Base64 + save to Firestore
  const pickAndUpload = async (docType, docLabel) => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('🔐 Permission requise', 'Autorisez l\'accès à la galerie pour uploader.');
        return null;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        quality: 0.6,
        base64: true,
        aspect: [4, 3],
      });

      if (result.canceled || !result.assets?.[0]) return null;

      setUploading(true);
      const base64 = result.assets[0].base64;
      const mimeType = result.assets[0].mimeType || 'image/jpeg';
      const dataURI = `data:${mimeType};base64,${base64}`;

      const userId = auth.currentUser?.uid;
      const docRef = doc(db, 'agencies', userId);
      await setDoc(docRef, {
        documents: { [`${docType}Url`]: dataURI },
        status: 'pending',
        submittedAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      }, { merge: true });

      const snap = await getDoc(docRef);
      if (snap.exists()) setAgencyData(snap.data());

      Alert.alert('✅ Document enregistré', `${docLabel} sauvegardé. Prêt pour soumission.`);
      return dataURI;
    } catch (err) {
      console.error('❌ Upload error:', err);
      Alert.alert('❌ Échec', err.message || 'Erreur lors de l\'enregistrement.');
      return null;
    } finally {
      setUploading(false);
    }
  };

  // 📤 Soumettre pour vérification
  const submitForVerification = async () => {
    const userId = auth.currentUser?.uid;
    if (!userId) { Alert.alert('🔐 Connexion requise', 'Veuillez vous connecter.'); return; }
    const docs = agencyData?.documents || {};
    const missing = ['licenceUrl', 'ninaUrl', 'insuranceUrl'].filter(k => !docs[k]);
    if (missing.length > 0) {
      Alert.alert('⚠️ Manquant', `Veuillez uploader : ${missing.map(m => m.replace('Url','')).join(', ')}`);
      return;
    }
    try {
      setUploading(true);
      await setDoc(doc(db, 'agencies', userId), {
        status: 'pending', submittedAt: serverTimestamp(), reviewedAt: null
      }, { merge: true });
      setAgencyData(prev => prev ? { ...prev, status: 'pending' } : null);
      Alert.alert('✅ Soumis', 'En cours de validation par l\'équipe SikaKpɛ.');
    } catch (e) { Alert.alert('❌ Échec', e.message); }
    finally { setUploading(false); }
  };

  // 🎨 Statut display
  const getStatusDisplay = () => {
    const status = agencyData?.status || 'none';
    const map = {
      verified: { label: '✅ Agence Vérifiée', color: COLORS.success, icon: 'checkmark-circle', desc: 'Agence approuvée.' },
      rejected: { label: '❌ Refusée', color: COLORS.error, icon: 'alert-circle', desc: 'Contactez le support.' },
      pending: { label: '⏳ En attente', color: COLORS.warning, icon: 'time-outline', desc: 'Examen en cours.' },
      none: { label: '📄 Aucun document', color: COLORS.textSecondary, icon: 'document-outline', desc: 'Uploadez vos documents.' }
    };
    return map[status] || map.none;
  };

  const statusInfo = getStatusDisplay();
  const docs = agencyData?.documents || {};

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.background }}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={{ marginTop: 12, color: COLORS.textSecondary }}>Chargement...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={{ flex: 1, backgroundColor: COLORS.background }} contentContainerStyle={{ padding: 20 }}>
      
      {/* 🎯 En-tête */}
      <View style={{ marginBottom: 24 }}>
        <Text style={{ fontSize: 24, fontWeight: '700', color: COLORS.primary }}>🛡️ Vérification Agence</Text>
        <Text style={{ fontSize: 14, color: COLORS.textSecondary }}>Documents légaux pour le badge Vérifié.</Text>
      </View>

      {/* 📊 Statut */}
      <View style={{ backgroundColor: COLORS.card, borderRadius: 16, padding: 20, marginBottom: 20, borderLeftWidth: 4, borderLeftColor: statusInfo.color, elevation: 2 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
          <Ionicons name={statusInfo.icon} size={20} color={statusInfo.color} />
          <Text style={{ marginLeft: 8, fontSize: 16, fontWeight: '600', color: statusInfo.color }}>{statusInfo.label}</Text>
        </View>
        <Text style={{ fontSize: 14, color: COLORS.textSecondary }}>{statusInfo.desc}</Text>
      </View>

      {/* 📋 Documents requis */}
      <Text style={{ fontSize: 16, fontWeight: '600', color: COLORS.text, marginBottom: 12 }}>📋 Documents requis</Text>
      
      {[
        { key: 'licenceUrl', label: 'Licence d\'exploitation', icon: 'business-outline' },
        { key: 'ninaUrl', label: 'Attestation NINA', icon: 'id-card-outline' },
        { key: 'insuranceUrl', label: 'Assurance RC', icon: 'shield-checkmark-outline' }
      ].map((d) => {
        const isUploaded = !!docs[d.key];
        return (
          <TouchableOpacity 
            key={d.key} 
            style={{ backgroundColor: COLORS.card, borderRadius: 12, padding: 14, marginBottom: 10, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', elevation: 1 }}
            onPress={() => !isUploaded && !uploading && pickAndUpload(d.key.replace('Url', ''), d.label)} 
            disabled={uploading || isUploaded}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
              <Ionicons name={isUploaded ? 'checkmark-circle' : d.icon} size={20} color={isUploaded ? COLORS.success : COLORS.textSecondary} style={{ marginRight: 12 }} />
              <View>
                <Text style={{ fontSize: 14, fontWeight: isUploaded ? '600' : '500', color: isUploaded ? COLORS.success : COLORS.text }}>{d.label}</Text>
                
                {/* 👁️ Miniature cliquable OU bouton uploader */}
                {isUploaded ? (
                  <View style={{ marginTop: 6, flexDirection: 'row', alignItems: 'center' }}>
                    <TouchableOpacity onPress={() => setPreviewImage(docs[d.key])} style={{ marginRight: 8 }}>
                      <Image 
                        source={{ uri: docs[d.key] }} 
                        style={{ width: 50, height: 50, borderRadius: 6, backgroundColor: '#e2e8f0' }} 
                        resizeMode="cover" 
                      />
                    </TouchableOpacity>
                    <Text style={{ fontSize: 12, color: COLORS.success, fontWeight: '500' }}>✓ Appuyer pour voir</Text>
                  </View>
                ) : (
                  <View style={{ backgroundColor: COLORS.primary, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 }}>
                    <Text style={{ color: '#fff', fontSize: 12, fontWeight: '600' }}>Uploader</Text>
                  </View>
                )}
              </View>
            </View>
          </TouchableOpacity>
        );
      })}

      {/* 📤 Bouton de soumission */}
      <TouchableOpacity 
        style={{ 
          backgroundColor: agencyData?.status === 'verified' ? COLORS.textSecondary : COLORS.primary, 
          paddingVertical: 14, 
          borderRadius: 12, 
          alignItems: 'center', 
          marginTop: 24, 
          flexDirection: 'row', 
          justifyContent: 'center' 
        }} 
        onPress={submitForVerification} 
        disabled={uploading || agencyData?.status === 'verified'}
      >
        {uploading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <>
            <Ionicons name={agencyData?.status === 'verified' ? 'checkmark' : 'cloud-upload-outline'} size={18} color="#fff" style={{ marginRight: 8 }} />
            <Text style={{ color: '#fff', fontWeight: '600', fontSize: 16 }}>
              {agencyData?.status === 'verified' ? '✓ Vérifiée' : '📤 Soumettre pour vérification'}
            </Text>
          </>
        )}
      </TouchableOpacity>

      {/* ℹ️ Info */}
      <View style={{ marginTop: 16, padding: 12, backgroundColor: '#ebf8ff', borderRadius: 12 }}>
        <Text style={{ color: '#2c5282', fontSize: 13 }}>💡 Les images sont compressées et sauvegardées directement dans la base.</Text>
      </View>

      {/* 👁️ Visionneuse plein écran (Modal) */}
      <Modal 
        visible={!!previewImage} 
        transparent={true} 
        animationType="fade" 
        onRequestClose={() => setPreviewImage(null)}
      >
        <TouchableOpacity 
          style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.95)', justifyContent: 'center', alignItems: 'center' }}
          activeOpacity={1}
          onPressOut={() => setPreviewImage(null)}
        >
          <TouchableOpacity activeOpacity={1} onPress={(e) => e.stopPropagation()}>
            <View style={{ position: 'absolute', top: 40, right: 20, padding: 10, zIndex: 10 }}>
              <Text style={{ color: '#fff', fontSize: 28, fontWeight: 'bold' }}>✕</Text>
            </View>
            {previewImage && (
              <Image 
                source={{ uri: previewImage }} 
                style={{ width: '90%', height: '75%', resizeMode: 'contain', borderRadius: 12, backgroundColor: '#000' }} 
              />
            )}
            <Text style={{ color: '#aaa', marginTop: 16, fontSize: 14, textAlign: 'center' }}>
              Appuyez sur ✕ ou en dehors de l'image pour fermer
            </Text>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>

    </ScrollView>
  );
}