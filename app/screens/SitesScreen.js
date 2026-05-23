import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, Modal, TextInput, Alert, ActivityIndicator, Platform } from 'react-native';
import { db, auth, ensureAuth } from '../services/firebase';
import { collection, query, where, onSnapshot, addDoc, serverTimestamp } from 'firebase/firestore';
import { Ionicons } from '@expo/vector-icons';
// ✅ Importation de la librairie QR Code
import QRCode from 'qrcode';

export default function SitesScreen({ navigation }) {
  const [sites, setSites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [name, setName] = useState('');
  const [agency, setAgency] = useState('');
  const [lat, setLat] = useState('');
  const [lng, setLng] = useState('');

  useEffect(() => {
    (async () => {
      await ensureAuth();
      const uid = auth.currentUser?.uid;
      if (!uid) return;
      const q = query(collection(db, 'sites'), where('clientId', '==', uid));
      return onSnapshot(q, snap => {
        setSites(snap.docs.map(d => ({ id: d.id, ...d.data() })));
        setLoading(false);
      });
    })();
  }, []);

  // 🖨️ Fonction pour télécharger l'image QR Code
  const downloadQR = async (code, siteName) => {
    try {
      // Génère une URL d'image base64 (data:image/png;base64...)
      const url = await QRCode.toDataURL(code, { width: 400, margin: 2 });
      
      if (Platform.OS === 'web') {
        const link = document.createElement('a');
        link.download = `QR_${siteName.replace(/\s+/g, '_')}.png`;
        link.href = url;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      } else {
        Alert.alert('ℹ️ Info', 'Sur mobile, appuie longuement sur le QR code pour l\'enregistrer.', [
          { text: 'OK', onPress: () => Alert.alert('QR Code', code) }
        ]);
      }
    } catch (err) {
      console.error(err);
      Alert.alert('❌ Erreur', 'Impossible de générer l\'image QR.');
    }
  };

  const addSite = async () => {
    if (!name.trim() || !agency.trim()) { Alert.alert('⚠️ Requis', 'Nom et Agence obligatoires.'); return; }
    try {
      const uid = auth.currentUser?.uid;
      // Génère un code unique aléatoire
      const qrCode = `SITE-${Date.now().toString(36).toUpperCase().slice(-6)}`;
      
      await addDoc(collection(db, 'sites'), {
        name: name.trim(), agency: agency.trim(), qrCode,
        coordinates: { lat: parseFloat(lat) || 0, lng: parseFloat(lng) || 0 },
        clientId: uid, createdAt: serverTimestamp()
      });
      setName(''); setAgency(''); setLat(''); setLng('');
      setModalVisible(false);
      Alert.alert('✅ Site ajouté', `Code QR généré pour ${name.trim()}`);
    } catch (e) { Alert.alert('❌ Erreur', e.message); }
  };

  if (loading) return <View style={{flex:1,justifyContent:'center'}}><ActivityIndicator /><Text>Chargement...</Text></View>;

  return (
    <View style={{flex:1,backgroundColor:'#f7fafc',padding:20}}>
      <Text style={{fontSize:22,fontWeight:'bold',marginBottom:16}}>📍 Mes Sites à surveiller</Text>
      
      <FlatList 
        data={sites} 
        keyExtractor={i=>i.id} 
        ListEmptyComponent={<Text style={{color:'#666',textAlign:'center',marginTop:40}}>Aucun site. Ajoutez-en un pour commencer.</Text>}
        renderItem={({item}) => (
          <View style={{backgroundColor:'#fff',padding:16,marginBottom:12,borderRadius:12,borderLeftWidth:4,borderLeftColor:'#1a365d',flexDirection:'row',justifyContent:'space-between',alignItems:'center',elevation:2}}>
            <View style={{flex:1}}>
              <Text style={{fontWeight:'bold',fontSize:16,color:'#1a202c'}}>{item.name}</Text>
              <Text style={{color:'#666',marginTop:2}}>🏢 {item.agency}</Text>
              <Text style={{color:'#999',fontSize:12,marginTop:2}}>Code: {item.qrCode}</Text>
            </View>
            
            {/* 🖨️ Bouton Télécharger */}
            <TouchableOpacity 
              style={{backgroundColor:'#ebf8ff', padding:10, borderRadius:8, marginLeft:10}}
              onPress={() => downloadQR(item.qrCode, item.name)}
            >
              <Ionicons name="download-outline" size={24} color="#3182ce" />
            </TouchableOpacity>
          </View>
        )} 
      />

      {/* ➕ Bouton Flottant Ajouter */}
      <TouchableOpacity style={{position:'absolute',bottom:24,right:24,backgroundColor:'#1a365d',width:56,height:56,borderRadius:28,justifyContent:'center',alignItems:'center',elevation:5}} onPress={()=>setModalVisible(true)}>
        <Ionicons name="add" size={28} color="#fff" />
      </TouchableOpacity>

      {/* ➕ Modal Ajout Site */}
      <Modal visible={modalVisible} animationType="slide" transparent onRequestClose={()=>setModalVisible(false)}>
        <View style={{flex:1,backgroundColor:'rgba(0,0,0,0.5)',justifyContent:'flex-end'}}>
          <View style={{backgroundColor:'#fff',padding:24,borderTopLeftRadius:20,borderTopRightRadius:20}}>
            <Text style={{fontSize:18,fontWeight:'bold',marginBottom:16}}>➕ Nouveau site</Text>
            <TextInput placeholder="Nom du site (ex: Bureau Lomé)" value={name} onChangeText={setName} style={{borderWidth:1,borderColor:'#ddd',padding:12,borderRadius:8,marginBottom:10}} />
            <TextInput placeholder="Agence assignée (ex: Sécurité Plus)" value={agency} onChangeText={setAgency} style={{borderWidth:1,borderColor:'#ddd',padding:12,borderRadius:8,marginBottom:10}} />
            <View style={{flexDirection:'row',gap:10,marginBottom:16}}>
              <TextInput placeholder="Lat" value={lat} onChangeText={setLat} style={{flex:1,borderWidth:1,borderColor:'#ddd',padding:12,borderRadius:8}} keyboardType="numeric" />
              <TextInput placeholder="Lng" value={lng} onChangeText={setLng} style={{flex:1,borderWidth:1,borderColor:'#ddd',padding:12,borderRadius:8}} keyboardType="numeric" />
            </View>
            <TouchableOpacity onPress={addSite} style={{backgroundColor:'#1a365d',padding:14,borderRadius:10,alignItems:'center'}}><Text style={{color:'#fff',fontWeight:'bold'}}>Enregistrer</Text></TouchableOpacity>
            <TouchableOpacity onPress={()=>setModalVisible(false)} style={{marginTop:12,alignItems:'center'}}><Text style={{color:'#666'}}>Annuler</Text></TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}
