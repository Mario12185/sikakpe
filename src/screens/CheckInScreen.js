import React, { useState } from 'react';
import { View, Text, StyleSheet, Alert, ActivityIndicator, TouchableOpacity, TextInput } from 'react-native';
import { getFirestore, collection, addDoc, doc, getDoc, serverTimestamp } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

const db = getFirestore();
const auth = getAuth();

const getDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371e3;
  const φ1 = lat1 * Math.PI/180, φ2 = lat2 * Math.PI/180;
  const Δφ = (lat2-lat1) * Math.PI/180, Δλ = (lon2-lon1) * Math.PI/180;
  const a = Math.sin(Δφ/2)**2 + Math.cos(φ1)*Math.cos(φ2)*Math.sin(Δλ/2)**2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
};

export default function CheckInScreen({ navigation }) {
  const [loading, setLoading] = useState(false);
  const [qrInput, setQrInput] = useState('');

  const processCheckIn = async (qrCode) => {
    if (!qrCode.trim()) { Alert.alert('⚠️ Code requis', 'Entrez un code valide'); return; }
    setLoading(true);
    try {
      const siteRef = doc(db, 'sites', qrCode.trim());
      const siteSnap = await getDoc(siteRef);
      if (!siteSnap.exists()) throw new Error('Site inconnu. Vérifiez le code.');
      const site = siteSnap.data();
      if (!site.coordinates?.lat || !site.coordinates.lng) throw new Error('Coordonnées manquantes');

      const getPosition = () => {
        if (typeof navigator !== 'undefined' && navigator.geolocation) {
          return new Promise((resolve, reject) => {
            navigator.geolocation.getCurrentPosition((p) => resolve(p.coords), reject, { enableHighAccuracy: true, timeout: 10000 });
          });
        }
        return { latitude: site.coordinates.lat, longitude: site.coordinates.lng, accuracy: 100 };
      };
      const coords = await getPosition();
      const distance = getDistance(coords.latitude, coords.longitude, site.coordinates.lat, site.coordinates.lng);
      if (distance > site.radiusMeters) { Alert.alert('📍 Hors zone', `Vous êtes à ${Math.round(distance)}m (max: ${site.radiusMeters}m)`); return; }

      const guardId = auth.currentUser?.uid || 'anonymous';
      await addDoc(collection(db, 'checkins'), {
        siteId: qrCode.trim(), guardId, type: 'check_in', timestamp: serverTimestamp(),
        gps: { lat: coords.latitude, lng: coords.longitude }, status: 'valid', distanceMeters: Math.round(distance)
      });
      Alert.alert('✅ Check-in réussi', `📍 ${site.name}\n⏰ ${new Date().toLocaleTimeString()}`);
      navigation?.goBack?.();
    } catch (err) { Alert.alert('❌ Échec', err.message); }
    finally { setLoading(false); }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>📍 Check-in QR/GPS</Text>
        <Text style={styles.subtitle}>Entrez le code du site pour valider votre présence.</Text>
      </View>
      <View style={styles.inputCard}>
        <Text style={styles.label}>Code du site (ex: SITE-TEST-001)</Text>
        <TextInput style={styles.input} value={qrInput} onChangeText={setQrInput} placeholder="SITE-TEST-001" autoCapitalize="characters" editable={!loading} />
        <TouchableOpacity style={[styles.btn, loading && styles.btnDisabled]} onPress={() => processCheckIn(qrInput)} disabled={loading}>
          {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnText}>✅ Valider</Text>}
        </TouchableOpacity>
      </View>
      <View style={styles.infoBox}>
        <Text style={styles.infoText}>💡 Test : Entrez `SITE-TEST-001` après l'avoir créé dans Firestore.</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f7fafc', padding: 20 },
  header: { marginBottom: 24 },
  title: { fontSize: 24, fontWeight: '700', color: '#1a365d', marginBottom: 8 },
  subtitle: { fontSize: 14, color: '#4a5568', lineHeight: 20 },
  inputCard: { backgroundColor: '#fff', borderRadius: 16, padding: 20, marginBottom: 16, borderLeftWidth: 4, borderLeftColor: '#1a365d', elevation: 3 },
  label: { fontSize: 14, fontWeight: '600', color: '#1a202c', marginBottom: 8 },
  input: { backgroundColor: '#f8fafc', borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 10, padding: 14, fontSize: 16, marginBottom: 16 },
  btn: { backgroundColor: '#1a365d', paddingVertical: 14, borderRadius: 10, alignItems: 'center' },
  btnDisabled: { opacity: 0.7 },
  btnText: { color: '#fff', fontWeight: '600', fontSize: 16 },
  infoBox: { padding: 12, backgroundColor: '#ebf8ff', borderRadius: 12, borderLeftWidth: 4, borderLeftColor: '#3182ce' },
  infoText: { color: '#2c5282', fontSize: 13, lineHeight: 18 }
});
