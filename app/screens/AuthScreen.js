import React, { useState } from 'react';
import { View, Text, TextInput, Pressable, Alert, ActivityIndicator, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { auth } from '../services/firebase';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth';

export default function AuthScreen() {
  const [isLogin, setIsLogin] = useState(true);
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleAuth = async () => {
    console.log('🔘 handleAuth appelé | isLogin:', isLogin, '| Email:', email);
    if (loading) return;
    if (!email.includes('@') || password.length < 6) {
      Alert.alert('⚠️ Requis', 'Email valide et mot de passe (min. 6 caractères) obligatoires.');
      return;
    }
    if (!isLogin && !fullName.trim()) {
      Alert.alert('⚠️ Requis', 'Veuillez entrer votre nom ou raison sociale.');
      return;
    }
    setLoading(true);
    try {
      if (isLogin) {
        await signInWithEmailAndPassword(auth, email, password);
        console.log('✅ Connexion réussie');
      } else {
        await createUserWithEmailAndPassword(auth, email, password);
        console.log('✅ Inscription réussie');
      }
    } catch (e) {
      console.error('❌ Auth error:', e);
      let msg = 'Erreur de connexion.';
      if (e.code === 'auth/invalid-email') msg = 'Format d\'email invalide.';
      if (e.code === 'auth/wrong-password' || e.code === 'auth/user-not-found') msg = 'Email ou mot de passe incorrect.';
      if (e.code === 'auth/email-already-in-use') msg = 'Cet email est déjà utilisé.';
      if (e.code === 'auth/weak-password') msg = 'Mot de passe trop court (min. 6 caractères).';
      if (e.code === 'auth/network-request-failed') msg = 'Problème de connexion internet.';
      if (e.code === 'auth/operation-not-allowed') msg = 'Email/Mot de passe non activé dans Firebase Console.';
      Alert.alert('❌ Échec', msg);
    } finally { setLoading(false); }
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{flex:1, backgroundColor:'#f7fafc'}}>
      <ScrollView contentContainerStyle={{flexGrow:1, justifyContent:'center', padding:24}}>
        <View style={{backgroundColor:'#fff', padding:24, borderRadius:16, elevation:4}}>
          <Text style={{fontSize:24, fontWeight:'bold', color:'#1a365d', textAlign:'center', marginBottom:8}}>🇹🇬 SikaKpɛ</Text>
          <Text style={{color:'#666', textAlign:'center', marginBottom:24}}>{isLogin ? 'Connectez-vous' : 'Créez votre compte'}</Text>
          {!isLogin && <TextInput placeholder="Nom complet ou Raison sociale" value={fullName} onChangeText={setFullName} style={{backgroundColor:'#f5f5f5', padding:14, borderRadius:10, marginBottom:12, fontSize:16}} />}
          <TextInput placeholder="Email" value={email} onChangeText={setEmail} keyboardType="email-address" style={{backgroundColor:'#f5f5f5', padding:14, borderRadius:10, marginBottom:12, fontSize:16}} autoCapitalize="none" />
          <TextInput placeholder="Mot de passe (min. 6)" value={password} onChangeText={setPassword} secureTextEntry style={{backgroundColor:'#f5f5f5', padding:14, borderRadius:10, marginBottom:20, fontSize:16}} autoCapitalize="none" />
          <Pressable onPress={handleAuth} disabled={loading} style={({pressed}) => ({ backgroundColor: loading ? '#999' : (pressed ? '#0f2440' : '#1a365d'), padding:16, borderRadius:12, alignItems:'center', opacity: loading ? 0.7 : 1 })}>
            {loading ? <ActivityIndicator color="#fff" /> : <Text style={{color:'#fff', fontWeight:'bold', fontSize:16}}>{isLogin ? '🔐 Se connecter' : '✅ Créer mon compte'}</Text>}
          </Pressable>
          <Pressable onPress={() => { console.log('🔄 Toggle mode'); setIsLogin(!isLogin); }} style={{marginTop:16, alignItems:'center', padding:10}}>
            <Text style={{color:'#3182ce', fontWeight:'600'}}>{isLogin ? 'Pas de compte ? S\'inscrire' : 'Déjà inscrit ? Se connecter'}</Text>
          </Pressable>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
