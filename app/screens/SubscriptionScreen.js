import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { db, auth, ensureAuth } from '../services/firebase';
import { doc, setDoc, getDoc } from 'firebase/firestore';

export default function SubscriptionScreen() {
  const [sub, setSub] = useState({ status: 'inactive', expiresAt: null });
  const [loading, setLoading] = useState(false);

  const loadSub = async () => {
    await ensureAuth();
    const uid = auth.currentUser?.uid;
    const snap = await getDoc(doc(db, 'subscriptions', uid));
    if (snap.exists()) setSub(snap.data());
  };
  React.useEffect(() => { loadSub(); }, []);

  const subscribe = async () => {
    setLoading(true);
    try {
      const uid = auth.currentUser?.uid;
      const expiresAt = new Date();
      expiresAt.setMonth(expiresAt.getMonth() + 1);
      await setDoc(doc(db, 'subscriptions', uid), {
        clientId: uid, amount: 10000, currency: 'XOF', period: 'monthly',
        status: 'active', startedAt: new Date(), expiresAt: expiresAt
      });
      setSub({ status: 'active', expiresAt });
      Alert.alert('✅ Abonnement activé', 'Votre accès SikaKpɛ est valable 30 jours.');
    } catch (e) { Alert.alert('❌ Échec', e.message); }
    finally { setLoading(false); }
  };

  const isExpired = sub.expiresAt ? new Date(sub.expiresAt.seconds * 1000) < new Date() : true;

  return (
    <View style={{flex:1,backgroundColor:'#f7fafc',padding:20,justifyContent:'center'}}>
      <View style={{backgroundColor:'#fff',padding:24,borderRadius:16,shadowColor:'#000',shadowOpacity:0.1,elevation:4}}>
        <Text style={{fontSize:24,fontWeight:'bold',color:'#1a365d',textAlign:'center'}}>💳 Abonnement SikaKpɛ</Text>
        <Text style={{color:'#666',textAlign:'center',marginTop:8,marginBottom:20}}>Outil d'audit indépendant pour le suivi de vos agences.</Text>
        <View style={{backgroundColor: isExpired ? '#fee2e2' : '#d1fae5', padding: 16, borderRadius: 12, marginBottom: 20, alignItems: 'center'}}>
          <Text style={{fontWeight:'bold',color: isExpired ? '#991b1b' : '#065f46',fontSize:18}}>
            {isExpired ? '🔴 Inactif' : '🟢 Actif jusqu\'au ' + (sub.expiresAt?.toDate ? sub.expiresAt.toDate().toLocaleDateString('fr-FR') : '-')}
          </Text>
        </View>
        <TouchableOpacity onPress={subscribe} disabled={loading || !isExpired} style={{backgroundColor: !isExpired ? '#666' : '#1a365d', padding: 16, borderRadius: 12, alignItems: 'center', opacity: loading ? 0.7 : 1}}>
          {loading ? <ActivityIndicator color="#fff" /> : <Text style={{color:'#fff',fontWeight:'bold',fontSize:16}}>Payer 10 000 FCFA / mois</Text>}
        </TouchableOpacity>
        <Text style={{fontSize:11,color:'#999',textAlign:'center',marginTop:16}}>Paiement simulé pour MVP. Intégration CinetPay/PayPal à venir.</Text>
      </View>
    </View>
  );
}
