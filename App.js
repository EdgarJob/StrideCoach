import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { View, ActivityIndicator, Text, Animated } from 'react-native';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFonts, Sora_400Regular, Sora_600SemiBold, Sora_700Bold, Sora_800ExtraBold } from '@expo-google-fonts/sora';
import { LinearGradient } from 'expo-linear-gradient';

// Import our screens
import HomeScreen from './src/screens/HomeScreen';
import ProgressScreen from './src/screens/ProgressScreen';
import PlansScreen from './src/screens/PlansScreen';
import ChatScreen from './src/screens/ChatScreen';
import ProfileScreen from './src/screens/ProfileScreen';
import AuthScreen from './src/screens/AuthScreen';

// Import contexts
import { AuthProvider, useAuth } from './src/contexts/AuthContext';
import { AICoachProvider } from './src/contexts/AICoachContext';
import { PlanProvider } from './src/contexts/PlanContext';
import { HealthProvider } from './src/contexts/HealthContext';
import colors from './src/theme/colors';
import { fonts } from './src/theme/typography';

// Create the tab navigator
const Tab = createBottomTabNavigator();

// Main App Navigator Component
function AppNavigator() {
  const { user, loading } = useAuth();
  const insets = useSafeAreaInsets();
  const tabBarHeight = 68 + insets.bottom;

  // Show loading screen while checking auth status
  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F8FAFC' }}>
        <ActivityIndicator size="large" color="#5AB3C1" />
        <Text style={{ marginTop: 16, fontSize: 16, color: '#6B7280' }}>Loading...</Text>
      </View>
    );
  }

  // Show auth screen if user is not logged in
  if (!user) {
    return <AuthScreen />;
  }

  // Show main app if user is logged in
  return (
    <NavigationContainer>
      <StatusBar style="dark" />
      <Tab.Navigator
        screenOptions={({ route }) => ({
          headerShown: false,
          tabBarIcon: ({ focused, color, size }) => {
            const scaleValue = React.useRef(new Animated.Value(focused ? 1 : 0.9)).current;
            const opacityValue = React.useRef(new Animated.Value(focused ? 1 : 0)).current;

            React.useEffect(() => {
              Animated.parallel([
                Animated.spring(scaleValue, {
                  toValue: focused ? 1 : 0.9,
                  friction: 5,
                  tension: 100,
                  useNativeDriver: true,
                }),
                Animated.timing(opacityValue, {
                  toValue: focused ? 1 : 0,
                  duration: 200,
                  useNativeDriver: true,
                }),
              ]).start();
            }, [focused]);

            let iconName;
            let iconSize = focused ? 28 : 24;

            if (route.name === 'Home') {
              iconName = focused ? 'home' : 'home-outline';
            } else if (route.name === 'Plans') {
              iconName = focused ? 'calendar' : 'calendar-outline';
            } else if (route.name === 'Progress') {
              iconName = focused ? 'trending-up' : 'trending-up-outline';
            } else if (route.name === 'Chat') {
              iconName = focused ? 'chatbubbles' : 'chatbubbles-outline';
            } else if (route.name === 'Profile') {
              iconName = focused ? 'person-circle' : 'person-circle-outline';
            }

            return (
              <View style={{ alignItems: 'center', justifyContent: 'center' }}>
                <Animated.View
                  style={{
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: 52,
                    height: 36,
                    borderRadius: 18,
                    backgroundColor: focused ? 'rgba(252, 76, 2, 0.10)' : 'transparent',
                    borderWidth: focused ? 1 : 0,
                    borderColor: focused ? 'rgba(252, 76, 2, 0.18)' : 'transparent',
                    transform: [{ scale: scaleValue }],
                  }}
                >
                  <Ionicons name={iconName} size={iconSize} color={color} />
                </Animated.View>
                <Animated.View
                  style={{
                    marginTop: 6,
                    width: 6,
                    height: 6,
                    borderRadius: 3,
                    backgroundColor: colors.accent,
                    opacity: opacityValue,
                    transform: [
                      {
                        scale: opacityValue.interpolate({
                          inputRange: [0, 1],
                          outputRange: [0.6, 1],
                        }),
                      },
                    ],
                  }}
                />
              </View>
            );
          },
          tabBarActiveTintColor: colors.textDark,
          tabBarInactiveTintColor: colors.textLight,
          tabBarHideOnKeyboard: true,
          tabBarStyle: {
            height: tabBarHeight,
            paddingBottom: Math.max(12, insets.bottom + 10),
            paddingTop: 10,
            borderTopWidth: 0,
            backgroundColor: 'transparent',
            shadowColor: '#0B1220',
            shadowOffset: { width: 0, height: -10 },
            shadowOpacity: 0.12,
            shadowRadius: 24,
            elevation: 16,
          },
          tabBarBackground: () => (
            <LinearGradient
              colors={['rgba(255, 255, 255, 0.94)', 'rgba(243, 246, 250, 0.94)']}
              start={{ x: 0.12, y: 0 }}
              end={{ x: 0.9, y: 1 }}
              style={{
                flex: 1,
                borderTopLeftRadius: 28,
                borderTopRightRadius: 28,
                borderTopWidth: 1,
                borderColor: colors.borderLight,
              }}
            />
          ),
          tabBarItemStyle: {
            paddingTop: 2,
          },
          tabBarLabelStyle: {
            fontSize: 10,
            marginTop: 2,
            fontFamily: fonts.emphasis,
            fontWeight: 'normal',
          },
          // Smooth screen transitions
          animation: 'shift',
          animationDuration: 300,
        })}
      >
        <Tab.Screen 
          name="Home" 
          component={HomeScreen} 
          options={{ 
            headerShown: false,
            tabBarLabel: 'Home',
          }}
        />
        <Tab.Screen 
          name="Plans" 
          component={PlansScreen} 
          options={{ 
            title: 'Plans',
            tabBarLabel: 'Plans',
          }}
        />
        <Tab.Screen 
          name="Progress" 
          component={ProgressScreen} 
          options={{ 
            title: 'Progress',
            tabBarLabel: 'Progress',
          }}
        />
        <Tab.Screen 
          name="Chat" 
          component={ChatScreen} 
          options={{ 
            title: 'AI Coach',
            tabBarLabel: 'AI Coach',
          }}
        />
        <Tab.Screen 
          name="Profile" 
          component={ProfileScreen} 
          options={{ 
            title: 'Profile',
            tabBarLabel: 'Profile',
          }}
        />
      </Tab.Navigator>
    </NavigationContainer>
  );
}

// Main App Component with Providers
export default function App() {
  const [fontsLoaded] = useFonts({
    Sora_400Regular,
    Sora_600SemiBold,
    Sora_700Bold,
    Sora_800ExtraBold,
  });

  if (!fontsLoaded) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background }}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={{ marginTop: 12, fontSize: 14, color: colors.textMedium, fontFamily: fonts.emphasis }}>Loading...</Text>
      </View>
    );
  }

  return (
    <SafeAreaProvider>
      <AuthProvider>
        <HealthProvider>
          <PlanProvider>
            <AICoachProvider>
              <AppNavigator />
            </AICoachProvider>
          </PlanProvider>
        </HealthProvider>
      </AuthProvider>
    </SafeAreaProvider>
  );
}
