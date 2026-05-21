import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, ActivityIndicator, Platform } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { getFirestore, doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

const storage = getStorage();
const db = getFirestore();
const auth = getAuth();

export default function AgencyVerificationScreen({ navigation }) {
  const [uploading, setUploading] = useState(false);
  const [status, setStatus] = useState(null);

  const pickAndUpload = async (type) => {
    if (Platform.OS === 'web') {
      Alert.alert('📱 Mobile uniquement', 'L\'upload de documents est disponible sur l\'application mobile.');
      return null;
    }
    const { assets } = await ImagePicker.launchImageLibraryAsync({ mediaTypes: 'images', quality: 0.8 });
    if (!assets?.[0]) return null;
    setUploading(true);
    try {
      const uri = assets[0].uri;
      const fileName = `${type}_${Date.now()}.jpg`;
      const storageRef = ref(storage, `agencies/${auth.currentUser?.uid || 'anon'}/${fileName}`);
      const res = await fetch(uri);
      const blob = await res.blob();
      await uploadBytes(storageRef, blob);
      return { type, url: await getDownloadURL(storageRef) };
    } catch (e) {
      Alert.alert('❌ Erreur', e.message);
      return null;
    } finally {
      setUploading(false);
    }
  };

  const submitVerification = async () => {
    if (Platform.OS === 'web') {
      Alert.alert('📱 Mobile uniquement', 'Cette fonctionnalité est disponible sur l\'application mobile.');
      return;
    }
    setUploading(true);
    try {
      const docs = await Promise.all(['licence', 'nina', 'insurance'].map(pickAndUpload));
      const validDocs = docs.filter(Boolean);
      if (validDocs.length < 3) {
        Alert.alert('⚠️ Incomplet', 'Veuillez fournir les 3 documents requis.');
        setUploading(false); return;
      }
      const docData = {};
      validDocs.forEach(d => docData[`${d.type}Url`] = d.url);
      docData.status = 'pending';
      docData.submittedAt = serverTimestamp();
      await setDoc(doc(db, 'agencies', auth.currentUser?.uid || 'anon'), docData, { merge: true });
      setStatus('pending');
      Alert.alert('✅ Envoyé', 'Votre demande de vérification est en cours de traitement.');
    } catch (e) {
      Alert.alert('❌ Échec', e.message);
    } finally {
      setUploading(false);
    }
  };

  if (Platform.OS === 'web') {
    return (
      <View style={styles.center}>
        <Text style={styles.title}>🛡️ Vérification Agence</Text>
        <Text style={styles.desc}>Cette fonctionnalité est disponible uniquement sur l'application mobile Android.</Text>
        <TouchableOpacity style={styles.btn} onPress={() => navigation?.goBack?.()}><Text style={styles.btnText}>Retour</Text></TouchableOpacity>
      </View>
    );
  }

  if (status) return <View style={styles.center}><Text style={styles.text}>📄 Statut : En attente de validation</Text></View>;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>🛡️ Vérification d'Agence</Text>
      <Text style={styles.desc}>Uploadez vos documents légaux pour obtenir le badge ✅ Vérifié</Text>
      <TouchableOpacity style={styles.btn} onPress={submitVerification} disabled={uploading}>
        {uploading ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnText}>📤 Envoyer les documents</Text>}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, justifyContent: 'center' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  title: { fontSize: 22, fontWeight: 'bold', marginBottom: 10, textAlign: 'center' },
  desc: { fontSize: 14, color: '#555', marginBottom: 20, textAlign: 'center', lineHeight: 20 },
  text: { fontSize: 16, textAlign: 'center' },
  btn: { backgroundColor: '#0066CC', padding: 15, borderRadius: 8, alignItems: 'center' },
  btnText: { color: '#fff', fontWeight: 'bold', fontSize: 16 }
});
