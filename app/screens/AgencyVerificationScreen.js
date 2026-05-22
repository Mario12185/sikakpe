// 📦 app/screens/AgencyVerificationScreen.js — VERSION MINIMALE GARANTIE
import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, Alert, ScrollView, ActivityIndicator, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { db, auth, ensureAuth } from '../services/firebase';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';

const COLORS = { primary: '#1a365d', success: '#00aa55', background: '#f7fafc', card: '#ffffff', text: '#1a202c', textSecondary: '#4a5568' };

export default function AgencyVerificationScreen() {
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [agency, setAgency] = useState(null);
  const fileInputRef = useRef(null);
  const [currentDoc, setCurrentDoc] = useState(null);

  useEffect(() => {
    const load = async () => {
      await ensureAuth();
      const uid = auth.currentUser?.uid;
      if (!uid) return;
      try {
        const snap = await getDoc(doc(db, 'agencies', uid));
        if (snap.exists()) setAgency(snap.data());
      } catch (e) { console.warn(e); }
      finally { setLoading(false); }
    };
    load();
  }, []);

  const handleFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file || !currentDoc) return;
    setUploading(true);
    try {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const uid = auth.currentUser?.uid;
        await setDoc(doc(db, 'agencies', uid), {
          documents: { [`${currentDoc}Url`]: reader.result },
          status: 'pending',
          updatedAt: new Date()
        }, { merge: true });
        Alert.alert('✅ Enregistré');
        // Recharge les données
        const snap = await getDoc(doc(db, 'agencies', uid));
        if (snap.exists()) setAgency(snap.data());
        setUploading(false);
        setCurrentDoc(null);
      };
      reader.readAsDataURL(file);
    } catch (err) {
      Alert.alert('❌ Erreur', err.message);
      setUploading(false);
    }
  };

  const startUpload = (docKey) => {
    if (Platform.OS === 'web') {
      setCurrentDoc(docKey);
      fileInputRef.current?.click();
    } else {
      Alert.alert('📱 Mobile', 'Utilise Chrome sur PC pour tester l\'upload MVP.');
    }
  };

  const submit = async () => {
    const uid = auth.currentUser?.uid;
    const docs = agency?.documents || {};
    if (!docs.licenceUrl || !docs.ninaUrl || !docs.insuranceUrl) {
      Alert.alert('⚠️ Incomplet', 'Uploadez les 3 documents d\'abord.');
      return;
    }
    await setDoc(doc(db, 'agencies', uid), { status: 'pending', submittedAt: serverTimestamp() }, { merge: true });
    Alert.alert('✅ Soumis', 'En attente de validation admin.');
    setAgency(prev => prev ? {...prev, status: 'pending'} : null);
  };

  if (loading) return <View style={{flex:1,justifyContent:'center',alignItems:'center'}}><ActivityIndicator /><Text>Chargement...</Text></View>;

  const status = agency?.status || 'none';
  const docs = agency?.documents || {};

  return (
    <ScrollView style={{flex:1,backgroundColor:COLORS.background,padding:20}}>
      <input type="file" accept="image/*" ref={fileInputRef} style={{display:'none'}} onChange={handleFile} />
      
      <Text style={{fontSize:22,fontWeight:'bold',color:COLORS.primary,marginBottom:8}}>🛡️ Vérification Agence</Text>
      <Text style={{color:COLORS.textSecondary,marginBottom:20}}>Statut: <Text style={{fontWeight:'bold',color:status==='pending'?COLORS.success:COLORS.text}}>{status}</Text></Text>

      {['licence','nina','insurance'].map(key => {
        const uploaded = !!docs[`${key}Url`];
        return (
          <TouchableOpacity key={key} onPress={()=>!uploaded&&startUpload(key)} disabled={uploaded||uploading}
            style={{backgroundColor:COLORS.card,padding:16,marginBottom:12,borderRadius:12,borderLeftWidth:4,borderLeftColor:uploaded?COLORS.success:COLORS.primary}}>
            <Text style={{fontWeight:'600'}}>{key==='licence'?'Licence':key==='nina'?'NINA':'Assurance'}</Text>
            {uploaded ? (
              <Text style={{color:COLORS.success,marginTop:4}}>✓ Enregistré</Text>
            ) : (
              <Text style={{color:COLORS.primary,marginTop:4}}>→ Cliquer pour uploader</Text>
            )}
          </TouchableOpacity>
        );
      })}

      <TouchableOpacity onPress={submit} disabled={uploading||status==='verified'}
        style={{backgroundColor:COLORS.primary,padding:14,borderRadius:10,alignItems:'center',marginTop:20}}>
        <Text style={{color:'#fff',fontWeight:'bold'}}>{status==='verified'?'✓ Vérifiée':'📤 Soumettre'}</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}