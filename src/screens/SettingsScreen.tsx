import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { supabase } from '../services/supabase';

export const SettingsScreen: React.FC = () => {

  const handleLogout = () => {
    Alert.alert('Sair', 'Tem certeza que deseja sair do aplicativo?', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Sair', style: 'destructive', onPress: async () => await supabase.auth.signOut() }
    ]);
  };

  const renderOption = (icon: any, title: string, subtitle?: string) => (
    <TouchableOpacity style={styles.optionRow}>
      <View style={styles.optionIcon}>
        <MaterialIcons name={icon} size={24} color="#555" />
      </View>
      <View style={styles.optionTextContainer}>
        <Text style={styles.optionTitle}>{title}</Text>
        {subtitle && <Text style={styles.optionSubtitle}>{subtitle}</Text>}
      </View>
      <MaterialIcons name="chevron-right" size={24} color="#ccc" />
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Configurações</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        
        <Text style={styles.sectionTitle}>Conta</Text>
        <View style={styles.card}>
          {renderOption('lock-outline', 'Privacidade e Segurança', 'Senhas e RLS')}
          <View style={styles.divider} />
          {renderOption('notifications-none', 'Notificações', 'Alertas de novos serviços')}
          <View style={styles.divider} />
          {renderOption('payment', 'Dados Bancários', 'Recebimento de valores')}
        </View>

        <Text style={styles.sectionTitle}>Aplicativo</Text>
        <View style={styles.card}>
          {renderOption('language', 'Idioma', 'Português (Brasil)')}
          <View style={styles.divider} />
          {renderOption('dark-mode', 'Tema', 'Claro')}
        </View>

        {/* Botão de Sair Movido para cá! */}
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <MaterialIcons name="logout" size={24} color="#d32f2f" />
          <Text style={styles.logoutText}>Sair da Conta</Text>
        </TouchableOpacity>

      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8f9fa' },
  header: {
    paddingHorizontal: 24, paddingVertical: 16,
    backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#eee',
  },
  headerTitle: { fontSize: 22, fontWeight: 'bold', color: '#333' },
  scrollContent: { padding: 24 },
  sectionTitle: { fontSize: 16, fontWeight: 'bold', color: '#666', marginBottom: 12, marginTop: 12 },
  card: {
    backgroundColor: '#fff', borderRadius: 16, marginBottom: 24,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05, shadowRadius: 4, elevation: 1,
  },
  optionRow: { flexDirection: 'row', alignItems: 'center', padding: 16 },
  optionIcon: { marginRight: 16 },
  optionTextContainer: { flex: 1 },
  optionTitle: { fontSize: 16, color: '#333', fontWeight: '500' },
  optionSubtitle: { fontSize: 13, color: '#888', marginTop: 2 },
  divider: { height: 1, backgroundColor: '#eee', marginLeft: 56 },
  logoutButton: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    backgroundColor: '#ffebee', padding: 16, borderRadius: 12, marginTop: 32,
    borderWidth: 1, borderColor: '#ffcdd2',
  },
  logoutText: { fontSize: 16, fontWeight: 'bold', color: '#d32f2f', marginLeft: 12 },
});
