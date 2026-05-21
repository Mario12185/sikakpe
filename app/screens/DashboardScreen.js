// 📦 app/screens/DashboardScreen.js — DESIGN SYSTEM GLOBAL
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import theme from '../../src/theme/designSystem'; // ← Import du thème

export default function DashboardScreen({ navigation }) {
  const { colors, spacing, typography, components } = theme;

  // 📊 Données fictives (à remplacer par Firestore)
  const stats = [
    { label: 'En attente', value: '0', icon: 'time-outline', color: colors.warning },
    { label: 'Approuvées', value: '1', icon: 'checkmark-circle-outline', color: colors.success },
    { label: 'Contestées', value: '0', icon: 'alert-circle-outline', color: colors.error },
  ];

  return (
    <ScrollView style={{ flex: 1, backgroundColor: colors.background }} contentContainerStyle={{ padding: spacing.lg }}>
      
      {/* 🎯 En-tête */}
      <View style={{ marginBottom: spacing.xl }}>
        <Text style={{ 
          fontSize: typography.sizes.xxl, 
          fontWeight: typography.weights.bold, 
          color: colors.primary 
        }}>
          🇹🇬 SikaKpɛ
        </Text>
        <Text style={{ 
          fontSize: typography.sizes.md, 
          color: colors.textSecondary,
          marginTop: spacing.xs
        }}>
          Validation des prestations de gardiennage
        </Text>
      </View>

      {/* 📊 Cartes de statistiques */}
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginHorizontal: -spacing.sm }}>
        {stats.map((stat, index) => (
          <View 
            key={index} 
            style={{ 
              flex: 1, 
              minWidth: '48%', 
              margin: spacing.sm,
              ...components.card,
              borderLeftColor: stat.color,
              padding: spacing.md
            }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: spacing.sm }}>
              <Ionicons name={stat.icon} size={20} color={stat.color} />
              <Text style={{ 
                marginLeft: spacing.sm, 
                fontSize: typography.sizes.sm, 
                color: colors.textSecondary,
                fontWeight: typography.weights.medium
              }}>
                {stat.label}
              </Text>
            </View>
            <Text style={{ 
              fontSize: 32, 
              fontWeight: typography.weights.bold, 
              color: colors.primary 
            }}>
              {stat.value}
            </Text>
          </View>
        ))}
      </View>

      {/* 🚀 Actions rapides */}
      <View style={{ marginTop: spacing.xl }}>
        <Text style={{ 
          fontSize: typography.sizes.lg, 
          fontWeight: typography.weights.semibold, 
          color: colors.text,
          marginBottom: spacing.md
        }}>
          ⚡ Actions rapides
        </Text>
        
        <TouchableOpacity 
          style={{ ...components.card, flexDirection: 'row', alignItems: 'center' }}
          onPress={() => navigation.navigate('Services')}
        >
          <View style={{ 
            width: 48, height: 48, borderRadius: 12, 
            backgroundColor: colors.primary, 
            alignItems: 'center', justifyContent: 'center',
            marginRight: spacing.md
          }}>
            <Ionicons name="add-circle-outline" size={24} color="#fff" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ 
              fontSize: typography.sizes.md, 
              fontWeight: typography.weights.semibold, 
              color: colors.text 
            }}>
              Nouvelle prestation
            </Text>
            <Text style={{ 
              fontSize: typography.sizes.sm, 
              color: colors.textSecondary 
            }}>
              Créer une demande de gardiennage
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
        </TouchableOpacity>

        <TouchableOpacity 
          style={{ ...components.card, flexDirection: 'row', alignItems: 'center' }}
          onPress={() => navigation.navigate('Sécurité')}
        >
          <View style={{ 
            width: 48, height: 48, borderRadius: 12, 
            backgroundColor: colors.success, 
            alignItems: 'center', justifyContent: 'center',
            marginRight: spacing.md
          }}>
            <Ionicons name="shield-checkmark-outline" size={24} color="#fff" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ 
              fontSize: typography.sizes.md, 
              fontWeight: typography.weights.semibold, 
              color: colors.text 
            }}>
              Vérifier un gardien
            </Text>
            <Text style={{ 
              fontSize: typography.sizes.sm, 
              color: colors.textSecondary 
            }}>
              Scanner un QR Code de présence
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
        </TouchableOpacity>
      </View>

    </ScrollView>
  );
}