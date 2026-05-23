import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Alert, TextInput, ActivityIndicator } from 'react-native';
import { db, auth, ensureAuth } from '../services/firebase';
// ✅ Importation CORRECTE en haut du fichier
import { doc, getDoc, addDoc, collection, serverTimestamp, getDocs } from 'firebase/firestore'; 

export default function CheckInScreen({ navigation }) {
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);

  const handleCheckIn = async () => {
    if (!code.trim()) { Alert.alert('⚠️ Code requis', 'Scannez ou saisissez le QR Code du site.'); return; }
    setLoading(true);
    try {
      await ensureAuth();
      
      // Scan des sites pour trouver le bon QR Code (MVP)
      const querySnapshot = await getDocs(collection(db, 'sites'));
      let siteFound = null;
      
      querySnapshot.forEach((doc) => {
        if (doc.data().qrCode === code.trim().toUpperCase()) {
          siteFound = { id: doc.id, ...doc.data() };
        }
      });

      if (!siteFound) {
        Alert.alert('❌ Site inconnu', `Aucun site ne correspond au code "${code.trim()}".`);
        setLoading(false);
        return;
      }
      
      // Enregistrer le check-in
      await addDoc(collection(db, 'checkins'), {
        siteId: siteFound.id,
        siteName: siteFound.name,
        agency: siteFound.agency,
        clientId: siteFound.clientId,
        guard: 'Gardien (Saisie)',
        timestamp: serverTimestamp(),
        status: 'valid',
        distance: 0,
        type: 'check_in'
      });

      Alert.alert('✅ Check-in réussi', `Site: ${siteFound.name}\nHeure: ${new Date().toLocaleTimeString()}`);
      navigation.goBack();
    } catch (e) {
      console.error(e);
      Alert.alert('❌ Échec', e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={{flex:1,padding:20,backgroundColor:'#f7fafc',justifyContent:'center'}}>
      <Text style={{fontSize:24,fontWeight:'bold',color:'#1a365d',marginBottom:10}}>📍 Check-in Gardien</Text>
      <Text style={{color:'#666',marginBottom:20}}>Saisissez le code QR pour valider votre présence.</Text>
      
      <TextInput 
        style={{backgroundColor:'#fff',padding:14,borderRadius:10,fontSize:18,marginBottom:16,borderWidth:1,borderColor:'#1a365d'}} 
        placeholder="Ex: SITE-LOME-001" 
        value={code} 
        onChangeText={t => setCode(t.toUpperCase())} 
        autoCapitalize="characters" 
        editable={!loading} 
      />
      
      <TouchableOpacity style={{backgroundColor:'#1a365d',padding:16,borderRadius:10,alignItems:'center'}} onPress={handleCheckIn} disabled={loading}>
        {loading ? <ActivityIndicator color="#fff" /> : <Text style={{color:'#fff',fontWeight:'bold',fontSize:16}}>✅ Valider ma présence</Text>}
      </TouchableOpacity>
    </View>
  );
}
