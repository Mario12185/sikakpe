// 📦 src/screens/CheckInScreen.js — SAISIE MANUELLE + GPS + DISTANCE
import React, { useState } from 'react';
import { View, Text, StyleSheet, Alert, ActivityIndicator, TouchableOpacity, TextInput, Platform } from 'react-native';
import { getFirestore, collection, addDoc, doc, getDoc, serverTimestamp } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

const db = getFirestore();
const auth = getAuth();

// 📐 Calcul distance GPS (formule Haversine)
const getDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371e3; // mètres
  const φ1 = lat1 * Math.PI/180, φ2 = lat2 * Math.PI/180;
  const Δφ = (lat2-lat1) * Math.PI/180, Δλ = (lon2-lon1) * Math.PI/180;
  const a = Math.sin(Δφ/2)**2 + Math.cos(φ1)*Math.cos(φ2)*Math.sin(Δλ/2)**2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
};

export default function CheckInScreen({ navigation }) {
  const [loading, setLoading] = useState(false);
  const [qrInput, setQrInput] = useState('');

  const processCheckIn = async (qrCode) => {
    if (!qrCode.trim()) {
      Alert.alert('⚠️ Code requis', 'Veuillez entrer un code de site valide');
      return;
    }
    setLoading(true);

    try {
      // 1️⃣ Récupérer le site depuis Firestore
      const siteRef = doc(db, 'sites', qrCode.trim());
      const siteSnap = await getDoc(siteRef);
      if (!siteSnap.exists()) throw new Error('Site inconnu. Vérifiez le code QR.');
      const site = siteSnap.data();
      if (!site.coordinates?.lat || !site.coordinates.lng) throw new Error('Coordonnées du site manquantes');

      // 2️⃣ Obtenir la position GPS (Web + Natif)
      let coords;
      let gpsSource = 'inconnu';

      if (Platform.OS === 'web' && typeof navigator !== 'undefined' && navigator.geolocation) {
        // 🌐 Web : API navigateur
        coords = await new Promise((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(
            (pos) => resolve({ latitude: pos.coords.latitude, longitude: pos.coords.longitude, accuracy: pos.coords.accuracy }),
            (err) => reject(err),
            { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
          );
        });
        gpsSource = 'navigateur';
      } 
      else if (Platform.OS !== 'web') {
        // 📱 Natif : Expo Location
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') throw new Error('Accès GPS refusé. Activez la localisation.');
        const { coords: c } = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
        coords = { latitude: c.latitude, longitude: c.longitude, accuracy: c.accuracy };
        gpsSource = 'expo';
      } 
      else {
        // 🖥️ Fallback desktop (pour test uniquement)
        Alert.alert('⚠️ GPS indisponible', 'Sur desktop, la localisation est simulée. Pour un check-in réel, utilisez un mobile.');
        coords = { latitude: site.coordinates.lat, longitude: site.coordinates.lng, accuracy: 100 };
        gpsSource = 'simulé';
      }

      // 3️⃣ Calculer la distance
      const distance = getDistance(coords.latitude, coords.longitude, site.coordinates.lat, site.coordinates.lng);

      // 4️⃣ Valider la distance (sauf si GPS simulé pour test)
      if (gpsSource !== 'simulé' && distance > site.radiusMeters) {
        Alert.alert('📍 Hors zone', `Vous êtes à ${Math.round(distance)}m du site (max autorisé: ${site.radiusMeters}m)`);
        return;
      }

      // 5️⃣ Enregistrer le check-in
      const guardId = auth.currentUser?.uid || 'anonymous';
      await addDoc(collection(db, 'checkins'), {
        siteId: qrCode.trim(),
        guardId,
        type: 'check_in',
        timestamp: serverTimestamp(),
        gps: { lat: coords.latitude, lng: coords.longitude, accuracy: coords.accuracy },
        gpsSource,
        status: gpsSource === 'simulé' ? 'test' : 'valid',
        distanceMeters: Math.round(distance)
      });

      // 6️⃣ Feedback utilisateur
      const modeMsg = gpsSource === 'simulé' ? '\n🧪 Mode test (GPS simulé)' : gpsSource === 'navigateur' ? '\n🌐 GPS navigateur' : '\n📱 GPS natif';
      Alert.alert('✅ Check-in réussi', `📍 ${site.name}\n⏰ ${new Date().toLocaleTimeString()}\n📏 ${Math.round(distance)}m${modeMsg}`);
      navigation?.goBack?.();

    } catch (err) {
      console.error('CheckIn error:', err);
      Alert.alert('❌ Échec', err.message || 'Une erreur est survenue');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      {/* 🎯 En-tête */}
      <View style={styles.header}>
        <Text style={styles.title}>📍 Check-in QR/GPS</Text>
        <Text style={styles.subtitle}>
          Entrez le code du site pour valider votre présence. 
          La localisation GPS sera vérifiée automatiquement.
        </Text>
      </View>

      {/* 🔤 Champ de saisie */}
      <View style={styles.inputCard}>
        <Text style={styles.label}>Code du site (ex: SITE-TEST-001)</Text>
        <TextInput
          style={styles.input}
          value={qrInput}
          onChangeText={setQrInput}
          placeholder="SITE-TEST-001"
          autoCapitalize="characters"
          autoCorrect={false}
          editable={!loading}
          onSubmitEditing={() => processCheckIn(qrInput)}
          returnKeyType="done"
        />
        <TouchableOpacity 
          style={[styles.btn, loading && styles.btnDisabled]} 
          onPress={() => processCheckIn(qrInput)}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.btnText}>✅ Valider le check-in</Text>
          )}
        </TouchableOpacity>
      </View>

      {/* ℹ️ Info GPS */}
      <View style={styles.infoBox}>
        <Text style={styles.infoText}>
          🛰️ <Text style={{ fontWeight: '600' }}>GPS actif :</Text> Votre position sera vérifiée. 
          Assurez-vous d'être sur site pour un check-in valide.
        </Text>
      </View>

      {/* 🧪 Mode test */}
      <TouchableOpacity 
        style={styles.testBtn} 
        onPress={() => {
          setQrInput('SITE-TEST-001');
          Alert.alert('🧪 Mode test', 'Code de test pré-rempli. Cliquez sur "Valider" pour simuler un check-in.');
        }}
      >
        <Text style={styles.testBtnText}>🧪 Tester avec SITE-TEST-001</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f7fafc', padding: 20 },
  header: { marginBottom: 24 },
  title: { fontSize: 24, fontWeight: '700', color: '#1a365d', marginBottom: 8 },
  subtitle: { fontSize: 14, color: '#4a5568', lineHeight: 20 },
  inputCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#1a365d',
    elevation: 3,
    shadowColor: '#1a365d',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12
  },
  label: { fontSize: 14, fontWeight: '600', color: '#1a202c', marginBottom: 8 },
  input: {
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 10,
    padding: 14,
    fontSize: 16,
    color: '#1a202c',
    marginBottom: 16
  },
  btn: {
    backgroundColor: '#1a365d',
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center'
  },
  btnDisabled: { opacity: 0.7 },
  btnText: { color: '#fff', fontWeight: '600', fontSize: 16 },
  infoBox: {
    padding: 12,
    backgroundColor: '#ebf8ff',
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#3182ce',
    marginBottom: 16
  },
  infoText: { color: '#2c5282', fontSize: 13, lineHeight: 18 },
  testBtn: {
    padding: 12,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#dd6b20',
    alignItems: 'center',
    borderStyle: 'dashed'
  },
  testBtnText: { color: '#dd6b20', fontWeight: '600', fontSize: 14 }
});