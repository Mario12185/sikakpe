import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert } from 'react-native';
import { auth } from '../services/firebase';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth';

export default function AuthScreen() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleAuth = async () => {
    try {
      if (isLogin) {
        await signInWithEmailAndPassword(auth, email, password);
      } else {
        await createUserWithEmailAndPassword(auth, email, password);
      }
    } catch (e) { Alert.alert('❌', e.message); }
  };

  return (
    <View style={{flex:1,justifyContent:'center',padding:20,backgroundColor:'#f7fafc'}}>
      <Text style={{fontSize:22,fontWeight:'bold',textAlign:'center',marginBottom:20}}>🇹🇬 SikaKpɛ</Text>
      <TextInput placeholder="Email" value={email} onChangeText={setEmail} style={{backgroundColor:'#fff',padding:14,borderRadius:10,marginBottom:12}} />
      <TextInput placeholder="Mot de passe" value={password} onChangeText={setPassword} secureTextEntry style={{backgroundColor:'#fff',padding:14,borderRadius:10,marginBottom:20}} />
      <TouchableOpacity onPress={handleAuth} style={{backgroundColor:'#1a365d',padding:14,borderRadius:10,alignItems:'center'}}><Text style={{color:'#fff',fontWeight:'bold'}}>{isLogin?'Se connecter':'Créer un compte'}</Text></TouchableOpacity>
      <TouchableOpacity onPress={()=>setIsLogin(!isLogin)} style={{marginTop:12,alignItems:'center'}}><Text style={{color:'#3182ce'}}>{isLogin?'Pas de compte ? S\'inscrire':'Déjà inscrit ? Se connecter'}</Text></TouchableOpacity>
    </View>
  );
}
