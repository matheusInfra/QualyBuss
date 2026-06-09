// [UI_COMPONENTS] React and React Native basics
import React, { useEffect, useState, useRef } from 'react';
import { 
  View, Text, StyleSheet, TouchableOpacity, Animated, 
  Dimensions, TouchableWithoutFeedback 
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';

// [AUTH_LOGIC] Supabase
import { supabase } from '../services/supabase';

const { width, height } = Dimensions.get('window');
const DRAWER_WIDTH = width * 0.75; // 75% da tela

export const DashboardScreen: React.FC = () => {
  const [userData, setUserData] = useState<any>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  
  // [UI_COMPONENTS] Animation values for the Drawer
  const slideAnim = useRef(new Animated.Value(-DRAWER_WIDTH)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  // [AUTH_LOGIC] Fetch user profile on load
  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      // 1. Tentamos buscar o perfil no banco
      const { data, error } = await supabase
        .from('providers')
        .select('*')
        .eq('id', user.id)
        .single();
      
      if (error && error.code === 'PGRST116') {
        // PGRST116 significa "Nenhuma linha retornada". 
        // O usuário acabou de confirmar o e-mail pela 1ª vez!
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
      } else if (data) {
        // O perfil já existe normalmente
        setUserData(data);
      }
    }
  };

  // [UI_COMPONENTS] Drawer Animations
  const openDrawer = () => {
    setIsDrawerOpen(true);
    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(fadeAnim, {
        toValue: 0.5,
        duration: 300,
        useNativeDriver: true,
      })
    ]).start();
  };

  const closeDrawer = () => {
    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: -DRAWER_WIDTH,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      })
    ]).start(() => setIsDrawerOpen(false));
  };

  // [AUTH_LOGIC] Handle Logout
  const handleLogout = async () => {
    // App.tsx auth listener will automatically redirect to Welcome screen
    await supabase.auth.signOut();
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* [UI_COMPONENTS] Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={openDrawer} style={styles.menuButton}>
          <MaterialIcons name="menu" size={28} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>QualyJobs</Text>
        <View style={{ width: 28 }} /> {/* Placeholder to balance header */}
      </View>

      {/* [UI_COMPONENTS] Main Content */}
      <View style={styles.mainContent}>
        <Text style={styles.welcomeText}>Bem-vindo,</Text>
        <Text style={styles.nameText}>
          {userData?.name || 'Carregando...'}
        </Text>
        {userData?.is_ouro && (
          <View style={styles.ouroBadgeContainer}>
            <MaterialIcons name="star" size={20} color="#f57c00" />
            <Text style={styles.ouroBadgeText}>Prestador Ouro</Text>
          </View>
        )}
      </View>

      {/* [UI_COMPONENTS] Overlay (Background Escurecido) */}
      {isDrawerOpen && (
        <TouchableWithoutFeedback onPress={closeDrawer}>
          <Animated.View style={[styles.overlay, { opacity: fadeAnim }]} />
        </TouchableWithoutFeedback>
      )}

      {/* [UI_COMPONENTS] Menu Lateral (Drawer) */}
      <Animated.View style={[styles.drawer, { transform: [{ translateX: slideAnim }] }]}>
        <View style={styles.drawerHeader}>
          <MaterialIcons name="account-circle" size={64} color="#0056b3" />
          <Text style={styles.drawerName}>{userData?.name || 'Usuário'}</Text>
          <Text style={styles.drawerEmail}>{userData?.profession || 'Profissão'}</Text>
        </View>

        <View style={styles.drawerItems}>
          <TouchableOpacity style={styles.drawerItem}>
            <MaterialIcons name="home" size={24} color="#555" />
            <Text style={styles.drawerItemText}>Início</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.drawerItem}>
            <MaterialIcons name="person" size={24} color="#555" />
            <Text style={styles.drawerItemText}>Meu Perfil</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.drawerItem}>
            <MaterialIcons name="settings" size={24} color="#555" />
            <Text style={styles.drawerItemText}>Configurações</Text>
          </TouchableOpacity>
        </View>

        {/* [AUTH_LOGIC] Botão Sair no Rodapé */}
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <MaterialIcons name="logout" size={24} color="#d32f2f" />
          <Text style={styles.logoutText}>Sair</Text>
        </TouchableOpacity>
      </Animated.View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  menuButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#0056b3',
  },
  mainContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  welcomeText: {
    fontSize: 24,
    color: '#666',
  },
  nameText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
    textAlign: 'center',
  },
  ouroBadgeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff3e0',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#ffe0b2',
  },
  ouroBadgeText: {
    fontSize: 16,
    color: '#f57c00',
    fontWeight: 'bold',
    marginLeft: 8,
  },
  // DRAWER STYLES
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#000',
    zIndex: 10,
  },
  drawer: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    width: DRAWER_WIDTH,
    backgroundColor: '#fff',
    zIndex: 20,
    shadowColor: '#000',
    shadowOffset: { width: 2, height: 0 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 10,
  },
  drawerHeader: {
    padding: 24,
    paddingTop: 60,
    backgroundColor: '#f5f7fa',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    alignItems: 'center',
  },
  drawerName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 12,
  },
  drawerEmail: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  drawerItems: {
    flex: 1,
    paddingTop: 16,
  },
  drawerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 24,
  },
  drawerItemText: {
    fontSize: 16,
    color: '#333',
    marginLeft: 16,
    fontWeight: '500',
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 24,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  logoutText: {
    fontSize: 16,
    color: '#d32f2f',
    fontWeight: 'bold',
    marginLeft: 16,
  },
});
