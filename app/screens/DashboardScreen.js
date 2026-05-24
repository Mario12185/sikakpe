import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { db, auth } from '../services/firebase';
import { collection, query, where, onSnapshot, doc, getDoc } from 'firebase/firestore';

export default function DashboardScreen({ navigation }) {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ sites: 0, checkinsToday: 0, totalCheckins: 0, compliance: 100 });
  const [recentActivity, setRecentActivity] = useState([]);
  const [subInfo, setSubInfo] = useState(null);

  useEffect(() => {
    const uid = auth.currentUser?.uid;
    if (!uid) { setLoading(false); return; } // ✅ Évite le blocage si auth non prêt

    const todayStart = new Date(); todayStart.setHours(0,0,0,0);
    const todayTimestamp = todayStart.getTime() / 1000;

    (async () => {
      try {
        const subSnap = await getDoc(doc(db, 'subscriptions', uid));
        if (subSnap.exists()) {
          const data = subSnap.data();
          setSubInfo({ ...data, expiresAt: data.expiresAt?.toDate ? data.expiresAt.toDate() : null, isActive: data.expiresAt?.toDate() > new Date() });
        }
      } catch(e) { console.warn('Sub load failed:', e); }
    })();

    const unsubSites = onSnapshot(query(collection(db, 'sites'), where('clientId', '==', uid)), 
      (snap) => { setStats(prev => ({...prev, sites: snap.size})); },
      () => setLoading(false) // ✅ Fallback en cas d'erreur
    );

    const unsubCheckins = onSnapshot(query(collection(db, 'checkins'), where('clientId', '==', uid)),
      (snap) => {
        let today = 0, valid = 0, recent = [];
        snap.docs.forEach(d => {
          const data = d.data();
          if (data.timestamp?.seconds >= todayTimestamp) today++;
          if (data.status === 'valid') valid++;
          if (recent.length < 5) recent.push({id: d.id, ...data});
        });
        setStats(prev => ({...prev, checkinsToday: today, totalCheckins: snap.size, compliance: snap.size > 0 ? Math.round((valid/snap.size)*100) : 100}));
        setRecentActivity(recent);
        setLoading(false);
      },
      () => setLoading(false) // ✅ Fallback en cas d'erreur
    );

    return () => { unsubSites(); unsubCheckins(); };
  }, []);

  if (loading) return <View style={{flex:1,justifyContent:'center',alignItems:'center'}}><ActivityIndicator size="large" color="#1a365d" /><Text style={{marginTop:10}}>Chargement...</Text></View>;

  return (
    <ScrollView style={{flex:1, backgroundColor:'#f7fafc', padding:20}}>
      <View style={{flexDirection:'row', justifyContent:'space-between', alignItems:'flex-start', marginBottom:24}}>
        <View>
          <Text style={{fontSize:24, fontWeight:'700', color:'#1a365d'}}>📊 Tableau de bord</Text>
          <Text style={{fontSize:14, color:'#666'}}>Vue d'ensemble de votre audit</Text>
        </View>
        {subInfo && (
          <View style={{backgroundColor: subInfo.planType==='company' ? '#fef3c7' : '#dbeafe', padding:10, borderRadius:10, borderLeftWidth:4, borderLeftColor: subInfo.planType==='company' ? '#d97706' : '#3b82f6'}}>
            <Text style={{fontSize:13, fontWeight:'bold', color:'#1f2937'}}>{subInfo.planType==='company' ? '🏢 Entreprise' : '👤 Particulier'}</Text>
            <Text style={{fontSize:11, color:'#4b5563'}}>{subInfo.isActive ? '✅ Actif' : '⚠️ Expiré'}</Text>
          </View>
        )}
      </View>

      <View style={{flexDirection:'row', flexWrap:'wrap', justifyContent:'space-between', marginBottom:24}}>
        {[
          { label: '📍 Sites actifs', value: stats.sites, color: '#1a365d' },
          { label: '✅ Présences aujourd\'hui', value: stats.checkinsToday, color: '#00aa55' },
          { label: '📈 Taux de conformité', value: `${stats.compliance}%`, color: '#3182ce' },
          { label: '📋 Total ce mois', value: stats.totalCheckins, color: '#dd6b20' }
        ].map((kpi, i) => (
          <View key={i} style={{width:'48%', backgroundColor:'#fff', padding:16, borderRadius:12, marginBottom:12, borderLeftWidth:4, borderLeftColor:kpi.color}}>
            <Text style={{fontSize:12, color:'#666'}}>{kpi.label}</Text>
            <Text style={{fontSize:28, fontWeight:'bold', color:kpi.color}}>{kpi.value}</Text>
          </View>
        ))}
      </View>

      <Text style={{fontSize:18, fontWeight:'600', color:'#1a202c', marginBottom:12}}>🕒 Activité récente</Text>
      {recentActivity.length === 0 ? <Text style={{color:'#666', textAlign:'center', padding:20}}>Aucun check-in enregistré.</Text> : (
        recentActivity.map(item => {
          const d = item.timestamp?.toDate ? item.timestamp.toDate() : new Date();
          return (
            <View key={item.id} style={{backgroundColor:'#fff', padding:14, borderRadius:10, marginBottom:10, flexDirection:'row', justifyContent:'space-between', alignItems:'center'}}>
              <View>
                <Text style={{fontWeight:'600'}}>{item.siteName || 'Site'}</Text>
                <Text style={{fontSize:12, color:'#666'}}>🏢 {item.agency} • {d.toLocaleTimeString('fr-FR')}</Text>
              </View>
              <Text style={{color: item.status==='valid' ? '#00aa55' : '#dd6b20', fontWeight:'600'}}>{item.status==='valid' ? '✅ Présence OK' : '⚠️ Hors zone'}</Text>
            </View>
          )
        })
      )}

      <View style={{marginTop:20, flexDirection:'row', justifyContent:'space-between'}}>
        <TouchableOpacity style={{flex:1, backgroundColor:'#1a365d', padding:14, borderRadius:10, marginRight:8, alignItems:'center'}} onPress={()=>navigation.navigate('CheckIn')}><Text style={{color:'#fff', fontWeight:'600'}}>🛡️ Nouveau Check-in</Text></TouchableOpacity>
        <TouchableOpacity style={{flex:1, backgroundColor:'#fff', borderWidth:1, borderColor:'#1a365d', padding:14, borderRadius:10, marginLeft:8, alignItems:'center'}} onPress={()=>navigation.navigate('Rapports')}><Text style={{color:'#1a365d', fontWeight:'600'}}>📥 Exporter Rapport</Text></TouchableOpacity>
      </View>
    </ScrollView>
  );
}
