import React, { useState } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, TextInput, ActivityIndicator, Alert } from 'react-native';
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../services/firebase';
import { useTheme } from '../context/ThemeContext';
import { MaterialIcons } from '@expo/vector-icons';

export default function ValidationModal({ visible, onClose, service }) {
  const { theme } = useTheme();
  const [status, setStatus] = useState('validated');
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(false);

  if (!service) return null;

  const handleSubmit = async () => {
    setLoading(true);
    try {
      await updateDoc(doc(db, 'services', service.id), {
        status, comment, validatedAt: serverTimestamp(), validator: 'Admin GardiKpɛ'
      });
      Alert.alert('✅ Succès', `Prestation ${status === 'validated' ? 'approuvée' : 'contestée'}`);
      onClose();
    } catch (err) {
      Alert.alert('❌ Erreur', err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={[styles.content, { backgroundColor: theme.colors.card }]}>
          <View style={styles.modalHeader}>
            <Text style={[styles.title, { color: theme.colors.textPrimary }]}>Valider la prestation</Text>
            <TouchableOpacity onPress={onClose}><MaterialIcons name="close" size={24} color={theme.colors.textSecondary} /></TouchableOpacity>
          </View>

          <View style={[styles.infoCard, { backgroundColor: theme.colors.background }]}>
            <Text style={[styles.infoTitle, { color: theme.colors.textPrimary }]}>{service.provider_name}</Text>
            <Text style={styles.infoText}>📍 {service.site}</Text>
            <Text style={styles.infoText}>📅 {service.date} | ⏱ {service.start_time} - {service.end_time}</Text>
            <Text style={styles.infoText}>👤 {service.agent_name}</Text>
          </View>

          <Text style={[styles.label, { color: theme.colors.textPrimary }]}>Résultat</Text>
          <View style={styles.btnRow}>
            <TouchableOpacity style={[styles.statusBtn, { borderColor: status === 'validated' ? theme.colors.success : '#E2E8F0', backgroundColor: status === 'validated' ? '#ECFDF5' : '#FFF' }]} onPress={() => setStatus('validated')}>
              <MaterialIcons name="check-circle" size={20} color={status === 'validated' ? theme.colors.success : '#CBD5E1'} />
              <Text style={[styles.statusBtnText, { color: status === 'validated' ? theme.colors.success : '#64748B' }]}>Approuver</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.statusBtn, { borderColor: status === 'disputed' ? theme.colors.error : '#E2E8F0', backgroundColor: status === 'disputed' ? '#FEF2F2' : '#FFF' }]} onPress={() => setStatus('disputed')}>
              <MaterialIcons name="cancel" size={20} color={status === 'disputed' ? theme.colors.error : '#CBD5E1'} />
              <Text style={[styles.statusBtnText, { color: status === 'disputed' ? theme.colors.error : '#64748B' }]}>Contester</Text>
            </TouchableOpacity>
          </View>

          <Text style={[styles.label, { color: theme.colors.textPrimary }]}>Commentaire</Text>
          <TextInput style={[styles.input, { backgroundColor: '#FFF', borderColor: '#CBD5E1', color: theme.colors.textPrimary }]} multiline numberOfLines={3} placeholder="Ajouter une note..." placeholderTextColor="#94A3B8" value={comment} onChangeText={setComment} />

          <TouchableOpacity style={[styles.submitBtn, { backgroundColor: status === 'validated' ? theme.colors.success : theme.colors.error, opacity: loading ? 0.7 : 1 }]} onPress={handleSubmit} disabled={loading}>
            {loading ? <ActivityIndicator color="#FFF" /> : <Text style={styles.submitText}>Valider</Text>}
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.5)' },
  content: { borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 20, paddingBottom: 30, maxHeight: '85%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  title: { fontSize: 18, fontWeight: 'bold' },
  infoCard: { padding: 14, borderRadius: 10, marginBottom: 16 },
  infoTitle: { fontSize: 15, fontWeight: '600', marginBottom: 4 },
  infoText: { fontSize: 13, color: '#64748B', marginBottom: 2 },
  label: { fontSize: 14, fontWeight: '600', marginBottom: 8 },
  btnRow: { flexDirection: 'row', marginBottom: 16 },
  statusBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 12, borderRadius: 10, borderWidth: 2, marginRight: 8 },
  statusBtnText: { fontWeight: '600', marginLeft: 6 },
  input: { borderWidth: 1, borderRadius: 10, padding: 12, minHeight: 80, marginBottom: 16, textAlignVertical: 'top' },
  submitBtn: { padding: 14, borderRadius: 12, alignItems: 'center' },
  submitText: { color: '#FFF', fontSize: 16, fontWeight: 'bold' }
});