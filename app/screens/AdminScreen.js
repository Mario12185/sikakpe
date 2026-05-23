import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, Alert } from 'react-native';
import { db } from '../services/firebase';
import { collection, onSnapshot, doc, updateDoc } from 'firebase/firestore';

export default function AdminScreen() {
  const [list, setList] = useState([]);
  
  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'agencies'), (snap) => {
      setList(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });
    return () => unsub();
  }, []);

  const updateStatus = async (id, status) => {
    try {
      await updateDoc(doc(db, 'agencies', id), { status, reviewedAt: new Date() });
      Alert.alert('✅ Fait', `Statut: ${status}`);
    } catch (e) {
      Alert.alert('❌ Erreur', e.message);
    }
  };

  return (
    <View style={{ flex: 1, padding: 20, backgroundColor: '#f7fafc' }}>
      <Text style={{ fontSize: 20, fontWeight: 'bold', marginBottom: 16 }}>👮 Admin — Agences</Text>
      <FlatList 
        data={list} 
        keyExtractor={item => item.id}
        renderItem={({ item }) => (
          <View style={{ backgroundColor: '#fff', padding: 16, marginBottom: 12, borderRadius: 12, elevation: 2 }}>
            <Text style={{ fontWeight: 'bold', fontSize: 16 }}>{item.name || 'Sans nom'}</Text>
            <Text style={{ color: '#666', marginTop: 4 }}>📞 {item.contact || '-'}</Text>
            <Text style={{ color: '#666' }}>🆔 Statut: <Text style={{ fontWeight: 'bold', color: item.status === 'pending' ? '#dd6b20' : item.status === 'verified' ? '#00aa55' : '#c53030' }}>{item.status}</Text></Text>
            
            {item.status === 'pending' && (
              <View style={{ flexDirection: 'row', marginTop: 12 }}>
                <TouchableOpacity onPress={() => updateStatus(item.id, 'verified')} style={{ flex: 1, backgroundColor: '#00aa55', padding: 10, marginRight: 8, borderRadius: 8, alignItems: 'center' }}>
                  <Text style={{ color: '#fff', fontWeight: '600' }}>✅ Valider</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => updateStatus(item.id, 'rejected')} style={{ flex: 1, backgroundColor: '#c53030', padding: 10, borderRadius: 8, alignItems: 'center' }}>
                  <Text style={{ color: '#fff', fontWeight: '600' }}>❌ Refuser</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        )}
        ListEmptyComponent={<Text style={{ textAlign: 'center', color: '#666', marginTop: 40 }}>Aucune agence en attente.</Text>}
      />
    </View>
  );
}
