// 📦 app/screens/AgencyVerificationScreen.js — ULTRA-SIMPLE + FIREBASE DIRECT
import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, Alert, ScrollView, ActivityIndicator } from 'react-native';
import { db, auth, ensureAuth } from '../services/firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';

export default function AgencyVerificationScreen() {
  const [loading, setLoading] = useState(true);
  const [agency, setAgency] = useState(null);

  useEffect(() => {
    (async () => {
      await ensureAuth();
      const uid = auth.currentUser?.uid;
      if (uid) {
        const snap = await getDoc(doc(db, 'agencies', uid));
        if (snap.exists()) setAgency(snap.data());
      }
      setLoading(false);
    })();
  }, []);

  const handleUpload = async (docKey) => {
    // 🌐 Web only: utiliser un input file natif
    if (typeof document !== 'undefined') {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = 'image/*';
      input.onchange = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        
        const reader = new FileReader();
        reader.onloadend = async () => {
          try {
            const uid = auth.currentUser?.uid;
            await setDoc(doc(db, 'agencies', uid), {
              documents: { [`${docKey}Url`]: reader.result },
              status: 'pending',
              updatedAt: new Date()
            }, { merge: true });
            
            // Recharger les données
            const snap = await getDoc(doc(db, 'agencies', uid));
            if (snap.exists()) setAgency(snap.data());
            
            Alert.alert('✅ Enregistré', `${docKey} sauvegardé`);
          } catch (err) {
            console.error('❌ Upload error:', err);
            Alert.alert('❌ Échec', err.message);
          }
        };
        reader.readAsDataURL(file);
      };
      input.click();
    } else {
      Alert.alert('📱 Mobile', 'Utilisez Chrome sur PC pour tester.');
    }
  };

  const submit = async () => {
    const uid = auth.currentUser?.uid;
    const docs = agency?.documents || {};
    
    if (!docs.licenceUrl || !docs.ninaUrl || !docs.insuranceUrl) {
      Alert.alert('⚠️ Incomplet', 'Uploadez les 3 documents d\'abord.');
      return;
    }
    
    try {
      await setDoc(doc(db, 'agencies', uid), {
        status: 'pending',
        submittedAt: new Date()
      }, { merge: true });
      
      setAgency(prev => prev ? { ...prev, status: 'pending' } : null);
      Alert.alert('✅ Soumis', 'En attente de validation.');
    } catch (e) {
      Alert.alert('❌ Échec', e.message);
    }
  };

  if (loading) return <View style={{flex:1,justifyContent:'center'}}><ActivityIndicator /><Text>Chargement...</Text></View>;

  const status = agency?.status || 'none';
  const docs = agency?.documents || {};

  return (
    <ScrollView style={{flex:1,padding:20,backgroundColor:'#f7fafc'}}>
      <Text style={{fontSize:22,fontWeight:'bold',color:'#1a365d',marginBottom:8}}>🛡️ Vérification Agence</Text>
      <Text style={{color:'#666',marginBottom:20}}>Statut: <Text style={{fontWeight:'bold',color:status==='pending'?'#00aa55':'#1a202c'}}>{status}</Text></Text>

      {['licence','nina','insurance'].map(key => {
        const uploaded = !!docs[`${key}Url`];
        return (
          <TouchableOpacity 
            key={key} 
            onPress={() => !uploaded && handleUpload(key)} 
            disabled={uploaded}
            style={{backgroundColor:'#fff',padding:16,marginBottom:12,borderRadius:12,borderLeftWidth:4,borderLeftColor:uploaded?'#00aa55':'#1a365d'}}
          >
            <Text style={{fontWeight:'600'}}>{key==='licence'?'Licence':key==='nina'?'NINA':'Assurance'}</Text>
            <Text style={{color:uploaded?'#00aa55':'#1a365d',marginTop:4}}>
              {uploaded ? '✓ Enregistré' : '→ Cliquer pour uploader'}
            </Text>
          </TouchableOpacity>
        );
      })}

      <TouchableOpacity 
        onPress={submit} 
        disabled={status==='verified'}
        style={{backgroundColor:status==='verified'?'#666':'#1a365d',padding:14,borderRadius:10,alignItems:'center',marginTop:20}}
      >
        <Text style={{color:'#fff',fontWeight:'bold'}}>{status==='verified'?'✓ Vérifiée':'📤 Soumettre'}</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}