import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, Animated } from 'react-native';

interface CallModalProps {
  visible: boolean;
  serviceDetails: any;
  onAccept: () => void;
  onReject: () => void;
}

export const CallModal: React.FC<CallModalProps> = ({ visible, serviceDetails, onAccept, onReject }) => {
  const [timeLeft, setTimeLeft] = useState(15);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (visible) {
      setTimeLeft(15);
      timer = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            onReject(); // Auto-reject when timer hits 0
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [visible]);

  if (!visible) return null;

  return (
    <Modal transparent animationType="slide" visible={visible}>
      <View style={styles.overlay}>
        <View style={styles.container}>
          <Text style={styles.title}>Nova Chamada!</Text>
          
          <View style={styles.detailsContainer}>
            <Text style={styles.serviceType}>{serviceDetails?.type || 'Serviço Geral'}</Text>
            <Text style={styles.address}>{serviceDetails?.address || 'Endereço não informado'}</Text>
            <Text style={styles.price}>R$ {serviceDetails?.price?.toFixed(2) || '0.00'}</Text>
          </View>

          <Text style={styles.timerText}>Tempo restante: {timeLeft}s</Text>

          <View style={styles.buttonContainer}>
            <TouchableOpacity style={[styles.button, styles.rejectButton]} onPress={onReject}>
              <Text style={styles.buttonText}>Recusar</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.button, styles.acceptButton]} onPress={onAccept}>
              <Text style={styles.buttonText}>Aceitar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  container: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 24,
    minHeight: 300,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
    textAlign: 'center',
  },
  detailsContainer: {
    backgroundColor: '#f5f5f5',
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
  },
  serviceType: {
    fontSize: 18,
    fontWeight: '600',
    color: '#222',
  },
  address: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  price: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#4CAF50',
    marginTop: 12,
  },
  timerText: {
    textAlign: 'center',
    color: '#d32f2f',
    fontWeight: 'bold',
    fontSize: 16,
    marginBottom: 20,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  button: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    marginHorizontal: 8,
  },
  rejectButton: {
    backgroundColor: '#ffebee',
    borderWidth: 1,
    borderColor: '#ef5350',
  },
  acceptButton: {
    backgroundColor: '#4CAF50',
  },
  buttonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
});
