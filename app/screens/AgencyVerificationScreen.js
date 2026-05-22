// 📦 app/screens/AgencyVerificationScreen.js — UPLOAD RÉEL + Firestore
import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, Alert, ScrollView, ActivityIndicator, Platform, Linking } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { getFirestore, doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { Ionicons } from '@expo/vector-icons';

const storage = getStorage();
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

  // 🔍 Charger les données de l'agence au montage
  useEffect(() => {
    const loadAgency = async () => {
      const userId = auth.currentUser?.uid;
      if (!userId) return;
      try {
        setLoading(true);
        const docRef = doc(db, 'agencies', userId);
        const snap = await getDoc(docRef);
        if (snap.exists()) setAgencyData(snap.data());
      } catch (e) {
        console.warn('⚠️ Chargement agence échoué:', e.message);
      } finally {
        setLoading(false);
      }
    };
    loadAgency();
  }, []);

  // 📤 Fonction d'upload universelle (Web + Mobile)
  const uploadDocument = async (fileUri, docType) => {
    try {
      const userId = auth.currentUser?.uid || 'anonymous';
      const fileName = `${docType}_${Date.now()}.jpg`;
      const storageRef = ref(storage, `agencies/${userId}/${fileName}`);

      let blob;
      if (Platform.OS === 'web') {
        // 🌐 Web : fetch l'URI pour obtenir un blob
        const response = await fetch(fileUri);
        blob = await response.blob();
      } else {
        // 📱 Mobile : React Native blob
        blob = await new Promise((resolve, reject) => {
          const xhr = new XMLHttpRequest();
          xhr.onload = () => resolve(xhr.response);
          xhr.onerror = reject;
          xhr.responseType = 'blob';
          xhr.open('GET', fileUri, true);
          xhr.send(null);
        });
      }

      await uploadBytes(storageRef, blob);
      const downloadURL = await getDownloadURL(storageRef);
      return { type: docType, url: downloadURL };
    } catch (err) {
      console.error(`❌ Upload ${docType} échoué:`, err);
      throw new Error(`Échec de l'upload ${docType}: ${err.message}`);
    }
  };

  // 🖼️ Sélectionner et uploader un document
  const pickAndUpload = async (docType, docLabel) => {
    try {
      // Demander permission galerie/caméra
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('🔐 Permission requise', 'Autorisez l\'accès à la galerie pour uploader des documents.');
        if (Platform.OS === 'web') {
          // 🌐 Web : ouvrir les paramètres du navigateur
          Linking.openSettings?.();
        }
        return null;
      }

      // Ouvrir le sélecteur
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        quality: 0.8,
        aspect: [4, 3],
      });

      if (result.canceled || !result.assets?.[0]) return null;

      setUploading(true);
      Alert.alert('📤 Upload en cours', `Traitement de ${docLabel}...`);

      // Upload vers Firebase Storage
      const { url } = await uploadDocument(result.assets[0].uri, docType);

      // Mettre à jour Firestore
      const userId = auth.currentUser?.uid;
      if (userId) {
        const docRef = doc(db, 'agencies', userId);
        await setDoc(docRef, {
          documents: { [`${docType}Url`]: url },
          status: 'pending',
          submittedAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        }, { merge: true });
        
        // Rafraîchir les données locales
        const snap = await getDoc(docRef);
        if (snap.exists()) setAgencyData(snap.data());
      }

      Alert.alert('✅ Document uploadé', `${docLabel} a été soumis pour validation.`);
      return url;
    } catch (err) {
      console.error('❌ pickAndUpload error:', err);
      Alert.alert('❌ Échec', err.message || 'Une erreur est survenue lors de l\'upload.');
      return null;
    } finally {
      setUploading(false);
    }
  };

  // 📋 Soumettre tous les documents pour vérification
  const submitForVerification = async () => {
    const userId = auth.currentUser?.uid;
    if (!userId) {
      Alert.alert('🔐 Connexion requise', 'Veuillez vous connecter pour soumettre une vérification.');
      return;
    }

    const docs = agencyData?.documents || {};
    const required = ['licenceUrl', 'ninaUrl', 'insuranceUrl'];
    const missing = required.filter(k => !docs[k]);

    if (missing.length > 0) {
      Alert.alert('⚠️ Documents manquants', `Veuillez uploader : ${missing.map(m => m.replace('Url', '')).join(', ')}`);
      return;
    }

    try {
      setUploading(true);
      await setDoc(doc(db, 'agencies', userId), {
        status: 'pending',
        submittedAt: serverTimestamp(),
        reviewedAt: null,
        reviewedBy: null
      }, { merge: true });
      
      setAgencyData(prev => prev ? { ...prev, status: 'pending' } : null);
      Alert.alert('✅ Soumis pour vérification', 'L\'équipe SikaKpɛ examinera vos documents sous 24-48h.');
    } catch (err) {
      Alert.alert('❌ Échec', err.message);
    } finally {
      setUploading(false);
    }
  };

  // 🎨 Afficher le statut
  const getStatusDisplay = () => {
    const status = agencyData?.status || 'none';
    const map = {
      verified: { label: '✅ Agence Vérifiée', color: COLORS.success, icon: 'checkmark-circle', desc: 'Votre agence est approuvée et visible par les clients.' },
      rejected: { label: '❌ Vérification refusée', color: COLORS.error, icon: 'alert-circle', desc: 'Contactez support@sikakpe.tg pour corriger les documents.' },
      pending: { label: '⏳ En attente de validation', color: COLORS.warning, icon: 'time-outline', desc: 'Vos documents sont en cours d\'examen par l\'équipe SikaKpɛ.' },
      none: { label: '📄 Aucun document soumis', color: COLORS.textSecondary, icon: 'document-outline', desc: 'Uploadez vos documents légaux pour obtenir le badge Vérifié.' }
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
        <Text style={{ fontSize: 14, color: COLORS.textSecondary, marginTop: 4 }}>Soumettez vos documents légaux pour être visible comme agence vérifiée.</Text>
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
        { key: 'insuranceUrl', label: 'Assurance responsabilité civile', icon: 'shield-checkmark-outline' }
      ].map((doc) => {
        const isUploaded = !!docs[doc.key];
        return (
          <TouchableOpacity 
            key={doc.key}
            style={{ backgroundColor: COLORS.card, borderRadius: 12, padding: 14, marginBottom: 10, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', elevation: 1 }}
            onPress={() => !isUploaded && !uploading && pickAndUpload(doc.key.replace('Url', ''), doc.label)}
            disabled={uploading || isUploaded}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
              <Ionicons name={isUploaded ? 'checkmark-circle' : doc.icon} size={20} color={isUploaded ? COLORS.success : COLORS.textSecondary} style={{ marginRight: 12 }} />
              <View>
                <Text style={{ fontSize: 14, fontWeight: isUploaded ? '600' : '500', color: isUploaded ? COLORS.success : COLORS.text }}>{doc.label}</Text>
                {isUploaded && <Text style={{ fontSize: 12, color: COLORS.textSecondary }}>✓ Uploadé</Text>}
              </View>
            </View>
            {!isUploaded && (
              <View style={{ backgroundColor: COLORS.primary, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 }}>
                <Text style={{ color: '#fff', fontSize: 12, fontWeight: '600' }}>Uploader</Text>
              </View>
            )}
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
              {agencyData?.status === 'verified' ? '✓ Agence Vérifiée' : '📤 Soumettre pour vérification'}
            </Text>
          </>
        )}
      </TouchableOpacity>

      {/* ℹ️ Info */}
      <View style={{ marginTop: 16, padding: 12, backgroundColor: '#ebf8ff', borderRadius: 12 }}>
        <Text style={{ color: '#2c5282', fontSize: 13, lineHeight: 18 }}>
          💡 <Text style={{ fontWeight: '600' }}>Conseil :</Text> Prenez des photos nettes de vos documents. 
          Les formats JPG et PNG sont acceptés. Taille max : 5 Mo par fichier.
        </Text>
      </View>
    </ScrollView>
  );
}