import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';

export const SupportScreen: React.FC = () => {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Central de Suporte</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        
        <Text style={styles.greeting}>Como podemos ajudar você hoje?</Text>
        
        {/* Chat Ao Vivo */}
        <TouchableOpacity style={[styles.card, styles.chatCard]}>
          <View style={styles.iconCircleChat}>
            <MaterialIcons name="support-agent" size={32} color="#fff" />
          </View>
          <View style={styles.cardTextContainer}>
            <Text style={styles.cardTitle}>Chat de Interação</Text>
            <Text style={styles.cardSubtitle}>Fale agora com a nossa equipe em tempo real para tirar dúvidas rápidas.</Text>
          </View>
          <MaterialIcons name="chevron-right" size={24} color="#0056b3" />
        </TouchableOpacity>

        {/* Abrir Ticket */}
        <TouchableOpacity style={styles.card}>
          <View style={styles.iconCircleTicket}>
            <MaterialIcons name="confirmation-num" size={32} color="#0056b3" />
          </View>
          <View style={styles.cardTextContainer}>
            <Text style={styles.cardTitle}>Abrir Ticket (Chamado)</Text>
            <Text style={styles.cardSubtitle}>Problemas complexos ou denúncias. Prazo de resolução: 24h a 48h.</Text>
          </View>
          <MaterialIcons name="chevron-right" size={24} color="#666" />
        </TouchableOpacity>

        {/* FAQ */}
        <Text style={styles.sectionTitle}>Dúvidas Frequentes (FAQ)</Text>
        
        <View style={styles.faqItem}>
          <Text style={styles.faqQuestion}>Como recebo meu pagamento?</Text>
          <MaterialIcons name="expand-more" size={24} color="#666" />
        </View>
        <View style={styles.faqItem}>
          <Text style={styles.faqQuestion}>Como funciona a taxa do aplicativo?</Text>
          <MaterialIcons name="expand-more" size={24} color="#666" />
        </View>
        <View style={styles.faqItem}>
          <Text style={styles.faqQuestion}>O cliente não estava no local, e agora?</Text>
          <MaterialIcons name="expand-more" size={24} color="#666" />
        </View>

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
  greeting: { fontSize: 18, color: '#555', marginBottom: 24, textAlign: 'center' },
  card: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff',
    padding: 20, borderRadius: 16, marginBottom: 16,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05, shadowRadius: 4, elevation: 2,
    borderWidth: 1, borderColor: '#eee',
  },
  chatCard: { borderColor: '#bbdefb', backgroundColor: '#f0f8ff' },
  iconCircleChat: {
    width: 56, height: 56, borderRadius: 28, backgroundColor: '#0056b3',
    justifyContent: 'center', alignItems: 'center', marginRight: 16,
  },
  iconCircleTicket: {
    width: 56, height: 56, borderRadius: 28, backgroundColor: '#e3f2fd',
    justifyContent: 'center', alignItems: 'center', marginRight: 16,
  },
  cardTextContainer: { flex: 1 },
  cardTitle: { fontSize: 16, fontWeight: 'bold', color: '#333', marginBottom: 4 },
  cardSubtitle: { fontSize: 13, color: '#666', lineHeight: 20 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: '#333', marginTop: 32, marginBottom: 16 },
  faqItem: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    backgroundColor: '#fff', padding: 16, borderRadius: 12, marginBottom: 8,
  },
  faqQuestion: { fontSize: 15, color: '#444', fontWeight: '500' },
});
