import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { db, auth, ensureAuth } from '../services/firebase';
import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';

export default function SubscriptionScreen({ navigation }) {
  const [sub, setSub] = useState(null);
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
        setSub({ ...data, expiresAt, isActive: expiresAt ? expiresAt > new Date() : false });
      }
      setLoading(false);
    })();
  }, []);

  const activatePlan = async (planType, amount) => {
    if (sub?.isActive && sub.planType === planType) {
      Alert.alert('ℹ️ Déjà actif', `Vous êtes déjà abonné au profil ${planType==='company'?'Entreprise':'Particulier'}.`);
      return;
    }
    setProcessing(true);
    try {
      const uid = auth.currentUser?.uid;
      const expiresAt = new Date();
      expiresAt.setMonth(expiresAt.getMonth() + 1);
      await setDoc(doc(db, 'subscriptions', uid), {
        clientId: uid, amount, currency: 'XOF', period: 'monthly',
        planType, status: 'active', startedAt: serverTimestamp(), expiresAt,
        lastPaymentMethod: 'MVP_SIMULATION'
      }, { merge: true });
      setSub({ planType, amount, expiresAt, isActive: true, status: 'active' });
      Alert.alert('✅ Profil activé', `Votre accès est maintenant configuré pour le profil ${planType==='company'?'Entreprise/Admin':'Particulier'}.`);
      navigation?.navigate?.('Dashboard');
    } catch (e) { Alert.alert('❌ Échec', e.message); }
    finally { setProcessing(false); }
  };

  const resetMVP = async () => {
    await setDoc(doc(db, 'subscriptions', auth.currentUser?.uid), {}, { merge: true });
    setSub(null);
    Alert.alert('🔄 Réinitialisé', 'Profils disponibles affichés.');
  };

  if (loading) return <View style={{flex:1,justifyContent:'center',alignItems:'center'}}><ActivityIndicator size="large" color="#1a365d" /></View>;

  const isCompanyActive = sub?.isActive && sub.planType === 'company';
  const isIndividualActive = sub?.isActive && sub.planType === 'individual';

  return (
    <View style={{flex:1,backgroundColor:'#f7fafc',padding:20,justifyContent:'center'}}>
      <Text style={{fontSize:22,fontWeight:'bold',color:'#1a365d',textAlign:'center',marginBottom:8}}>💳 Choisissez votre abonnement</Text>
      <Text style={{color:'#666',textAlign:'center',marginBottom:24,fontSize:14}}>Votre profil détermine les fonctionnalités d'audit disponibles</Text>

      {/* 🏢 Carte Entreprise */}
      <TouchableOpacity 
        onPress={()=>activatePlan('company', 10000)} 
        disabled={processing}
        style={{backgroundColor:'#fff',padding:20,borderRadius:12,marginBottom:12,elevation:2,borderWidth:2,borderColor:isCompanyActive?'#059669':'#1a365d',opacity:isIndividualActive?0.7:1}}
      >
        <View style={{flexDirection:'row',justifyContent:'space-between',alignItems:'center'}}>
          <Text style={{fontSize:18,fontWeight:'bold',color:'#1a202c'}}>🏢 Entreprise / Administration</Text>
          {isCompanyActive && <View style={{backgroundColor:'#d1fae5',paddingHorizontal:8,paddingVertical:4,borderRadius:6}}><Text style={{color:'#065f46',fontWeight:'bold',fontSize:12}}>ACTIF</Text></View>}
        </View>
        <Text style={{color:'#666',marginTop:4}}>Suivi multi-sites, rapports avancés, export pro, support prioritaire</Text>
        <Text style={{fontSize:20,fontWeight:'bold',color:'#1a365d',marginTop:8}}>10 000 FCFA <Text style={{fontSize:12,color:'#666',fontWeight:'normal'}}>/ mois</Text></Text>
      </TouchableOpacity>

      {/* 👤 Carte Particulier */}
      <TouchableOpacity 
        onPress={()=>activatePlan('individual', 5000)} 
        disabled={processing}
        style={{backgroundColor:'#fff',padding:20,borderRadius:12,elevation:2,borderWidth:2,borderColor:isIndividualActive?'#059669':'#3182ce',opacity:isCompanyActive?0.7:1}}
      >
        <View style={{flexDirection:'row',justifyContent:'space-between',alignItems:'center'}}>
          <Text style={{fontSize:18,fontWeight:'bold',color:'#1a202c'}}>👤 Particulier</Text>
          {isIndividualActive && <View style={{backgroundColor:'#d1fae5',paddingHorizontal:8,paddingVertical:4,borderRadius:6}}><Text style={{color:'#065f46',fontWeight:'bold',fontSize:12}}>ACTIF</Text></View>}
        </View>
        <Text style={{color:'#666',marginTop:4}}>Suivi personnel, alertes basiques, export CSV simple</Text>
        <Text style={{fontSize:20,fontWeight:'bold',color:'#3182ce',marginTop:8}}>5 000 FCFA <Text style={{fontSize:12,color:'#666',fontWeight:'normal'}}>/ mois</Text></Text>
      </TouchableOpacity>

      {/* 🔧 Bouton Test MVP */}
      <TouchableOpacity onPress={resetMVP} style={{marginTop:16,alignItems:'center'}}>
        <Text style={{color:'#666',fontSize:12}}>🔄 Réinitialiser pour tester l'autre profil (MVP)</Text>
      </TouchableOpacity>

      <Text style={{fontSize:11,color:'#999',textAlign:'center',marginTop:20}}>
        🔒 Paiement simulé pour MVP. Intégration CinetPay / Orange Money Togo disponible sur demande.
      </Text>
    </View>
  );
}
