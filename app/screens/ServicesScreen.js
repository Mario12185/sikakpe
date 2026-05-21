// 📦 app/screens/ServicesScreen.js — DESIGN SYSTEM GLOBAL
import React from 'react';
import { View, Text, FlatList, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import theme from '../../src/theme/designSystem';

export default function ServicesScreen({ navigation }) {
  const { colors, spacing, typography, components } = theme;

  // 📋 Données fictives
  const services = [
    { id: '1', title: 'Gardiennage nocturne', client: 'Entreprise X', status: 'approved', date: '20/05/2026' },
    { id: '2', title: 'Surveillance événement', client: 'Mairie de Lomé', status: 'pending', date: '21/05/2026' },
  ];

  const renderService = ({ item }) => (
    <TouchableOpacity 
      style={{ ...components.card, borderLeftColor: item.status === 'approved' ? colors.success : colors.warning }}
      onPress={() => navigation.navigate('ServiceDetail', { id: item.id })}
    >
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <View style={{ flex: 1 }}>
          <Text style={{ 
            fontSize: typography.sizes.md, 
            fontWeight: typography.weights.semibold, 
            color: colors.text,
            marginBottom: spacing.xs
          }}>
            {item.title}
          </Text>
          <Text style={{ 
            fontSize: typography.sizes.sm, 
            color: colors.textSecondary,
            marginBottom: spacing.sm
          }}>
            Client: {item.client} • {item.date}
          </Text>
          
          {/* Badge de statut */}
          <View style={{ 
            ...theme.helpers.getBadgeStyle(item.status),
            alignSelf: 'flex-start'
          }}>
            <Text style={{ color: theme.helpers.getBadgeStyle(item.status).color }}>
              {item.status === 'approved' ? '✅ Approuvé' : item.status === 'pending' ? '⏳ En attente' : '❌ Contesté'}
            </Text>
          </View>
        </View>
        <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <FlatList
        data={services}
        renderItem={renderService}
        keyExtractor={item => item.id}
        contentContainerStyle={{ padding: spacing.lg }}
        ListHeaderComponent={
          <View style={{ marginBottom: spacing.lg }}>
            <Text style={{ 
              fontSize: typography.sizes.xl, 
              fontWeight: typography.weights.bold, 
              color: colors.primary 
            }}>
              📋 Prestations
            </Text>
            <Text style={{ 
              fontSize: typography.sizes.sm, 
              color: colors.textSecondary,
              marginTop: spacing.xs
            }}>
              Gérez toutes vos demandes de gardiennage
            </Text>
          </View>
        }
      />
    </View>
  );
}