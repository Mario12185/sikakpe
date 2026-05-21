import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Alert, ActivityIndicator, TouchableOpacity } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as Location from 'expo-location';
import { getFirestore, collection, addDoc, doc, getDoc, serverTimestamp } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

const db = getFirestore();
const auth = getAuth();

// 📐 Calcul distance GPS (formule Haversine simplifiée)
const getDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371e3; // mètres
  const φ1 = lat1 * Math.PI/180, φ2 = lat2 * Math.PI/180;
  const Δφ = (lat2-lat1) * Math.PI/180, Δλ = (lon2-lon1) * Math.PI/180;
  const a = Math.sin(Δφ/2)**2 + Math.cos(φ1)*Math.cos(φ2)*Math.sin(Δλ/2)**2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
};

export default function CheckInScreen({ route, navigation }) {
  const [permission, requestPermission] = useCameraPermissions();
  const [scanning, setScanning] = useState(true);
  const [loading, setLoading] = useState(false);
  const [lastScan, setLastScan] = useState('');

  const handleBarCodeScanned = async ({ type, data }) => {
    if (loading || data === lastScan) return;
    setLastScan(data);
    setScanning(false);
    setLoading(true);

    try {
      // 1. Récupérer les coordonnées du site scanné
      const siteRef = doc(db, 'sites', data); // qrCodeId = doc ID
      const siteSnap = await getDoc(siteRef);
      if (!siteSnap.exists()) throw new Error('QR Code invalide ou site inconnu');
      
      const site = siteSnap.data();
      if (!site.coordinates?.lat || !site.coordinates.lng) throw new Error('Coordonnées du site manquantes');

      // 2. Obtenir la position GPS actuelle
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') throw new Error('Accès GPS refusé. Activez la localisation.');
      
      const { coords } = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
      const distance = getDistance(coords.latitude, coords.longitude, site.coordinates.lat, site.coordinates.lng);

      // 3. Validation
      if (distance > site.radiusMeters) {
        Alert.alert('📍 Position hors zone', `Vous êtes à ${Math.round(distance)}m du site (max: ${site.radiusMeters}m)`);
        return;
      }

      // 4. Enregistrer le check-in
      const guardId = auth.currentUser?.uid || 'anonymous_guard';
      await addDoc(collection(db, 'checkins'), {
        siteId: data,
        guardId,
        type: 'check_in',
        timestamp: serverTimestamp(),
        gps: { lat: coords.latitude, lng: coords.longitude },
        status: 'valid',
        distanceMeters: Math.round(distance)
      });

      Alert.alert('✅ Check-in réussi', `Site: ${site.name}\nHeure: ${new Date().toLocaleTimeString()}\nDistance: ${Math.round(distance)}m`);
      navigation.goBack();

    } catch (err) {
      Alert.alert('❌ Échec', err.message);
    } finally {
      setLoading(false);
      setScanning(true);
    }
  };

  if (!permission) return <View style={styles.center}><ActivityIndicator size="large" /><Text>Demande caméra...</Text></View>;
  if (!permission.granted) return (
    <View style={styles.center}>
      <Text style={styles.text}>📷 Caméra requise pour scanner le QR</Text>
      <TouchableOpacity style={styles.btn} onPress={requestPermission}><Text style={styles.btnText}>Autoriser</Text></TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.container}>
      <CameraView style={StyleSheet.absoluteFill} onBarcodeScanned={scanning ? handleBarCodeScanned : undefined} />
      {loading && <View style={styles.overlay}><ActivityIndicator size="large" color="#fff" /><Text style={styles.overlayText}>Validation en cours...</Text></View>}
      <View style={styles.hintBox}><Text style={styles.hintText}>📍 Pointez le QR Code du site</Text></View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  text: { fontSize: 16, textAlign: 'center', marginBottom: 20 },
  btn: { backgroundColor: '#0066CC', padding: 12, borderRadius: 8 },
  btnText: { color: '#fff', fontWeight: 'bold' },
  overlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'center', alignItems: 'center' },
  overlayText: { color: '#fff', marginTop: 10, fontSize: 16 },
  hintBox: { position: 'absolute', bottom: 40, left: 20, right: 20, backgroundColor: 'rgba(0,0,0,0.6)', padding: 12, borderRadius: 8 },
  hintText: { color: '#fff', textAlign: 'center', fontWeight: 'bold' }
});