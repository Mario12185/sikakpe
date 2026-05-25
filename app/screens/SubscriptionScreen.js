import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, Alert, ActivityIndicator, Linking, Platform } from 'react-native';
import { auth, db } from '../services/firebase';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { createPaymentLink, pollPaymentStatus, MAKETOU_CONFIG } from '../services/maketou';

export default function SubscriptionScreen({ navigation }) {
  const [sub, setSub] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const uid = auth.currentUser?.uid;
        if (!uid) { setLoading(false); return; }
        
        // 🔍 Charger le profil utilisateur (pour avoir le VRAI displayName)
        const userSnap = await getDoc(doc(db, 'users', uid));
        if (userSnap.exists()) {
          setUserProfile(userSnap.data());
        }
        
        // Charger l'abonnement
        const subSnap = await getDoc(doc(db, 'subscriptions', uid));
        if (subSnap.exists()) {
          const data = subSnap.data();
          const expiresAt = data.expiresAt?.toDate ? data.expiresAt.toDate() : null;
          setSub({ ...data, expiresAt, isActive: expiresAt ? expiresAt > new Date() : false });
        }
      } catch (e) { console.error('❌ Load error:', e); }
      finally { setLoading(false); }
    };
    load();
  }, []);

  const activateSubscription = async (uid, planType, amount, orderId) => {
    const expiresAt = new Date();
    expiresAt.setMonth(expiresAt.getMonth() + 1);
    await setDoc(doc(db, 'subscriptions', uid), {
      clientId: uid, amount, currency: 'XOF', period: 'monthly',
      planType, status: 'active', startedAt: serverTimestamp(), expiresAt,
      lastPaymentMethod: 'maketou', maketouOrderId: orderId, updatedAt: serverTimestamp()
    }, { merge: true });
    setSub({ planType, amount, expiresAt, isActive: true, status: 'active', maketouOrderId: orderId });
// 🔄 Force App.js à re-vérifier le statut
setTimeout(() => { window.location.reload(); }, 800);
  };

  const initiatePayment = async (planType, amount) => {
    setProcessing(true);
    try {
      const uid = auth.currentUser?.uid;
      const user = auth.currentUser;
      if (!uid || !user) throw new Error('Utilisateur non authentifié');

      // ✅ Utiliser le VRAI displayName depuis Firestore (fallback email)
      const displayName = userProfile?.displayName || user.email?.split('@')[0] || 'Client SikaKpe';
      const email = user.email;

      console.log('💳 Payment init | displayName:', displayName, '| email:', email);

      const { payment_url, order_id, isSimulation } = await createPaymentLink({
        amount, currency: 'XOF',
        email,
        displayName,  // ✅ VRAI nom depuis Firestore
        planType,
        subscriptionId: uid
      });

      if (Platform.OS === 'web' && typeof window !== 'undefined') {
        if (isSimulation) {
          window.location.href = payment_url;
        } else {
          const popup = window.open(payment_url, 'maketou_payment', 'width=500,height=700');
          const checkReturn = setInterval(async () => {
            if (popup && popup.closed) {
              clearInterval(checkReturn);
              try {
                const status = await pollPaymentStatus(order_id);
                handlePaymentResult(status, uid, planType, amount, order_id);
              } catch (e) { console.error('❌ Polling error:', e); Alert.alert('❌ Erreur', 'Impossible de vérifier le statut.'); }
              finally { setProcessing(false); }
            }
          }, 1000);
        }
      } else {
        await Linking.openURL(payment_url);
        Alert.alert('ℹ️ Paiement en cours', 'Revenez dans l\'app pour vérifier le statut.');
        setProcessing(false);
      }
    } catch (e) {
      console.error('❌ Payment error:', e);
      Alert.alert('❌ Échec', e.message || 'Erreur de paiement.');
      setProcessing(false);
    }
  };

  const handlePaymentResult = async (status, uid, planType, amount, orderId) => {
    if (status === 'success') {
      await activateSubscription(uid, planType, amount, orderId);
      Alert.alert('✅ Paiement réussi', `Abonnement ${planType === 'company' ? 'Entreprise' : 'Particulier'} activé !`);
      navigation?.navigate?.('Dashboard');
    } else if (status === 'failed') {
      Alert.alert('❌ Échec', 'Paiement refusé. Vérifiez votre solde ou réessayez.');
    } else {
      Alert.alert('ℹ️ En attente', `Statut: ${status}. Revenez plus tard.`);
    }
  };

  const resetMVP = async () => {
    const uid = auth.currentUser?.uid;
    if (!uid) return;
    await setDoc(doc(db, 'subscriptions', uid), {}, { merge: true });
    setSub(null);
    Alert.alert('🔄 Réinitialisé', 'Profils disponibles.');
  };

  if (loading) return <View style={{flex:1,justifyContent:'center',alignItems:'center'}}><ActivityIndicator size="large" color="#1a365d" /></View>;

  const isCompanyActive = sub?.isActive && sub.planType === 'company';
  const isIndividualActive = sub?.isActive && sub.planType === 'individual';

  return (
    <View style={{flex:1,backgroundColor:'#f7fafc',padding:20,justifyContent:'center'}}>
      <Text style={{fontSize:22,fontWeight:'bold',color:'#1a365d',textAlign:'center',marginBottom:8}}>💳 Abonnement SikaKpɛ</Text>
      <Text style={{color:'#666',textAlign:'center',marginBottom:16,fontSize:14}}>Paiement via MAKETOU</Text>

      {sub?.isActive ? (
        <View style={{backgroundColor:'#d1fae5', padding:16, borderRadius:12, alignItems:'center', marginBottom:16, borderLeftWidth:4, borderLeftColor:'#065f46'}}>
          <Text style={{fontWeight:'bold',fontSize:16,color:'#065f46'}}>🟢 Actif ({sub.planType === 'company' ? 'Entreprise' : 'Particulier'})</Text>
          <Text style={{marginTop:4,fontSize:13,color:'#4a5568'}}>Expire le : {sub.expiresAt?.toLocaleDateString('fr-FR')}</Text>
          <TouchableOpacity onPress={()=>navigation.navigate('Dashboard')} style={{marginTop:12,backgroundColor:'#1a365d',paddingVertical:10,paddingHorizontal:20,borderRadius:8}}>
            <Text style={{color:'#fff',fontWeight:'600'}}>Accéder au Dashboard</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <>
          <TouchableOpacity onPress={()=>initiatePayment('company', 10000)} disabled={processing||isIndividualActive}
            style={{backgroundColor:'#fff',padding:20,borderRadius:12,marginBottom:12,elevation:2,borderWidth:2,borderColor:'#1a365d',opacity:isIndividualActive?0.7:1}}>
            <Text style={{fontSize:18,fontWeight:'bold'}}>🏢 Entreprise / Administration</Text>
            <Text style={{fontSize:20,fontWeight:'bold',color:'#1a365d',marginTop:8}}>10 000 FCFA <Text style={{fontSize:12,color:'#666'}}>/ mois</Text></Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={()=>initiatePayment('individual', 5000)} disabled={processing||isCompanyActive}
            style={{backgroundColor:'#fff',padding:20,borderRadius:12,elevation:2,borderWidth:2,borderColor:'#3182ce',opacity:isCompanyActive?0.7:1}}>
            <Text style={{fontSize:18,fontWeight:'bold'}}>👤 Particulier</Text>
            <Text style={{fontSize:20,fontWeight:'bold',color:'#3182ce',marginTop:8}}>5 000 FCFA <Text style={{fontSize:12,color:'#666'}}>/ mois</Text></Text>
          </TouchableOpacity>
        </>
      )}

      <TouchableOpacity onPress={resetMVP} style={{marginTop:16,alignItems:'center'}}><Text style={{color:'#666',fontSize:12}}>🔄 Réinitialiser (MVP)</Text></TouchableOpacity>
      <Text style={{fontSize:10,color:'#999',textAlign:'center',marginTop:20}}>MAKETOU • Paiement sécurisé</Text>
    </View>
  );
}

