import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { db, auth, ensureAuth } from '../services/firebase';
import { collection, query, where, onSnapshot, doc, getDoc } from 'firebase/firestore';

export default function DashboardScreen({ navigation }) {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ sites: 0, checkinsToday: 0, totalCheckins: 0, compliance: 100 });
  const [recentActivity, setRecentActivity] = useState([]);
  const [subInfo, setSubInfo] = useState(null);

  useEffect(() => {
    (async () => {
      await ensureAuth();
      const uid = auth.currentUser?.uid;
      if (!uid) return;

      // 🔍 Charger infos abonnement
      const subSnap = await getDoc(doc(db, 'subscriptions', uid));
      if (subSnap.exists()) {
        const data = subSnap.data();
        const expiresAt = data.expiresAt?.toDate ? data.expiresAt.toDate() : null;
        setSubInfo({ ...data, expiresAt, isActive: expiresAt ? expiresAt > new Date() : false });
      }

      const todayStart = new Date(); todayStart.setHours(0,0,0,0);
      const todayTimestamp = todayStart.getTime() / 1000;

      const unsubSites = onSnapshot(query(collection(db, 'sites'), where('clientId', '==', uid)), snap => {
        setStats(prev => ({ ...prev, sites: snap.size }));
      });

      const unsubCheckins = onSnapshot(query(collection(db, 'checkins'), where('clientId', '==', uid)), snap => {
        let today = 0, valid = 0;
        const recent = [];
        snap.docs.forEach(doc => {
          const data = doc.data();
          const ts = data.timestamp?.seconds || 0;
          if (ts >= todayTimestamp) today++;
          if (data.status === 'valid') valid++;
          if (recent.length < 5) recent.push({ id: doc.id, ...data });
        });
        const total = snap.size;
        setStats(prev => ({ ...prev, checkinsToday: today, totalCheckins: total, compliance: total > 0 ? Math.round((valid / total) * 100) : 100 }));
        setRecentActivity(recent);
        setLoading(false);
      });

      return () => { unsubSites(); unsubCheckins(); };
    })();
  }, []);

  if (loading) return <View style={{flex:1,justifyContent:'center',alignItems:'center'}}><ActivityIndicator size="large" color="#1a365d" /><Text style={{marginTop:10}}>Chargement...</Text></View>;

  return (
    <ScrollView style={{flex:1, backgroundColor:'#f7fafc', padding:20}}>
      {/* 🎯 En-tête avec Badge Abonnement */}
      <View style={{flexDirection:'row', justifyContent:'space-between', alignItems:'flex-start', marginBottom:24}}>
        <View>
          <Text style={{fontSize:24, fontWeight:'700', color:'#1a365d'}}>📊 Tableau de bord</Text>
          <Text style={{fontSize:14, color:'#666'}}>Vue d'ensemble de votre audit de sécurité</Text>
        </View>
        {subInfo && (
          <View style={{backgroundColor: subInfo.planType==='company' ? '#fef3c7' : '#dbeafe', padding:10, borderRadius:10, borderLeftWidth:4, borderLeftColor: subInfo.planType==='company' ? '#d97706' : '#3b82f6', minWidth: 120}}>
            <Text style={{fontSize:13, fontWeight:'bold', color:'#1f2937'}}>
              {subInfo.planType==='company' ? '🏢 Entreprise' : '👤 Particulier'}
            </Text>
            <Text style={{fontSize:11, color:'#4b5563'}}>
              {subInfo.isActive ? '✅ Actif' : '⚠️ Expiré'} • {subInfo.expiresAt ? subInfo.expiresAt.toLocaleDateString('fr-FR') : '-'}
            </Text>
          </View>
        )}
      </View>

      {/* 📊 KPI Cards */}
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

      {/* 🕒 Activité récente */}
      <Text style={{fontSize:18, fontWeight:'600', color:'#1a202c', marginBottom:12}}>🕒 Activité récente</Text>
      {recentActivity.length === 0 ? (
        <Text style={{color:'#666', textAlign:'center', padding:20}}>Aucun check-in enregistré.</Text>
      ) : (
        recentActivity.map(item => {
          const d = item.timestamp?.toDate ? item.timestamp.toDate() : new Date();
          return (
            <View key={item.id} style={{backgroundColor:'#fff', padding:14, borderRadius:10, marginBottom:10, flexDirection:'row', justifyContent:'space-between', alignItems:'center'}}>
              <View>
                <Text style={{fontWeight:'600'}}>{item.siteName || 'Site'}</Text>
                <Text style={{fontSize:12, color:'#666'}}>🏢 {item.agency} • {d.toLocaleTimeString('fr-FR')}</Text>
              </View>
              <Text style={{color: item.status==='valid' ? '#00aa55' : '#dd6b20', fontWeight:'600'}}>
                {item.status==='valid' ? '✅ Présence OK' : '⚠️ Hors zone'}
              </Text>
            </View>
          )
        })
      )}

      {/* ⚡ Actions rapides */}
      <View style={{marginTop:20, flexDirection:'row', justifyContent:'space-between'}}>
        <TouchableOpacity style={{flex:1, backgroundColor:'#1a365d', padding:14, borderRadius:10, marginRight:8, alignItems:'center'}} onPress={()=>navigation.navigate('CheckIn')}>
          <Text style={{color:'#fff', fontWeight:'600'}}>🛡️ Nouveau Check-in</Text>
        </TouchableOpacity>
        <TouchableOpacity style={{flex:1, backgroundColor:'#fff', borderWidth:1, borderColor:'#1a365d', padding:14, borderRadius:10, marginLeft:8, alignItems:'center'}} onPress={()=>navigation.navigate('Rapports')}>
          <Text style={{color:'#1a365d', fontWeight:'600'}}>📥 Exporter Rapport</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}
