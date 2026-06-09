// [UI_COMPONENTS] React and React Native basics
import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';

// [AUTH_LOGIC] Supabase
import { supabase } from '../services/supabase';

export const HomeScreen: React.FC = () => {
  const [userData, setUserData] = useState<any>(null);

  // [AUTH_LOGIC] Fetch user profile on load & handle Lazy Insert
  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      // 1. Buscamos como array para evitar o erro 406 (Not Acceptable) no console
      const { data, error } = await supabase
        .from('providers')
        .select('*')
        .eq('id', user.id);
      
      if (!error && data && data.length === 0) {
        // Nenhuma linha retornada.
        // O usuário acabou de criar a conta!
        // Vamos extrair os dados salvos no MetaDados do Supabase Auth e jogar na Tabela.
        const meta = user.user_metadata;
        if (meta && meta.name) {
          const { data: newData, error: insertError } = await supabase.from('providers').insert({
            id: user.id,
            name: meta.name,
            whatsapp: meta.whatsapp,
            profession: meta.profession,
            cnpj_cpf: meta.cnpj_cpf,
            city: meta.city,
            work_radius: meta.work_radius,
            is_ouro: meta.is_ouro
          }).select().single();
          
          if (!insertError) {
            setUserData(newData);
          } else {
            console.error("Erro ao transferir metadata para providers:", insertError);
          }
        }
      } else if (data && data.length > 0) {
        // O perfil já existe normalmente
        setUserData(data[0]);
      }
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header Limpo */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerGreeting}>Olá, {userData?.name?.split(' ')[0] || 'Carregando...'}</Text>
          <Text style={styles.headerSubtitle}>Como está seu dia de trabalho?</Text>
        </View>
        <TouchableOpacity style={styles.notificationButton}>
          <MaterialIcons name="notifications-none" size={28} color="#333" />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        {/* Placeholder: Estatísticas Básicas */}
        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <MaterialIcons name="star" size={24} color="#f57c00" />
            <Text style={styles.statValue}>4.9</Text>
            <Text style={styles.statLabel}>Avaliação</Text>
          </View>
          <View style={styles.statCard}>
            <MaterialIcons name="check-circle" size={24} color="#388e3c" />
            <Text style={styles.statValue}>12</Text>
            <Text style={styles.statLabel}>Concluídos</Text>
          </View>
          <View style={styles.statCard}>
            <MaterialIcons name="account-balance-wallet" size={24} color="#0056b3" />
            <Text style={styles.statValue}>R$ 450</Text>
            <Text style={styles.statLabel}>Semana</Text>
          </View>
        </View>

        {/* Anúncios Futuros */}
        <Text style={styles.sectionTitle}>Anúncios em Destaque</Text>
        <View style={styles.adCard}>
          <View style={styles.adContent}>
            <Text style={styles.adTitle}>Seja Premium 🚀</Text>
            <Text style={styles.adText}>Receba chamados antes de todo mundo! Ative a conta Ouro gratuitamente completando seu CNPJ.</Text>
          </View>
        </View>

        {/* Últimos Serviços Atendidos */}
        <Text style={styles.sectionTitle}>Últimos Serviços (Histórico)</Text>
        
        <View style={styles.serviceCard}>
          <View style={styles.serviceIcon}>
            <MaterialIcons name="build" size={24} color="#0056b3" />
          </View>
          <View style={styles.serviceInfo}>
            <Text style={styles.serviceName}>Manutenção de Ar Condicionado</Text>
            <Text style={styles.serviceDate}>Ontem, 14:30 - Cliente: Carlos M.</Text>
          </View>
          <Text style={styles.servicePrice}>R$ 120</Text>
        </View>

        <View style={styles.serviceCard}>
          <View style={styles.serviceIcon}>
            <MaterialIcons name="plumbing" size={24} color="#0056b3" />
          </View>
          <View style={styles.serviceInfo}>
            <Text style={styles.serviceName}>Reparo Hidráulico (Pia)</Text>
            <Text style={styles.serviceDate}>10 de Ago - Cliente: Ana Souza</Text>
          </View>
          <Text style={styles.servicePrice}>R$ 80</Text>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8f9fa' },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 24,
    backgroundColor: '#fff',
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
  },
  headerGreeting: { fontSize: 24, fontWeight: 'bold', color: '#333' },
  headerSubtitle: { fontSize: 14, color: '#666', marginTop: 4 },
  notificationButton: {
    backgroundColor: '#f5f7fa',
    padding: 10,
    borderRadius: 50,
  },
  scrollContent: { padding: 24, paddingBottom: 40 },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 32,
  },
  statCard: {
    backgroundColor: '#fff',
    flex: 1,
    marginHorizontal: 4,
    padding: 16,
    borderRadius: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2,
  },
  statValue: { fontSize: 20, fontWeight: 'bold', color: '#333', marginTop: 8 },
  statLabel: { fontSize: 12, color: '#777', marginTop: 2 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: '#333', marginBottom: 16 },
  adCard: {
    backgroundColor: '#e3f2fd',
    borderRadius: 16,
    padding: 20,
    marginBottom: 32,
    borderWidth: 1,
    borderColor: '#bbdefb',
  },
  adTitle: { fontSize: 18, fontWeight: 'bold', color: '#1565c0', marginBottom: 8 },
  adText: { fontSize: 14, color: '#1976d2', lineHeight: 22 },
  serviceCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  serviceIcon: {
    backgroundColor: '#e3f2fd',
    padding: 12,
    borderRadius: 12,
    marginRight: 16,
  },
  serviceInfo: { flex: 1 },
  serviceName: { fontSize: 15, fontWeight: 'bold', color: '#333', marginBottom: 4 },
  serviceDate: { fontSize: 12, color: '#777' },
  servicePrice: { fontSize: 16, fontWeight: 'bold', color: '#388e3c' },
});
