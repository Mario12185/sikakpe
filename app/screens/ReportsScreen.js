import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { db, auth } from '../services/firebase';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';

export default function ReportsScreen() {
  const [checkins, setCheckins] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let unsub = () => {};
    const unsubAuth = onAuthStateChanged(auth, (user) => {
      unsub();
      if (!user) { setLoading(false); return; }
      unsub = onSnapshot(query(collection(db, 'checkins'), where('clientId', '==', user.uid)), snap => {
        setCheckins(snap.docs.map(d => ({ id: d.id, ...d.data() })).sort((a,b) => (b.timestamp?.seconds||0) - (a.timestamp?.seconds||0)));
        setLoading(false);
      }, ()=>setLoading(false));
    });
    return () => { unsubAuth(); unsub(); };
  }, []);

  const exportCSV = () => {
    const headers = ['Date','Heure','Site','Agence','Gardien','Distance','Statut'];
    const rows = checkins.map(c => { const d = c.timestamp?.toDate ? c.timestamp.toDate() : new Date(); return [d.toLocaleDateString('fr-FR'), d.toLocaleTimeString('fr-FR'), c.siteName||'-', c.agency||'-', c.guard||'-', `${c.distance||0}m`, c.status||'-'].join(','); });
    const csv = [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csv], {type: 'text/csv'}); const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = `rapport_sikakpe_${new Date().toISOString().slice(0,10)}.csv`; a.click();
  };
  const shareWhatsApp = (item) => { if (!item) return; const d=item.timestamp?.toDate?item.timestamp.toDate():new Date(); const text=`🛡️ *Alerte SikaKpɛ*\n✅ Présence gardien\n📍 ${item.siteName}\n🏢 ${item.agency}\n🕒 ${d.toLocaleTimeString()}`; window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank'); };

  if (loading) return <View style={{flex:1,justifyContent:'center'}}><ActivityIndicator /><Text>Chargement...</Text></View>;

  return (
    <View style={{flex:1,backgroundColor:'#f7fafc',padding:20}}>
      <View style={{flexDirection:'row',justifyContent:'space-between',alignItems:'center',marginBottom:16}}><Text style={{fontSize:22,fontWeight:'bold'}}>📋 Rapports & Preuves</Text><TouchableOpacity onPress={exportCSV} style={{backgroundColor:'#00aa55',paddingVertical:8,paddingHorizontal:14,borderRadius:8}}><Text style={{color:'#fff',fontWeight:'600'}}>📥 Export CSV</Text></TouchableOpacity></View>
      <FlatList data={checkins} keyExtractor={i=>i.id} ListEmptyComponent={<Text style={{color:'#666',textAlign:'center',marginTop:40}}>Aucun check-in enregistré.</Text>}
        renderItem={({item}) => { const d=item.timestamp?.toDate?item.timestamp.toDate():new Date(); return (<View style={{backgroundColor:'#fff',padding:14,marginBottom:10,borderRadius:10,borderLeftWidth:4,borderLeftColor:item.status==='valid'?'#00aa55':'#dd6b20'}}><Text style={{fontWeight:'600'}}>{item.siteName||item.siteId}</Text><Text style={{color:'#666',fontSize:12}}>{d.toLocaleDateString('fr-FR')} à {d.toLocaleTimeString('fr-FR')} • 🏢 {item.agency||'-'}</Text><View style={{flexDirection:'row',justifyContent:'space-between',marginTop:6,alignItems:'center'}}><Text style={{color:item.status==='valid'?'#00aa55':'#dd6b20',fontWeight:'600'}}>{item.status==='valid'?'✅ Présence confirmée':'⚠️ Hors zone'}</Text><Text style={{color:'#666'}}>📏 {item.distance||0}m</Text></View><TouchableOpacity onPress={()=>shareWhatsApp(item)} style={{marginTop:8,backgroundColor:'#25D366',paddingVertical:6,paddingHorizontal:10,borderRadius:6,alignItems:'center',width:180}}><Text style={{color:'#fff',fontSize:12,fontWeight:'600'}}>📤 Envoyer alerte WhatsApp</Text></TouchableOpacity></View>); }} />
    </View>
  );
}
