import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, Alert, ActivityIndicator, ScrollView } from 'react-native';
import { auth, db } from '../services/firebase';
import { signOut } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';

export default function SettingsScreen() {
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState(null);
  const [sub, setSub] = useState(null);
  const [loggingOut, setLoggingOut] = useState(false);

  useEffect(() => {
    console.log('⚙️ SettingsScreen mounted');
    const load = async () => {
      try {
        const uid = auth.currentUser?.uid;
        console.log('👤 Loading profile for UID:', uid);
        if (!uid) { setLoading(false); return; }
        const userSnap = await getDoc(doc(db, 'users', uid));
        if (userSnap.exists()) {
          console.log('✅ Profile loaded:', userSnap.data().displayName);
          setProfile(userSnap.data());
        }
        const subSnap = await getDoc(doc(db, 'subscriptions', uid));
        if (subSnap.exists()) {
          const data = subSnap.data();
          setSub({ ...data, expiresAt: data.expiresAt?.toDate ? data.expiresAt.toDate() : null });
        }
      } catch (e) { console.error('❌ Load profile error:', e); }
      finally { setLoading(false); }
    };
    load();
  }, []);

  const handleLogout = async () => {
    console.log('🚪 handleLogout called');
    try {
      setLoggingOut(true);
      console.log('🔄 Calling signOut...');
      await signOut(auth);
      console.log('✅ signOut succeeded - App.js should now show AuthScreen');
      // ✅ onAuthStateChanged dans App.js détecte user=null et affiche AuthScreen automatiquement
    } catch (e) {
      console.error('❌ SignOut error:', e);
      Alert.alert('❌ Échec', 'Impossible de se déconnecter. Vérifiez votre connexion.');
      setLoggingOut(false);
    }
  };

  const confirmLogout = () => {
    console.log('🔘 confirmLogout called');
    Alert.alert(
      '🚪 Déconnexion',
      'Voulez-vous vraiment quitter votre session ?',
      [
        { text: 'Annuler', style: 'cancel', onPress: () => console.log('❌ Logout cancelled') },
        { 
          text: 'Oui, déconnecter', 
          style: 'destructive', 
          onPress: () => { console.log('✅ Logout confirmed'); handleLogout(); } 
        }
      ]
    );
  };

  if (loading) return <View style={{flex:1,justifyContent:'center',alignItems:'center'}}><ActivityIndicator /><Text>Chargement...</Text></View>;

  return (
    <ScrollView style={{flex:1, backgroundColor:'#f7fafc', padding:20}}>
      <Text style={{fontSize:22, fontWeight:'bold', color:'#1a365d', marginBottom:20}}>⚙️ Mon Profil & Paramètres</Text>

      <View style={{backgroundColor:'#fff', padding:16, borderRadius:12, marginBottom:16, elevation:2}}>
        <Text style={{fontSize:14, color:'#666', marginBottom:4}}>👤 Nom / Entreprise</Text>
        <Text style={{fontSize:16, fontWeight:'600'}}>{profile?.displayName || 'Non défini'}</Text>
      </View>

      <View style={{backgroundColor:'#fff', padding:16, borderRadius:12, marginBottom:16, elevation:2}}>
        <Text style={{fontSize:14, color:'#666', marginBottom:4}}>📧 Email de connexion</Text>
        <Text style={{fontSize:16, fontWeight:'600'}}>{profile?.email || auth.currentUser?.email || '-'}</Text>
      </View>

      <View style={{backgroundColor:'#fff', padding:16, borderRadius:12, marginBottom:16, elevation:2}}>
        <Text style={{fontSize:14, color:'#666', marginBottom:4}}>💳 Abonnement actif</Text>
        {sub ? (
          <>
            <Text style={{fontSize:16, fontWeight:'600'}}>{sub.planType==='company'?'🏢 Entreprise (10 000 F)':'👤 Particulier (5 000 F)'}</Text>
            <Text style={{color:'#065f46', marginTop:4}}>✅ Valide jusqu'au {sub.expiresAt?.toLocaleDateString('fr-FR')}</Text>
          </>
        ) : (
          <Text style={{fontSize:16, color:'#991b1b', fontWeight:'600'}}>⚠️ Aucun abonnement actif</Text>
        )}
      </View>

      <TouchableOpacity
        onPress={confirmLogout}
        disabled={loggingOut}
        style={{backgroundColor: loggingOut ? '#999' : '#c53030', padding:16, borderRadius:12, alignItems:'center', marginTop:20}}
      >
        {loggingOut ? <ActivityIndicator color="#fff" /> : <Text style={{color:'#fff', fontWeight:'bold', fontSize:16}}>🚪 Se déconnecter</Text>}
      </TouchableOpacity>

      <Text style={{textAlign:'center', color:'#999', marginTop:30, fontSize:11}}>SikaKpɛ v1.0 • Audit de sécurité indépendant 🇹🇬</Text>
    </ScrollView>
  );
}
