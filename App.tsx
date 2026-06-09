// [ROUTER] Core Navigation imports
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

// [UI_COMPONENTS] Status Bar and UI Basics
import { StatusBar } from 'expo-status-bar';
import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text } from 'react-native';

// [ROUTER] Screens
import { WelcomeScreen } from './src/screens/WelcomeScreen';
import { LoginScreen } from './src/screens/LoginScreen'; // This acts as our Register screen
import { MainTabs } from './src/navigation/MainTabs';

// [AUTH_LOGIC] Supabase Auth Session
import { supabase } from './src/services/supabase';
import { Session } from '@supabase/supabase-js';

const Stack = createNativeStackNavigator();

export default function App() {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  // [AUTH_LOGIC] Setup Auth State Listener on app start
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });

    supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });
  }, []);

  if (loading) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <Text>Carregando QualyJobs...</Text>
      </View>
    );
  }

  // [ROUTER] Conditional Stack rendering (Protected Routes pattern)
  return (
    <NavigationContainer>
      <StatusBar style="auto" />
      <Stack.Navigator>
        {session && session.user ? (
          // Logged In Stack
          <Stack.Screen 
            name="MainTabs" 
            component={MainTabs} 
            options={{ headerShown: false }}
          />
        ) : (
          // Logged Out Stack
          <>
            <Stack.Screen 
              name="Welcome" 
              component={WelcomeScreen} 
              options={{ headerShown: false }} 
            />
            <Stack.Screen 
              name="Register" 
              component={LoginScreen} 
              options={{ title: 'Criar Conta', headerBackTitle: 'Voltar' }} 
            />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
});

