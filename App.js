import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { View, ActivityIndicator, Text, Animated, Platform, StyleSheet } from 'react-native';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFonts, Sora_400Regular, Sora_600SemiBold, Sora_700Bold, Sora_800ExtraBold } from '@expo-google-fonts/sora';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';

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
  // Use thicker icons here; the circle-outline can look too faint at small sizes.
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
    <View style={{ alignItems: 'center', justifyContent: 'center' }}>
      <Animated.View
        style={{
          alignItems: 'center',
          justifyContent: 'center',
          width: 52,
          height: 36,
          borderRadius: 18,
          backgroundColor: focused ? 'rgba(255, 255, 255, 0.08)' : 'transparent',
          borderWidth: focused ? 1 : 0,
          borderColor: focused ? 'rgba(255, 255, 255, 0.12)' : 'transparent',
          transform: [{ scale: scaleValue }],
        }}
      >
        <Ionicons name={iconName} size={iconSize} color={color} />
      </Animated.View>
    </View>
  );
}

// Main App Navigator Component
function AppNavigator() {
  const { user, loading } = useAuth();
  const insets = useSafeAreaInsets();
  // Floating Apple Music-like pill above the home indicator.
  const tabBarBottom = Math.max(insets.bottom, 10);
  const tabBarHeight = 68;
  const scenePaddingBottom = tabBarBottom + tabBarHeight + 12;

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
        detachInactiveScreens={false}
        lazy={false}
        sceneContainerStyle={{ backgroundColor: 'transparent', paddingBottom: scenePaddingBottom }}
        screenOptions={({ route }) => ({
          headerShown: false,
          tabBarIcon: ({ focused, color }) => (
            <TabIcon routeName={route.name} focused={focused} color={color} />
          ),
          tabBarActiveTintColor: colors.accent,
          tabBarInactiveTintColor: 'rgba(255, 255, 255, 0.86)',
          tabBarHideOnKeyboard: true,
          tabBarStyle: {
            position: 'absolute',
            left: 14,
            right: 14,
            bottom: tabBarBottom,
            height: tabBarHeight,
            paddingTop: 10,
            paddingBottom: 10,
            borderRadius: 24,
            overflow: 'hidden',
            borderWidth: 1,
            borderColor: 'rgba(255, 255, 255, 0.14)',
            // Charcoal instead of near-black: closer to Apple Music while keeping contrast.
            backgroundColor: 'rgba(28, 28, 30, 0.78)',
            shadowColor: '#0B1220',
            shadowOffset: { width: 0, height: 18 },
            shadowOpacity: 0.28,
            shadowRadius: 26,
            elevation: 24,
          },
          tabBarBackground: () => (
            <View pointerEvents="none" style={StyleSheet.absoluteFill}>
              {Platform.OS !== 'web' ? (
                <BlurView tint="dark" intensity={40} style={StyleSheet.absoluteFill} />
              ) : null}

              {/* Keep it dark even over white screens; blur alone can wash out. */}
              <View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(28, 28, 30, 0.56)' }]} />

              {/* Subtle depth + brand hint (no bright fade on the right). */}
              <LinearGradient
                colors={[
                  'rgba(255, 255, 255, 0.10)',
                  'rgba(255, 255, 255, 0.04)',
                  'rgba(0, 0, 0, 0.22)',
                ]}
                locations={[0, 0.55, 1]}
                start={{ x: 0.5, y: 0 }}
                end={{ x: 0.5, y: 1 }}
                style={StyleSheet.absoluteFill}
              />
              <LinearGradient
                colors={[
                  'rgba(90, 179, 193, 0.14)',
                  'rgba(11, 18, 32, 0.0)',
                  'rgba(11, 18, 32, 0.0)',
                ]}
                locations={[0, 0.7, 1]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={StyleSheet.absoluteFill}
              />

              <View style={styles.tabBarHairline} />
            </View>
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

const styles = StyleSheet.create({
  tabBarHairline: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.10)',
  },
});
