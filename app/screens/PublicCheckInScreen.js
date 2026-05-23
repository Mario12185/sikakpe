import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, Alert, TextInput, ActivityIndicator, Platform } from 'react-native';
import { Camera } from 'expo-camera';
import { db } from '../services/firebase';
import { collection, getDocs, addDoc, serverTimestamp } from 'firebase/firestore';

export default function PublicCheckInScreen({ navigation }) {
  const [hasPermission, setHasPermission] = useState(null);
  const [scanned, setScanned] = useState(false);
  const [manualCode, setManualCode] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    (async () => {
      if (Platform.OS === 'web') {
        setHasPermission('granted'); // Sur Web, la permission se fait au clic
      } else {
        const { status } = await Camera.requestCameraPermissionsAsync();
        setHasPermission(status === 'granted');
      }
    })();
  }, []);

  const handleCheckIn = async (code) => {
    if (!code.trim()) { Alert.alert('⚠️ Code requis', 'Scannez ou saisissez le QR Code.'); return; }
    setLoading(true);
    try {
      const querySnapshot = await getDocs(collection(db, 'sites'));
      let siteFound = null;
      querySnapshot.forEach((doc) => {
        if (doc.data().qrCode === code.trim().toUpperCase()) {
          siteFound = { id: doc.id, ...doc.data() };
        }
      });
      if (!siteFound) { Alert.alert('❌ Site inconnu', 'Vérifiez le code affiché.'); setLoading(false); return; }

      await addDoc(collection(db, 'checkins'), {
        siteId: siteFound.id, siteName: siteFound.name, agency: siteFound.agency,
        clientId: siteFound.clientId, guard: 'Gardien (Public)',
        timestamp: serverTimestamp(), status: 'valid', distance: 0, type: 'check_in'
      });

      Alert.alert('✅ Présence enregistrée', `📍 ${siteFound.name}\n🏢 ${siteFound.agency}\n🕒 ${new Date().toLocaleTimeString()}`);
      navigation?.goBack();
    } catch (e) {
      Alert.alert('❌ Échec', e.message);
    } finally { setLoading(false); setScanned(false); }
  };

  const handleBarCodeScanned = ({ data }) => {
    setScanned(true);
    handleCheckIn(data);
  };

  if (hasPermission === false) return (
    <View style={{flex:1,justifyContent:'center',alignItems:'center',padding:20,backgroundColor:'#fff'}}>
      <Text style={{fontSize:16,fontWeight:'bold',marginBottom:10}}>📷 Accès caméra refusé</Text>
      <Text style={{color:'#666',textAlign:'center',marginBottom:20}}>Utilisez le champ de saisie ci-dessous.</Text>
      <TextInput style={{width:'100%',backgroundColor:'#f5f5f5',padding:14,borderRadius:10,marginBottom:12}} placeholder="SITE-XXXXXX" value={manualCode} onChangeText={setManualCode} autoCapitalize="characters" />
      <TouchableOpacity style={{width:'100%',backgroundColor:'#1a365d',padding:14,borderRadius:10,alignItems:'center'}} onPress={()=>handleCheckIn(manualCode)} disabled={loading}>
        <Text style={{color:'#fff',fontWeight:'bold'}}>✅ Valider manuellement</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={{flex:1, backgroundColor:'#000'}}>
      <Camera onBarCodeScanned={scanned ? undefined : handleBarCodeScanned} style={{ flex: 1 }} />
      <View style={{position:'absolute',bottom:0,width:'100%',backgroundColor:'#fff',padding:20,borderTopLeftRadius:20,borderTopRightRadius:20}}>
        <Text style={{fontSize:16,fontWeight:'bold',marginBottom:10, textAlign:'center'}}>📸 Scanner ou saisir le code</Text>
        <TextInput style={{backgroundColor:'#f5f5f5',padding:12,borderRadius:8,marginBottom:12}} placeholder="Ex: SITE-LOME-001" value={manualCode} onChangeText={setManualCode} autoCapitalize="characters" />
        <TouchableOpacity style={{backgroundColor:'#1a365d',padding:14,borderRadius:10,alignItems:'center',marginBottom:10}} onPress={()=>handleCheckIn(manualCode)} disabled={loading}>
          {loading ? <ActivityIndicator color="#fff"/> : <Text style={{color:'#fff',fontWeight:'bold'}}>✅ Valider ma présence</Text>}
        </TouchableOpacity>
        <TouchableOpacity onPress={()=>setScanned(false)} style={{alignItems:'center',paddingVertical:8}}>
          <Text style={{color:'#3182ce',fontWeight:'600'}}>🔄 Relancer la caméra</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
