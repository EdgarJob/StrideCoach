import React from 'react';
import { Animated, Easing, Platform } from 'react-native';

const TabBarMotionContext = React.createContext(null);

const useNativeDriver = Platform.OS !== 'web';

export function TabBarMotionProvider({
  children,
  hideDistance = 96,
  visibleScenePaddingBottom = 120,
  hiddenScenePaddingBottom = 24,
}) {
  const translateY = React.useRef(new Animated.Value(0)).current;
  const opacity = React.useMemo(
    () =>
      translateY.interpolate({
        inputRange: [0, hideDistance * 0.6, hideDistance],
        outputRange: [1, 0.55, 0],
        extrapolate: 'clamp',
      }),
    [hideDistance, translateY]
  );

  const [scenePaddingBottom, setScenePaddingBottom] = React.useState(visibleScenePaddingBottom);

  const hiddenRef = React.useRef(false);
  const lastToggleMsRef = React.useRef(0);

  const stop = React.useCallback(() => {
    translateY.stopAnimation();
  }, [translateY]);

  const show = React.useCallback(() => {
    if (!hiddenRef.current) return;

    hiddenRef.current = false;
    lastToggleMsRef.current = Date.now();
    setScenePaddingBottom(visibleScenePaddingBottom);

    stop();
    Animated.spring(translateY, {
      toValue: 0,
      useNativeDriver,
      friction: 9,
      tension: 120,
    }).start();
  }, [setScenePaddingBottom, stop, translateY, visibleScenePaddingBottom]);

  const hide = React.useCallback(() => {
    if (hiddenRef.current) return;

    hiddenRef.current = true;
    lastToggleMsRef.current = Date.now();

    stop();
    Animated.timing(translateY, {
      toValue: hideDistance,
      duration: 220,
      easing: Easing.out(Easing.cubic),
      useNativeDriver,
    }).start(({ finished }) => {
      if (finished && hiddenRef.current) {
        setScenePaddingBottom(hiddenScenePaddingBottom);
      }
    });
  }, [hideDistance, hiddenScenePaddingBottom, setScenePaddingBottom, stop, translateY]);

  // Scroll-driven show/hide (Apple Music-like):
  // - Scroll down: hide
  // - Scroll up: show
  // - At/near top: force show
  const isDraggingRef = React.useRef(false);
  const isMomentumRef = React.useRef(false);
  const lastYRef = React.useRef(0);
  const lastUserDragMsRef = React.useRef(0);

  const onScrollBeginDrag = React.useCallback((y) => {
    isDraggingRef.current = true;
    lastUserDragMsRef.current = Date.now();
    lastYRef.current = y;
  }, []);

  const onScrollEndDrag = React.useCallback(() => {
    isDraggingRef.current = false;
  }, []);

  const onMomentumScrollBegin = React.useCallback(() => {
    // Prevent programmatic scroll animations (e.g. scrollToEnd in chat) from hiding the bar.
    if (Date.now() - lastUserDragMsRef.current > 650) return;
    isMomentumRef.current = true;
  }, []);

  const onMomentumScrollEnd = React.useCallback(() => {
    isMomentumRef.current = false;
  }, []);

  const onScroll = React.useCallback(
    (y) => {
      if (!(isDraggingRef.current || isMomentumRef.current)) return;

      const dy = y - lastYRef.current;
      lastYRef.current = y;

      // Always show at the very top.
      if (y <= 4) {
        show();
        return;
      }

      // Ignore tiny jitter/bounce.
      if (Math.abs(dy) < 2) return;

      const now = Date.now();
      if (now - lastToggleMsRef.current < 220) return;

      // Only start hiding after a small scroll so it doesn't flicker near the top.
      if (dy > 0 && y > 24) {
        hide();
      } else if (dy < 0) {
        show();
      }
    },
    [hide, show]
  );

  const value = React.useMemo(
    () => ({
      translateY,
      opacity,
      scenePaddingBottom,
      show,
      hide,
      onScroll,
      onScrollBeginDrag,
      onScrollEndDrag,
      onMomentumScrollBegin,
      onMomentumScrollEnd,
      // Useful for one-off consumers (e.g. debug or future tweaks)
      _unsafe_hiddenRef: hiddenRef,
    }),
    [
      hide,
      onMomentumScrollBegin,
      onMomentumScrollEnd,
      onScroll,
      onScrollBeginDrag,
      onScrollEndDrag,
      opacity,
      scenePaddingBottom,
      show,
      translateY,
    ]
  );

  return <TabBarMotionContext.Provider value={value}>{children}</TabBarMotionContext.Provider>;
}

export function useTabBarMotion() {
  const ctx = React.useContext(TabBarMotionContext);
  if (!ctx) {
    throw new Error('useTabBarMotion must be used within a TabBarMotionProvider');
  }
  return ctx;
}
