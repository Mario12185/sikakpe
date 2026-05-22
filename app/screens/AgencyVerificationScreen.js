import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, Alert, ScrollView, ActivityIndicator, Platform } from 'react-native';
import { db, auth, ensureAuth } from '../services/firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';

export default function AgencyVerificationScreen() {
  const [loading, setLoading] = useState(true);
  const [agency, setAgency] = useState(null);
  const fileRef = useRef(null);
  const [docKey, setDocKey] = useState(null);

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

  const onFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file || !docKey) return;
    try {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const uid = auth.currentUser?.uid;
        await setDoc(doc(db, 'agencies', uid), {
          documents: { [`${docKey}Url`]: reader.result },
          status: 'pending',
          updatedAt: new Date()
        }, { merge: true });
        const snap = await getDoc(doc(db, 'agencies', uid));
        if (snap.exists()) setAgency(snap.data());
        Alert.alert('✅ OK');
      };
      reader.readAsDataURL(file);
    } catch (err) { Alert.alert('❌', err.message); }
  };

  if (loading) return <View style={{flex:1,justifyContent:'center'}}><ActivityIndicator /><Text>...</Text></View>;

  const docs = agency?.documents || {};
  return (
    <ScrollView style={{flex:1,padding:20}}>
      <input type="file" ref={fileRef} style={{display:'none'}} onChange={onFile} />
      <Text style={{fontSize:20,fontWeight:'bold'}}>🛡️ Agence</Text>
      {['licence','nina','insurance'].map(k => (
        <TouchableOpacity key={k} onPress={()=>{setDocKey(k);fileRef.current?.click();}} disabled={!!docs[`${k}Url`]}
          style={{padding:12,marginVertical:6,borderRadius:8,backgroundColor:docs[`${k}Url`]?'#d1fae5':'#e2e8f0'}}>
          <Text>{k}: {docs[`${k}Url`]?'✓':'→ Cliquer'}</Text>
        </TouchableOpacity>
      ))}
      <TouchableOpacity onPress={async()=>{
        const uid=auth.currentUser?.uid;
        await setDoc(doc(db,'agencies',uid),{status:'pending'},{merge:true});
        Alert.alert('✅ Soumis');
      }} style={{padding:12,marginTop:20,backgroundColor:'#1a365d',borderRadius:8}}>
        <Text style={{color:'#fff',fontWeight:'bold'}}>📤 Soumettre</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}
