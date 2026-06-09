// [UI_COMPONENTS] React and React Native basics
import React, { useState } from 'react';
import { 
  View, Text, TextInput, TouchableOpacity, StyleSheet, 
  KeyboardAvoidingView, Platform, Alert, ActivityIndicator 
} from 'react-native';

// [UI_COMPONENTS] Icons
import { MaterialIcons } from '@expo/vector-icons';

// [AUTH_LOGIC] Supabase client
import { supabase } from '../services/supabase';

// [ROUTER] Types for React Navigation props
export const WelcomeScreen = ({ navigation }: any) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  // [AUTH_LOGIC] Function to handle Login
  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Atenção', 'Preencha e-mail e senha para entrar.');
      return;
    }

    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    setLoading(false);

    if (error) {
      console.error("ERRO SUPABASE LOGIN:", error);
      Alert.alert('Erro no Login', error.message || 'Credenciais inválidas ou conta não encontrada.');
    }
    // Note: Se o login for um sucesso, o listener global no App.tsx cuidará do roteamento!
  };

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'} 
      style={styles.container}
    >
      <View style={styles.content}>
        
        {/* [UI_COMPONENTS] Header */}
        <View style={styles.header}>
          <MaterialIcons name="work-outline" size={64} color="#0056b3" />
          <Text style={styles.title}>QualyJobs</Text>
          <Text style={styles.subtitle}>Área do Prestador</Text>
        </View>

        {/* [UI_COMPONENTS] Login Form */}
        <View style={styles.formContainer}>
          <View style={styles.inputContainer}>
            <MaterialIcons name="email" size={20} color="#666" style={styles.inputIcon} />
            <TextInput 
              style={styles.input} 
              placeholder="Seu e-mail" 
              keyboardType="email-address" 
              autoCapitalize="none"
              value={email} 
              onChangeText={setEmail} 
            />
          </View>

          <View style={styles.inputContainer}>
            <MaterialIcons name="lock" size={20} color="#666" style={styles.inputIcon} />
            <TextInput 
              style={styles.input} 
              placeholder="Sua senha" 
              secureTextEntry 
              value={password} 
              onChangeText={setPassword} 
            />
          </View>

          <TouchableOpacity 
            style={styles.buttonPrimary} 
            onPress={handleLogin}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.buttonPrimaryText}>Entrar</Text>
            )}
          </TouchableOpacity>
        </View>

        {/* [ROUTER] Navigation to Registration */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>Ainda não é um prestador?</Text>
          <TouchableOpacity 
            style={styles.buttonSecondary} 
            onPress={() => navigation.navigate('Register')}
          >
            <Text style={styles.buttonSecondaryText}>Criar Conta Grátis</Text>
          </TouchableOpacity>
        </View>

      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  content: {
    flex: 1,
    padding: 24,
    justifyContent: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 16,
  },
  subtitle: {
    fontSize: 18,
    color: '#666',
    marginTop: 4,
  },
  formContainer: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
    marginBottom: 32,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f7fa',
    borderWidth: 1,
    borderColor: '#e4e8ec',
    borderRadius: 12,
    marginBottom: 16,
    paddingHorizontal: 12,
  },
  inputIcon: {
    marginRight: 8,
  },
  input: {
    flex: 1,
    paddingVertical: 14,
    fontSize: 16,
    color: '#333',
  },
  buttonPrimary: {
    backgroundColor: '#0056b3',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 8,
  },
  buttonPrimaryText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  footer: {
    alignItems: 'center',
  },
  footerText: {
    color: '#666',
    fontSize: 15,
    marginBottom: 12,
  },
  buttonSecondary: {
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#0056b3',
    width: '100%',
    alignItems: 'center',
  },
  buttonSecondaryText: {
    color: '#0056b3',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
