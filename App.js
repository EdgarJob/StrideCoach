import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { View, ActivityIndicator, Text, Animated } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useFonts, Sora_400Regular, Sora_600SemiBold, Sora_700Bold, Sora_800ExtraBold } from '@expo-google-fonts/sora';

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

const TAB_ICON_MAP = {
  Home: { active: 'home', inactive: 'home-outline' },
  Plans: { active: 'calendar', inactive: 'calendar-outline' },
  Progress: { active: 'trending-up', inactive: 'trending-up-outline' },
  Chat: { active: 'chatbubbles', inactive: 'chatbubbles-outline' },
  Profile: { active: 'person', inactive: 'person-outline' },
};

function TabIcon({ routeName, focused, color }) {
  const scaleValue = React.useRef(new Animated.Value(focused ? 1 : 0.92)).current;

  React.useEffect(() => {
    Animated.spring(scaleValue, {
      toValue: focused ? 1 : 0.92,
      friction: 7,
      tension: 120,
      useNativeDriver: true,
    }).start();
  }, [focused]);

  const iconSpec = TAB_ICON_MAP[routeName] || { active: 'ellipse', inactive: 'ellipse-outline' };
  const iconName = focused ? iconSpec.active : iconSpec.inactive;
  const iconSize = focused ? 26 : 24;

  return (
    <Animated.View
      style={{
        alignItems: 'center',
        justifyContent: 'center',
        transform: [{ scale: scaleValue }],
      }}
    >
      <Ionicons name={iconName} size={iconSize} color={color} />
    </Animated.View>
  );
}

function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarIcon: ({ focused, color }) => (
          <TabIcon routeName={route.name} focused={focused} color={color} />
        ),
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: '#8E8E93',
        tabBarHideOnKeyboard: true,
        tabBarStyle: {
          height: 60,
          paddingTop: 8,
          paddingBottom: 8,
          backgroundColor: '#FFFFFF',
          borderTopWidth: 0.5,
          borderTopColor: '#E5E5EA',
          elevation: 0,
          shadowOpacity: 0,
        },
        tabBarItemStyle: {
          paddingTop: 2,
        },
        tabBarLabelStyle: {
          fontSize: 10,
          marginTop: 2,
          fontFamily: fonts.emphasis,
          fontWeight: 'normal',
        },
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
  );
}

// Main App Navigator Component
function AppNavigator() {
  const { user, loading, passwordRecovery } = useAuth();

  // Show loading screen while checking auth status
  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#FFFFFF' }}>
        <ActivityIndicator size="large" color="#5AB3C1" />
        <Text style={{ marginTop: 16, fontSize: 16, color: '#6B7280' }}>Loading...</Text>
      </View>
    );
  }

  // Show auth screen if user is not logged in
  if (!user || passwordRecovery) {
    return <AuthScreen />;
  }

  // Show main app if user is logged in
  return (
    <NavigationContainer>
      <StatusBar style="dark" />
      <MainTabs />
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
