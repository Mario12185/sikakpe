import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, Alert, ActivityIndicator, Platform } from 'react-native';
import { db, auth, ensureAuth } from '../services/firebase';
import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';

export default function SubscriptionScreen({ navigation }) {
  const [sub, setSub] = useState({ status: 'inactive', expiresAt: null });
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    (async () => {
      await ensureAuth();
      const uid = auth.currentUser?.uid;
      const snap = await getDoc(doc(db, 'subscriptions', uid));
      if (snap.exists()) {
        const data = snap.data();
        const expiresAt = data.expiresAt?.toDate ? data.expiresAt.toDate() : null;
        const isActive = expiresAt && expiresAt > new Date();
        setSub({ ...data, expiresAt, isActive });
      }
      setLoading(false);
    })();
  }, []);

  const activateSubscription = async () => {
    setProcessing(true);
    try {
      const uid = auth.currentUser?.uid;
      const expiresAt = new Date();
      expiresAt.setMonth(expiresAt.getMonth() + 1); // +30 jours

      await setDoc(doc(db, 'subscriptions', uid), {
        clientId: uid, amount: 10000, currency: 'XOF', period: 'monthly',
        status: 'active', startedAt: serverTimestamp(), expiresAt: expiresAt,
        lastPaymentMethod: 'MVP_SIMULATION'
      }, { merge: true });

      setSub({ status: 'active', expiresAt, isActive: true });
      Alert.alert('✅ Abonnement activé', `Valide jusqu'au ${expiresAt.toLocaleDateString('fr-FR')}`);
      
      // 🔔 Redirection vers Dashboard si navigation dispo
      navigation?.navigate?.('Dashboard');
    } catch (e) {
      Alert.alert('❌ Échec', e.message);
    } finally {
      setProcessing(false);
    }
  };

  if (loading) return <View style={{flex:1,justifyContent:'center',alignItems:'center'}}><ActivityIndicator size="large" color="#1a365d" /></View>;

  return (
    <View style={{flex:1,backgroundColor:'#f7fafc',padding:20,justifyContent:'center'}}>
      <View style={{backgroundColor:'#fff',padding:24,borderRadius:16,elevation:3}}>
        <Text style={{fontSize:22,fontWeight:'bold',color:'#1a365d',textAlign:'center',marginBottom:8}}>💳 Abonnement SikaKpɛ</Text>
        <Text style={{color:'#666',textAlign:'center',marginBottom:20,fontSize:14}}>Outil d'audit indépendant • 10 000 FCFA / mois</Text>
        
        <View style={{
          backgroundColor: sub.isActive ? '#d1fae5' : '#fee2e2', 
          padding: 16, borderRadius: 12, marginBottom: 24, alignItems: 'center',
          borderLeftWidth: 4, borderLeftColor: sub.isActive ? '#065f46' : '#991b1b'
        }}>
          <Text style={{fontWeight:'bold',fontSize:16,color: sub.isActive ? '#065f46' : '#991b1b'}}>
            {sub.isActive ? '🟢 Actif' : '🔴 Expiré / Inactif'}
          </Text>
          {sub.expiresAt && <Text style={{marginTop:4,fontSize:13,color:'#4a5568'}}>Expire le : {sub.expiresAt.toLocaleDateString('fr-FR')}</Text>}
        </View>

        <TouchableOpacity 
          onPress={activateSubscription} 
          disabled={processing || sub.isActive}
          style={{
            backgroundColor: sub.isActive ? '#666' : '#1a365d', 
            padding: 16, borderRadius: 12, alignItems: 'center',
            opacity: processing ? 0.7 : 1
          }}
        >
          {processing ? <ActivityIndicator color="#fff" /> : (
            <Text style={{color:'#fff',fontWeight:'bold',fontSize:16}}>
              {sub.isActive ? '✅ Déjà activé' : 'Payer 10 000 FCFA'}
            </Text>
          )}
        </TouchableOpacity>

        <Text style={{fontSize:11,color:'#999',textAlign:'center',marginTop:16}}>
          🔒 Paiement simulé pour MVP. Intégration CinetPay / Orange Money Togo disponible sur demande.
        </Text>
      </View>
    </View>
  );
}
