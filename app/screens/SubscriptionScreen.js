import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, Alert, ActivityIndicator, Linking, Platform } from 'react-native';
import { auth, db } from '../services/firebase';
import { doc, setDoc, getDoc, serverTimestamp, updateDoc } from 'firebase/firestore';
import { createPaymentLink, pollPaymentStatus } from '../services/maketou';

export default function SubscriptionScreen({ navigation }) {
  const [sub, setSub] = useState(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const uid = auth.currentUser?.uid;
        if (!uid) { setLoading(false); return; }
        const snap = await getDoc(doc(db, 'subscriptions', uid));
        if (snap.exists()) {
          const data = snap.data();
          const expiresAt = data.expiresAt?.toDate ? data.expiresAt.toDate() : null;
          setSub({ ...data, expiresAt, isActive: expiresAt ? expiresAt > new Date() : false });
        }
      } catch (e) { console.error('❌ Load sub error:', e); }
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
      lastPaymentMethod: 'maketou', maketouOrderId: orderId,
      updatedAt: serverTimestamp()
    }, { merge: true });
    
    setSub({ planType, amount, expiresAt, isActive: true, status: 'active', maketouOrderId: orderId });
  };

  const initiatePayment = async (planType, amount) => {
    setProcessing(true);
    try {
      const uid = auth.currentUser?.uid;
      const user = auth.currentUser;
      if (!uid || !user) throw new Error('Utilisateur non authentifié');

      // 🔹 1. Générer le lien de paiement MAKETOU
      const { payment_url, order_id } = await createPaymentLink({
        amount, currency: 'XOF',
        email: user.email,
        displayName: user.displayName || uid,
        planType,
        subscriptionId: uid
      });

      // 🔹 2. Ouvrir le paiement
      if (Platform.OS === 'web' && typeof window !== 'undefined') {
        const popup = window.open(payment_url, 'maketou_payment', 'width=500,height=700');
        
        // 🔹 3. Attendre que l'utilisateur revienne, puis poller le statut
        const checkReturn = setInterval(async () => {
          if (popup && popup.closed) {
            clearInterval(checkReturn);
            console.log('🔄 Popup fermée - démarrage du polling...');
            
            try {
              const status = await pollPaymentStatus(order_id);
              
              if (status === 'success') {
                await activateSubscription(uid, planType, amount, order_id);
                Alert.alert('✅ Paiement réussi', `Votre abonnement ${planType === 'company' ? 'Entreprise' : 'Particulier'} est activé !`);
                navigation?.navigate?.('Dashboard');
              } else if (status === 'failed') {
                Alert.alert('❌ Paiement échoué', 'Veuillez réessayer ou contacter le support.');
              } else if (status === 'timeout') {
                Alert.alert('⏳ Vérification en cours', 'Votre paiement est peut-être en cours. Revenez dans l\'onglet Abonnement pour vérifier.');
              } else {
                Alert.alert('ℹ️ Statut inconnu', 'Veuillez contacter le support si le problème persiste.');
              }
            } catch (e) {
              console.error('❌ Polling error:', e);
              Alert.alert('❌ Erreur', 'Impossible de vérifier le statut du paiement.');
            } finally {
              setProcessing(false);
            }
          }
        }, 1000);

      } else {
        // Mobile : ouvrir dans le navigateur externe
        await Linking.openURL(payment_url);
        Alert.alert('ℹ️ Paiement en cours', 'Une fois le paiement terminé, revenez dans l\'application pour vérifier le statut.');
        setProcessing(false);
      }

    } catch (e) {
      console.error('❌ Payment initiation error:', e);
      Alert.alert('❌ Échec', e.message || 'Impossible d\'initialiser le paiement.');
      setProcessing(false);
    }
  };

  const resetMVP = async () => {
    const uid = auth.currentUser?.uid;
    if (!uid) return;
    await setDoc(doc(db, 'subscriptions', uid), {}, { merge: true });
    setSub(null);
    Alert.alert('🔄 Réinitialisé', 'Profils disponibles affichés.');
  };

  const checkStatusManual = async () => {
    // Bouton manuel pour vérifier le statut si le polling a échoué
    const uid = auth.currentUser?.uid;
    if (!uid || !sub?.maketouOrderId) {
      Alert.alert('ℹ️ Info', 'Aucun paiement en cours à vérifier.');
      return;
    }
    setProcessing(true);
    try {
      const status = await pollPaymentStatus(sub.maketouOrderId);
      if (status === 'success') {
        await activateSubscription(uid, sub.planType, sub.amount, sub.maketouOrderId);
        Alert.alert('✅ Paiement confirmé', 'Votre abonnement est activé !');
        navigation?.navigate?.('Dashboard');
      } else {
        Alert.alert('ℹ️ Statut', `Statut actuel : ${status}`);
      }
    } catch (e) {
      Alert.alert('❌ Erreur', e.message);
    } finally {
      setProcessing(false);
    }
  };

  if (loading) return <View style={{flex:1,justifyContent:'center',alignItems:'center'}}><ActivityIndicator size="large" color="#1a365d" /></View>;

  const isCompanyActive = sub?.isActive && sub.planType === 'company';
  const isIndividualActive = sub?.isActive && sub.planType === 'individual';

  return (
    <View style={{flex:1,backgroundColor:'#f7fafc',padding:20,justifyContent:'center'}}>
      <Text style={{fontSize:22,fontWeight:'bold',color:'#1a365d',textAlign:'center',marginBottom:8}}>💳 Abonnement SikaKpɛ</Text>
      <Text style={{color:'#666',textAlign:'center',marginBottom:24,fontSize:14}}>Paiement sécurisé via MAKETOU</Text>

      {sub?.isActive ? (
        <View style={{backgroundColor:'#d1fae5', padding:16, borderRadius:12, alignItems:'center', marginBottom:16, borderLeftWidth:4, borderLeftColor:'#065f46'}}>
          <Text style={{fontWeight:'bold',fontSize:16,color:'#065f46'}}>🟢 Actif ({sub.planType === 'company' ? 'Entreprise/Admin' : 'Particulier'})</Text>
          <Text style={{marginTop:4,fontSize:13,color:'#4a5568'}}>Expire le : {sub.expiresAt?.toLocaleDateString('fr-FR')}</Text>
          <TouchableOpacity onPress={()=>navigation.navigate('Dashboard')} style={{marginTop:12,backgroundColor:'#1a365d',paddingVertical:10,paddingHorizontal:20,borderRadius:8}}>
            <Text style={{color:'#fff',fontWeight:'600'}}>Accéder au Tableau de bord</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <>
          <TouchableOpacity 
            onPress={()=>initiatePayment('company', 10000)} 
            disabled={processing || isIndividualActive}
            style={{backgroundColor:'#fff',padding:20,borderRadius:12,marginBottom:12,elevation:2,borderWidth:2,borderColor:isCompanyActive?'#059669':'#1a365d',opacity:isIndividualActive?0.7:1}}
          >
            <View style={{flexDirection:'row',justifyContent:'space-between',alignItems:'center'}}>
              <Text style={{fontSize:18,fontWeight:'bold'}}>🏢 Entreprise / Administration</Text>
              {isCompanyActive && <View style={{backgroundColor:'#d1fae5',paddingHorizontal:8,paddingVertical:4,borderRadius:6}}><Text style={{color:'#065f46',fontWeight:'bold',fontSize:12}}>ACTIF</Text></View>}
            </View>
            <Text style={{color:'#666',marginTop:4}}>Multi-sites, rapports avancés, export pro, support prioritaire</Text>
            <Text style={{fontSize:20,fontWeight:'bold',color:'#1a365d',marginTop:8}}>10 000 FCFA <Text style={{fontSize:12,color:'#666'}}>/ mois</Text></Text>
            <Text style={{fontSize:11,color:'#25D366',marginTop:6}}>💳 MAKETOU (Moov, Togocel, Carte)</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            onPress={()=>initiatePayment('individual', 5000)} 
            disabled={processing || isCompanyActive}
            style={{backgroundColor:'#fff',padding:20,borderRadius:12,elevation:2,borderWidth:2,borderColor:isIndividualActive?'#059669':'#3182ce',opacity:isCompanyActive?0.7:1}}
          >
            <View style={{flexDirection:'row',justifyContent:'space-between',alignItems:'center'}}>
              <Text style={{fontSize:18,fontWeight:'bold'}}>👤 Particulier</Text>
              {isIndividualActive && <View style={{backgroundColor:'#d1fae5',paddingHorizontal:8,paddingVertical:4,borderRadius:6}}><Text style={{color:'#065f46',fontWeight:'bold',fontSize:12}}>ACTIF</Text></View>}
            </View>
            <Text style={{color:'#666',marginTop:4}}>Suivi personnel, alertes basiques, export CSV</Text>
            <Text style={{fontSize:20,fontWeight:'bold',color:'#3182ce',marginTop:8}}>5 000 FCFA <Text style={{fontSize:12,color:'#666'}}>/ mois</Text></Text>
            <Text style={{fontSize:11,color:'#25D366',marginTop:6}}>💳 MAKETOU (Moov, Togocel, Carte)</Text>
          </TouchableOpacity>

          {/* 🔍 Bouton manuel pour vérifier un paiement en attente */}
          {sub?.maketouOrderId && !sub?.isActive && (
            <TouchableOpacity onPress={checkStatusManual} disabled={processing} style={{marginTop:12,backgroundColor:'#fff',padding:12,borderRadius:8,borderWidth:1,borderColor:'#3182ce',alignItems:'center'}}>
              <Text style={{color:'#3182ce',fontWeight:'600'}}>🔍 Vérifier le statut de mon paiement</Text>
            </TouchableOpacity>
          )}
        </>
      )}

      <TouchableOpacity onPress={resetMVP} style={{marginTop:16,alignItems:'center'}}><Text style={{color:'#666',fontSize:12}}>🔄 Réinitialiser pour tester (MVP)</Text></TouchableOpacity>
      <Text style={{fontSize:10,color:'#999',textAlign:'center',marginTop:20}}>MAKETOU • Paiement sécurisé • Support: support@sikakpe.tg</Text>
    </View>
  );
}
