import React, { useState, useRef, useEffect } from 'react';
import { 
  View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, 
  KeyboardAvoidingView, Platform, ScrollView, Modal, ActivityIndicator, Animated
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import Checkbox from 'expo-checkbox';
import * as Linking from 'expo-linking';
import { supabase } from '../services/supabase';

interface LoginScreenProps {
  onLoginSuccess: (user: any) => void;
}

// Utility masks
const maskPhone = (val: string) => {
  let r = val.replace(/\D/g, "");
  if (r.length > 11) r = r.slice(0, 11);
  if (r.length > 2) r = r.replace(/^(\d{2})(\d)/g, "($1) $2");
  if (r.length > 7) r = r.replace(/(\d{5})(\d)/, "$1-$2");
  return r;
};

const maskCpfCnpj = (val: string) => {
  let r = val.replace(/\D/g, "");
  if (r.length <= 11) {
    r = r.replace(/(\d{3})(\d)/, "$1.$2");
    r = r.replace(/(\d{3})(\d)/, "$1.$2");
    r = r.replace(/(\d{3})(\d{1,2})$/, "$1-$2");
  } else {
    if (r.length > 14) r = r.slice(0, 14);
    r = r.replace(/^(\d{2})(\d)/, "$1.$2");
    r = r.replace(/^(\d{2})\.(\d{3})(\d)/, "$1.$2.$3");
    r = r.replace(/\.(\d{3})(\d)/, ".$1/$2");
    r = r.replace(/(\d{4})(\d)/, "$1-$2");
  }
  return r;
};

// Validation
const isValidEmail = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

export const LoginScreen: React.FC<LoginScreenProps> = ({ onLoginSuccess }) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [profession, setProfession] = useState('');
  const [cnpjCpf, setCnpjCpf] = useState('');
  const [city, setCity] = useState('');
  const [workRadius, setWorkRadius] = useState('');
  
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [isTermsModalVisible, setIsTermsModalVisible] = useState(false);
  const [loading, setLoading] = useState(false);

  // [UI_COMPONENTS] Email Confirmation Modal State
  const [isEmailModalVisible, setIsEmailModalVisible] = useState(false);
  const emailModalScale = useRef(new Animated.Value(0)).current;

  // Error states
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  const validateForm = () => {
    let newErrors: { [key: string]: string } = {};
    if (!name) newErrors.name = 'Nome é obrigatório';
    if (!email) {
      newErrors.email = 'E-mail é obrigatório';
    } else if (!isValidEmail(email)) {
      newErrors.email = 'E-mail em formato inválido';
    }
    if (!password || password.length < 6) newErrors.password = 'Senha deve ter no mínimo 6 caracteres';
    if (whatsapp.replace(/\D/g, "").length < 10) newErrors.whatsapp = 'WhatsApp inválido';
    if (!profession) newErrors.profession = 'Profissão é obrigatória';
    if (!city) newErrors.city = 'Cidade é obrigatória';
    if (!workRadius) newErrors.workRadius = 'Raio de atuação é obrigatório';
    
    if (cnpjCpf) {
      const plain = cnpjCpf.replace(/\D/g, "");
      if (plain.length !== 11 && plain.length !== 14) {
        newErrors.cnpjCpf = 'CPF/CNPJ inválido';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleRegister = async () => {
    if (!validateForm()) {
      Alert.alert('Atenção', 'Verifique os campos em vermelho.');
      return;
    }

    setLoading(true);
    try {
      const isOuro = cnpjCpf.replace(/\D/g, "").length === 14;
      
      // 1. Criar conta no Supabase Auth com MetaDados
      // Enviar os dados do formulário via 'options.data' evita conflitos de RLS 
      // para contas não confirmadas.
      const redirectUrl = Linking.createURL('/');

      const { data, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: redirectUrl,
          data: {
            name,
            whatsapp: whatsapp.replace(/\D/g, ""),
            profession,
            cnpj_cpf: cnpjCpf.replace(/\D/g, ""),
            city,
            work_radius: parseInt(workRadius) || 0,
            is_ouro: isOuro
          }
        }
      });

      if (authError) throw authError;

      // 2. Animar a abertura do Modal de E-mail
      setIsEmailModalVisible(true);
      Animated.spring(emailModalScale, {
        toValue: 1,
        friction: 6,
        tension: 40,
        useNativeDriver: true,
      }).start();

    } catch (err: any) {
      console.error("Signup error:", err);
      Alert.alert('Erro no Cadastro', err.message || 'Ocorreu um erro ao salvar seus dados.');
    } finally {
      setLoading(false);
    }
  };

  const closeEmailModal = () => {
    Animated.timing(emailModalScale, {
      toValue: 0,
      duration: 200,
      useNativeDriver: true,
    }).start(() => {
      setIsEmailModalVisible(false);
      // Redireciona o usuário para o início (Welcome)
      // @ts-ignore - Ignore navigation typing for MVP
      navigation?.navigate('Welcome');
    });
  };

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'} 
      style={styles.container}
    >
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        
        <View style={styles.header}>
          <MaterialIcons name="work-outline" size={48} color="#0056b3" />
          <Text style={styles.title}>QualyJobs Prestador</Text>
          <Text style={styles.subtitle}>Junte-se à nossa rede e receba serviços diretamente no seu celular.</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Dados de Acesso</Text>
          
          <View style={[styles.inputContainer, errors.email && styles.inputErrorBorder]}>
            <MaterialIcons name="email" size={20} color="#666" style={styles.inputIcon} />
            <TextInput style={styles.input} placeholder="E-mail *" keyboardType="email-address" autoCapitalize="none" value={email} onChangeText={(t) => {setEmail(t); setErrors({...errors, email: ''})}} />
          </View>
          {!!errors.email && <Text style={styles.errorText}>{errors.email}</Text>}

          <View style={[styles.inputContainer, errors.password && styles.inputErrorBorder]}>
            <MaterialIcons name="lock" size={20} color="#666" style={styles.inputIcon} />
            <TextInput style={styles.input} placeholder="Senha (Mín. 6 caracteres) *" secureTextEntry value={password} onChangeText={(t) => {setPassword(t); setErrors({...errors, password: ''})}} />
          </View>
          {!!errors.password && <Text style={styles.errorText}>{errors.password}</Text>}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Dados Pessoais & Contato</Text>
          
          <View style={[styles.inputContainer, errors.name && styles.inputErrorBorder]}>
            <MaterialIcons name="person" size={20} color="#666" style={styles.inputIcon} />
            <TextInput style={styles.input} placeholder="Nome Completo *" value={name} onChangeText={(t) => {setName(t); setErrors({...errors, name: ''})}} />
          </View>
          {!!errors.name && <Text style={styles.errorText}>{errors.name}</Text>}

          <View style={[styles.inputContainer, errors.whatsapp && styles.inputErrorBorder]}>
            <MaterialIcons name="phone" size={20} color="#666" style={styles.inputIcon} />
            <TextInput style={styles.input} placeholder="WhatsApp *" keyboardType="phone-pad" value={whatsapp} onChangeText={(t) => {setWhatsapp(maskPhone(t)); setErrors({...errors, whatsapp: ''})}} />
          </View>
          {!!errors.whatsapp && <Text style={styles.errorText}>{errors.whatsapp}</Text>}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Atuação Profissional</Text>
          
          <View style={[styles.inputContainer, errors.profession && styles.inputErrorBorder]}>
            <MaterialIcons name="handyman" size={20} color="#666" style={styles.inputIcon} />
            <TextInput style={styles.input} placeholder="Profissão Principal *" value={profession} onChangeText={(t) => {setProfession(t); setErrors({...errors, profession: ''})}} />
          </View>
          {!!errors.profession && <Text style={styles.errorText}>{errors.profession}</Text>}

          <View style={[styles.inputContainer, errors.cnpjCpf && styles.inputErrorBorder]}>
            <MaterialIcons name="badge" size={20} color="#666" style={styles.inputIcon} />
            <TextInput style={styles.input} placeholder="CPF ou CNPJ (Opcional)" keyboardType="numeric" value={cnpjCpf} onChangeText={(t) => {setCnpjCpf(maskCpfCnpj(t)); setErrors({...errors, cnpjCpf: ''})}} />
          </View>
          {!!errors.cnpjCpf && <Text style={styles.errorText}>{errors.cnpjCpf}</Text>}

          <View style={styles.row}>
            <View style={{ flex: 2, marginRight: 8 }}>
              <View style={[styles.inputContainer, errors.city && styles.inputErrorBorder]}>
                <MaterialIcons name="location-city" size={20} color="#666" style={styles.inputIcon} />
                <TextInput style={styles.input} placeholder="Cidade/Estado *" value={city} onChangeText={(t) => {setCity(t); setErrors({...errors, city: ''})}} />
              </View>
              {!!errors.city && <Text style={styles.errorText}>{errors.city}</Text>}
            </View>
            <View style={{ flex: 1 }}>
              <View style={[styles.inputContainer, errors.workRadius && styles.inputErrorBorder]}>
                <MaterialIcons name="radar" size={20} color="#666" style={styles.inputIcon} />
                <TextInput style={styles.input} placeholder="Raio (km) *" keyboardType="numeric" value={workRadius} onChangeText={(t) => {setWorkRadius(t); setErrors({...errors, workRadius: ''})}} />
              </View>
              {!!errors.workRadius && <Text style={styles.errorText}>{errors.workRadius}</Text>}
            </View>
          </View>
        </View>

        {/* Termos de Uso */}
        <View style={styles.termsContainer}>
          <Checkbox
            value={termsAccepted}
            onValueChange={setTermsAccepted}
            color={termsAccepted ? '#0056b3' : undefined}
            style={styles.checkbox}
          />
          <Text style={styles.termsText}>
            Li e concordo com os{' '}
            <Text style={styles.linkText} onPress={() => setIsTermsModalVisible(true)}>
              Termos de Uso e Política de Privacidade
            </Text>.
          </Text>
        </View>

        <TouchableOpacity 
          style={[styles.button, (!termsAccepted || loading) && styles.buttonDisabled]} 
          onPress={handleRegister}
          disabled={!termsAccepted || loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>Cadastrar</Text>
          )}
        </TouchableOpacity>

      </ScrollView>

      {/* Modal de Termos de Uso */}
      <Modal visible={isTermsModalVisible} animationType="slide" presentationStyle="pageSheet">
        <View style={styles.modalContainer}>
          <Text style={styles.modalTitle}>Termos e Condições</Text>
          <ScrollView style={styles.modalScroll}>
            <Text style={styles.modalText}>
              1. Aceitação dos Termos: Ao usar o QualyJobs, você concorda com nossas regras.{"\n\n"}
              2. Responsabilidade do Prestador: Você é responsável pelos serviços que aceita e executa.{"\n\n"}
              3. Uso de Dados: Seus dados (E-mail, WhatsApp, Cidade) serão usados apenas para a prestação do serviço.{"\n\n"}
              [Texto completo estaria hospedado aqui ou no site da empresa...]
            </Text>
          </ScrollView>
          <TouchableOpacity style={styles.closeModalButton} onPress={() => setIsTermsModalVisible(false)}>
            <Text style={styles.closeModalText}>Fechar e Voltar</Text>
          </TouchableOpacity>
        </View>
      </Modal>

      {/* Modal de E-mail Enviado */}
      <Modal visible={isEmailModalVisible} transparent animationType="fade">
        <View style={styles.emailModalOverlay}>
          <Animated.View style={[styles.emailModalContent, { transform: [{ scale: emailModalScale }] }]}>
            <View style={styles.iconCircle}>
              <MaterialIcons name="mark-email-unread" size={48} color="#fff" />
            </View>
            <Text style={styles.emailModalTitle}>Falta Pouco!</Text>
            <Text style={styles.emailModalText}>
              Enviamos um link de confirmação para o seu e-mail:{'\n'}
              <Text style={styles.emailHighlight}>{email}</Text>
            </Text>
            <Text style={styles.emailModalSubtext}>
              Abra sua caixa de entrada (ou lixo eletrônico) e clique no link para ativar sua conta e acessar o aplicativo.
            </Text>
            <TouchableOpacity style={styles.emailModalButton} onPress={closeEmailModal}>
              <Text style={styles.emailModalButtonText}>Entendi, vou conferir!</Text>
            </TouchableOpacity>
          </Animated.View>
        </View>
      </Modal>

    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  scrollContent: {
    padding: 24,
    paddingTop: 60,
    paddingBottom: 40,
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#0056b3',
    marginTop: 16,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 15,
    color: '#666',
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 22,
  },
  section: {
    marginBottom: 24,
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f7fa',
    borderWidth: 1,
    borderColor: '#e4e8ec',
    borderRadius: 12,
    marginBottom: 4,
    paddingHorizontal: 12,
  },
  inputErrorBorder: {
    borderColor: '#d32f2f',
  },
  errorText: {
    color: '#d32f2f',
    fontSize: 12,
    marginBottom: 12,
    marginLeft: 4,
  },
  inputIcon: {
    marginRight: 8,
  },
  input: {
    flex: 1,
    paddingVertical: 14,
    fontSize: 15,
    color: '#333',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  termsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
    paddingHorizontal: 8,
  },
  checkbox: {
    marginRight: 12,
    borderRadius: 4,
  },
  termsText: {
    flex: 1,
    fontSize: 14,
    color: '#555',
    lineHeight: 20,
  },
  linkText: {
    color: '#0056b3',
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
  button: {
    backgroundColor: '#0056b3',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#0056b3',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  buttonDisabled: {
    backgroundColor: '#b0c4de',
    shadowOpacity: 0,
    elevation: 0,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 24,
    paddingTop: 60,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
    textAlign: 'center',
  },
  modalScroll: {
    flex: 1,
    marginBottom: 24,
  },
  modalText: {
    fontSize: 15,
    color: '#444',
    lineHeight: 24,
  },
  closeModalButton: {
    backgroundColor: '#333',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 20,
  },
  closeModalText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  // EMAIL MODAL STYLES
  emailModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  emailModalContent: {
    backgroundColor: '#fff',
    borderRadius: 24,
    padding: 32,
    alignItems: 'center',
    width: '100%',
    maxWidth: 400,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 10,
  },
  iconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#0056b3',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  emailModalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  emailModalText: {
    fontSize: 16,
    color: '#444',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 16,
  },
  emailHighlight: {
    fontWeight: 'bold',
    color: '#0056b3',
  },
  emailModalSubtext: {
    fontSize: 14,
    color: '#777',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 32,
  },
  emailModalButton: {
    backgroundColor: '#0056b3',
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 12,
    width: '100%',
    alignItems: 'center',
  },
  emailModalButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

