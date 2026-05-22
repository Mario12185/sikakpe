// 📦 app/screens/AdminScreen.js — VERSION MINIMALE
import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { db } from '../services/firebase';
import { collection, onSnapshot, doc, updateDoc } from 'firebase/firestore';

const COLORS = { primary: '#1a365d', success: '#00aa55', error: '#c53030', background: '#f7fafc', card: '#ffffff', text: '#1a202c' };

export default function AdminScreen() {
  const [agencies, setAgencies] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'agencies'), snap => {
      setAgencies(snap.docs.map(d => ({id:d.id,...d.data()})).sort((a,b)=>(a.status==='pending'?-1:1)));
      setLoading(false);
    });
    return unsub;
  }, []);

  const updateStatus = async (id, status) => {
    await updateDoc(doc(db, 'agencies', id), { status, reviewedAt: new Date() });
    Alert.alert('✅ Fait', `Statut: ${status}`);
  };

  if (loading) return <View style={{flex:1,justifyContent:'center'}}><ActivityIndicator /></View>;

  return (
    <View style={{flex:1,backgroundColor:COLORS.background,padding:20}}>
      <Text style={{fontSize:22,fontWeight:'bold',marginBottom:16}}>👮 Admin — Agences</Text>
      <FlatList data={agencies} keyExtractor={i=>i.id}
        renderItem={({item}) => (
          <View style={{backgroundColor:COLORS.card,padding:16,marginBottom:12,borderRadius:12}}>
            <Text style={{fontWeight:'bold'}}>{item.name||'Sans nom'}</Text>
            <Text style={{color:'#666'}}>Statut: {item.status}</Text>
            {item.status==='pending' && (
              <View style={{flexDirection:'row',marginTop:8}}>
                <TouchableOpacity onPress={()=>updateStatus(item.id,'verified')} style={{flex:1,backgroundColor:COLORS.success,padding:8,marginRight:4,borderRadius:6}}><Text style={{color:'#fff'}}>✅ Valider</Text></TouchableOpacity>
                <TouchableOpacity onPress={()=>updateStatus(item.id,'rejected')} style={{flex:1,backgroundColor:COLORS.error,padding:8,borderRadius:6}}><Text style={{color:'#fff'}}>❌ Refuser</Text></TouchableOpacity>
              </View>
            )}
          </View>
        )}
      />
    </View>
  );
}