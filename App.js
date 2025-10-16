import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { View, ActivityIndicator, Text } from 'react-native';

// Import our screens
import HomeScreen from './src/screens/HomeScreen';
import ProgressScreen from './src/screens/ProgressScreen';
import ChatScreen from './src/screens/ChatScreen';
import ProfileScreen from './src/screens/ProfileScreen';
import AuthScreen from './src/screens/AuthScreen';

// Import auth context
import { AuthProvider, useAuth } from './src/contexts/AuthContext';

// Create the tab navigator
const Tab = createBottomTabNavigator();

// Main App Navigator Component
function AppNavigator() {
  const { user, loading } = useAuth();

  // Debug logging
  console.log('AppNavigator render - user:', user ? 'logged in' : 'not logged in', 'loading:', loading);

  // Show loading screen while checking auth status
  if (loading) {
    console.log('Showing loading screen');
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F8FAFC' }}>
        <ActivityIndicator size="large" color="#4F46E5" />
        <Text style={{ marginTop: 16, fontSize: 16, color: '#6B7280' }}>Loading...</Text>
      </View>
    );
  }

  // Show auth screen if user is not logged in
  if (!user) {
    console.log('Showing auth screen - no user');
    return <AuthScreen />;
  }

  console.log('Showing main app - user is logged in');

  // Show main app if user is logged in
  return (
    <NavigationContainer>
      <StatusBar style="auto" />
      <Tab.Navigator
        screenOptions={({ route }) => ({
          tabBarIcon: ({ focused, color, size }) => {
            let iconName;

            if (route.name === 'Home') {
              iconName = focused ? 'home' : 'home-outline';
            } else if (route.name === 'Progress') {
              iconName = focused ? 'bar-chart' : 'bar-chart-outline';
            } else if (route.name === 'Chat') {
              iconName = focused ? 'bulb' : 'bulb-outline';
            } else if (route.name === 'Profile') {
              iconName = focused ? 'person' : 'person-outline';
            }

            return <Ionicons name={iconName} size={size} color={color} />;
          },
          tabBarActiveTintColor: '#4F46E5',
          tabBarInactiveTintColor: 'gray',
          headerStyle: {
            backgroundColor: '#4F46E5',
          },
          headerTintColor: '#fff',
          headerTitleStyle: {
            fontWeight: 'bold',
          },
        })}
      >
        <Tab.Screen 
          name="Home" 
          component={HomeScreen} 
          options={{ title: 'StrideCoach' }}
        />
        <Tab.Screen 
          name="Progress" 
          component={ProgressScreen} 
          options={{ title: 'Progress' }}
        />
        <Tab.Screen 
          name="Chat" 
          component={ChatScreen} 
          options={{ title: 'AI Coach' }}
        />
        <Tab.Screen 
          name="Profile" 
          component={ProfileScreen} 
          options={{ title: 'Profile' }}
        />
      </Tab.Navigator>
    </NavigationContainer>
  );
}

// Main App Component with Auth Provider
export default function App() {
  return (
    <AuthProvider>
      <AppNavigator />
    </AuthProvider>
  );
}
