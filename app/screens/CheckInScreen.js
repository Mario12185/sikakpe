import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Alert, TextInput, ActivityIndicator } from 'react-native';
import { db, auth, ensureAuth } from '../services/firebase';
import { doc, getDoc, addDoc, collection, serverTimestamp } from 'firebase/firestore';

export default function CheckInScreen({ navigation }) {
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);

  const handleCheckIn = async () => {
    if (!code.trim()) { Alert.alert('⚠️ Code requis', 'Scannez ou saisissez le QR Code du site.'); return; }
    setLoading(true);
    try {
      await ensureAuth();
      // Trouver le site
      const { docs } = await getDocs(collection(db, 'sites')); // Pour MVP simple, on scanne tous les sites (optimisable plus tard)
      const site = docs.find(d => d.data().qrCode === code.trim());
      if (!site) { Alert.alert('❌ Site inconnu', `Aucun site avec le code "${code.trim()}"`); setLoading(false); return; }
      
      const data = site.data();
      // Enregistrer le check-in lié au client propriétaire du site
      await addDoc(collection(db, 'checkins'), {
        siteId: site.id, siteName: data.name, agency: data.agency,
        clientId: data.clientId, guard: 'Gardien (scan)', timestamp: serverTimestamp(),
        status: 'valid', distance: 0, type: 'check_in'
      });
      Alert.alert('✅ Check-in réussi', `Site: ${data.name}\nAgence: ${data.agency}\nHeure: ${new Date().toLocaleTimeString()}`);
      navigation.goBack();
    } catch (e) { Alert.alert('❌ Échec', e.message); }
    finally { setLoading(false); }
  };

  // Import manquant pour getDocs dans le bloc précédent, on l'ajoute ici proprement:
  return (
    <View style={{flex:1,padding:20,backgroundColor:'#f7fafc'}}>
      <Text style={{fontSize:22,fontWeight:'bold',color:'#1a365d',marginBottom:8}}>📍 Check-in Gardien</Text>
      <Text style={{color:'#666',marginBottom:20}}>Saisissez le code QR affiché sur le site pour valider votre présence.</Text>
      <TextInput style={{backgroundColor:'#fff',padding:14,borderRadius:10,fontSize:16,marginBottom:16,borderWidth:1,borderColor:'#e2e8f0'}} placeholder="Ex: SITE-LOME-001" value={code} onChangeText={setCode} autoCapitalize="characters" editable={!loading} />
      <TouchableOpacity style={{backgroundColor:'#1a365d',padding:14,borderRadius:10,alignItems:'center'}} onPress={handleCheckIn} disabled={loading}>
        {loading ? <ActivityIndicator color="#fff" /> : <Text style={{color:'#fff',fontWeight:'bold'}}>✅ Valider ma présence</Text>}
      </TouchableOpacity>
      <Text style={{color:'#999',fontSize:11,marginTop:20,textAlign:'center'}}>Ce module est utilisé par les gardiens des agences partenaires.</Text>
    </View>
  );
}
// Correction import getDocs manquant dans le code React :
import { getDocs } from 'firebase/firestore';
