import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { db, auth, ensureAuth } from '../services/firebase';
import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';

export default function SubscriptionScreen({ navigation }) {
  const [sub, setSub] = useState({ status: 'inactive', expiresAt: null, planType: null, amount: 0 });
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

  const activateSubscription = async (planType, amount) => {
    setProcessing(true);
    try {
      const uid = auth.currentUser?.uid;
      const expiresAt = new Date();
      expiresAt.setMonth(expiresAt.getMonth() + 1); // +30 jours

      await setDoc(doc(db, 'subscriptions', uid), {
        clientId: uid, amount, currency: 'XOF', period: 'monthly',
        planType, status: 'active', startedAt: serverTimestamp(), expiresAt,
        lastPaymentMethod: 'MVP_SIMULATION'
      }, { merge: true });

      setSub({ status: 'active', expiresAt, isActive: true, planType, amount });
      const label = planType === 'company' ? 'Entreprise / Administration' : 'Particulier';
      Alert.alert('✅ Abonnement activé', `Profil : ${label}\nMontant : ${amount.toLocaleString('fr-FR')} FCFA\nValide jusqu'au ${expiresAt.toLocaleDateString('fr-FR')}`);
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
      <Text style={{fontSize:22,fontWeight:'bold',color:'#1a365d',textAlign:'center',marginBottom:8}}>💳 Choisissez votre abonnement</Text>
      <Text style={{color:'#666',textAlign:'center',marginBottom:24,fontSize:14}}>Sélectionnez votre profil pour activer l'audit SikaKpɛ</Text>

      {sub.isActive ? (
        <View style={{backgroundColor:'#d1fae5', padding:16, borderRadius:12, alignItems:'center', marginBottom:16, borderLeftWidth:4, borderLeftColor:'#065f46'}}>
          <Text style={{fontWeight:'bold',fontSize:16,color:'#065f46'}}>
            🟢 Actif ({sub.planType === 'company' ? 'Entreprise/Admin' : 'Particulier'})
          </Text>
          <Text style={{marginTop:4,fontSize:13,color:'#4a5568'}}>Expire le : {sub.expiresAt?.toLocaleDateString('fr-FR')}</Text>
          <TouchableOpacity onPress={()=>navigation.navigate('Dashboard')} style={{marginTop:12,backgroundColor:'#1a365d',paddingVertical:10,paddingHorizontal:20,borderRadius:8}}>
            <Text style={{color:'#fff',fontWeight:'600'}}>Accéder au Tableau de bord</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <>
          <TouchableOpacity 
            onPress={()=>activateSubscription('company', 10000)} 
            disabled={processing}
            style={{backgroundColor:'#fff',padding:20,borderRadius:12,marginBottom:12,elevation:2,borderLeftWidth:4,borderLeftColor:'#1a365d'}}
          >
            <Text style={{fontSize:18,fontWeight:'bold',color:'#1a202c'}}>🏢 Entreprise / Administration</Text>
            <Text style={{color:'#666',marginTop:4}}>Suivi multi-sites, rapports avancés, support prioritaire</Text>
            <Text style={{fontSize:20,fontWeight:'bold',color:'#1a365d',marginTop:8}}>10 000 FCFA <Text style={{fontSize:12,color:'#666',fontWeight:'normal'}}>/ mois</Text></Text>
          </TouchableOpacity>

          <TouchableOpacity 
            onPress={()=>activateSubscription('individual', 5000)} 
            disabled={processing}
            style={{backgroundColor:'#fff',padding:20,borderRadius:12,elevation:2,borderLeftWidth:4,borderLeftColor:'#3182ce'}}
          >
            <Text style={{fontSize:18,fontWeight:'bold',color:'#1a202c'}}>👤 Particulier</Text>
            <Text style={{color:'#666',marginTop:4}}>Suivi personnel, alertes basiques, export simple</Text>
            <Text style={{fontSize:20,fontWeight:'bold',color:'#3182ce',marginTop:8}}>5 000 FCFA <Text style={{fontSize:12,color:'#666',fontWeight:'normal'}}>/ mois</Text></Text>
          </TouchableOpacity>
        </>
      )}

      <Text style={{fontSize:11,color:'#999',textAlign:'center',marginTop:24}}>
        🔒 Paiement simulé pour MVP. Intégration CinetPay / Orange Money Togo disponible sur demande.
      </Text>
    </View>
  );
}
