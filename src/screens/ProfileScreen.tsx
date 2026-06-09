import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';

export const ProfileScreen: React.FC = () => {
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        
        {/* Foto e Avaliação */}
        <View style={styles.profileHeader}>
          <View style={styles.avatarContainer}>
            <MaterialIcons name="person" size={60} color="#ccc" />
          </View>
          <Text style={styles.name}>João Prestador</Text>
          <Text style={styles.profession}>Eletricista Residencial</Text>
          
          <View style={styles.starsContainer}>
            {[1, 2, 3, 4, 5].map((star) => (
              <MaterialIcons key={star} name="star" size={24} color="#f57c00" />
            ))}
            <Text style={styles.ratingText}>5.0 (42 avaliações)</Text>
          </View>
        </View>

        <TouchableOpacity style={styles.editButton}>
          <Text style={styles.editButtonText}>Editar Perfil</Text>
        </TouchableOpacity>

        {/* Dados Básicos */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Dados Pessoais</Text>
          
          <View style={styles.infoRow}>
            <MaterialIcons name="email" size={20} color="#666" />
            <Text style={styles.infoText}>joao@exemplo.com</Text>
          </View>
          <View style={styles.infoRow}>
            <MaterialIcons name="phone" size={20} color="#666" />
            <Text style={styles.infoText}>(11) 99999-9999</Text>
          </View>
          <View style={styles.infoRow}>
            <MaterialIcons name="location-on" size={20} color="#666" />
            <Text style={styles.infoText}>São Paulo - SP (Raio: 15km)</Text>
          </View>
        </View>

        {/* Certificações */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Certificações e Formações</Text>
            <TouchableOpacity>
              <MaterialIcons name="add-circle-outline" size={24} color="#0056b3" />
            </TouchableOpacity>
          </View>
          
          <View style={styles.certCard}>
            <MaterialIcons name="verified" size={24} color="#388e3c" />
            <View style={styles.certInfo}>
              <Text style={styles.certTitle}>NR-10 Básico - Segurança</Text>
              <Text style={styles.certInst}>SENAI - Concluído em 2021</Text>
            </View>
          </View>

        </View>

      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8f9fa' },
  scrollContent: { padding: 24 },
  profileHeader: { alignItems: 'center', marginBottom: 24 },
  avatarContainer: {
    width: 120, height: 120, borderRadius: 60,
    backgroundColor: '#e4e8ec',
    justifyContent: 'center', alignItems: 'center',
    marginBottom: 16,
    borderWidth: 4, borderColor: '#fff',
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1, shadowRadius: 10, elevation: 5,
  },
  name: { fontSize: 24, fontWeight: 'bold', color: '#333' },
  profession: { fontSize: 16, color: '#666', marginTop: 4 },
  starsContainer: { flexDirection: 'row', alignItems: 'center', marginTop: 12 },
  ratingText: { marginLeft: 8, fontSize: 14, color: '#555', fontWeight: 'bold' },
  editButton: {
    backgroundColor: '#0056b3', padding: 16, borderRadius: 12,
    alignItems: 'center', marginBottom: 32,
  },
  editButtonText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
  section: {
    backgroundColor: '#fff', padding: 20, borderRadius: 16, marginBottom: 24,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05, shadowRadius: 4, elevation: 1,
  },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: '#333', marginBottom: 16 },
  infoRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  infoText: { fontSize: 15, color: '#444', marginLeft: 12 },
  certCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#f5f7fa', padding: 16, borderRadius: 12 },
  certInfo: { marginLeft: 16 },
  certTitle: { fontSize: 15, fontWeight: 'bold', color: '#333' },
  certInst: { fontSize: 13, color: '#666', marginTop: 4 },
});
