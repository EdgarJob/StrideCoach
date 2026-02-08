import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import colors from '../theme/colors';

/**
 * CircularProgress Component
 * 
 * What it does:
 * - Displays a circular progress indicator with percentage
 * - Shows animated progress filling from 0% to 100%
 * - Customizable colors and size
 * 
 * Why it's built this way:
 * - Uses SVG for smooth, scalable circular progress
 * - Provides visual feedback with percentage text
 * - More engaging than a simple spinner
 * 
 * How it fits in:
 * - Used in plan generation modal to show progress
 * - Makes the loading experience more interactive
 */
export default function CircularProgress({ 
  progress = 0, 
  size = 120, 
  strokeWidth = 8,
  color = colors.primary,
  backgroundColor = colors.border,
  showPercentage = true 
}) {
  const [animatedProgress, setAnimatedProgress] = useState(0);
  
  useEffect(() => {
    const timer = setTimeout(() => {
      setAnimatedProgress(progress);
    }, 100);
    
    return () => clearTimeout(timer);
  }, [progress]);

  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const strokeDasharray = circumference;
  const strokeDashoffset = circumference - (animatedProgress / 100) * circumference;

  return (
    <View style={[styles.container, { width: size, height: size }]}>
      <Svg width={size} height={size} style={styles.svg}>
        {/* Background circle */}
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={backgroundColor}
          strokeWidth={strokeWidth}
          fill="none"
        />
        {/* Progress circle */}
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={color}
          strokeWidth={strokeWidth}
          fill="none"
          strokeDasharray={strokeDasharray}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </Svg>
      
      {showPercentage && (
        <View style={styles.percentageContainer}>
          <Text style={[styles.percentageText, { fontSize: size * 0.2 }]}>
            {Math.round(animatedProgress)}%
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  svg: {
    position: 'absolute',
  },
  percentageContainer: {
    position: 'absolute',
    justifyContent: 'center',
    alignItems: 'center',
  },
  percentageText: {
    fontWeight: '700',
    color: colors.textDark,
    ...Platform.select({
      web: { textShadow: `0px 1px 2px ${colors.shadow}` },
      default: {},
    }),
  },
});
