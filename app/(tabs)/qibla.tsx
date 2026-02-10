import React, { useEffect, useRef } from 'react';
import {
  StyleSheet,
  View,
  Text,
  Dimensions,
  ActivityIndicator,
  Animated,
  Easing,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useColorScheme } from '@/components/useColorScheme';
import Colors from '@/constants/Colors';
import { useQiblaDirection } from '@/hooks/useQiblaDirection';

const { width } = Dimensions.get('window');
const COMPASS_SIZE = width * 0.85;
const COMPASS_RADIUS = COMPASS_SIZE / 2;

const DEGREE_MARKS = 72; // Every 5 degrees
const CARDINAL_DIRS = [
  { label: 'N', deg: 0 },
  { label: 'NE', deg: 45 },
  { label: 'E', deg: 90 },
  { label: 'SE', deg: 135 },
  { label: 'S', deg: 180 },
  { label: 'SW', deg: 225 },
  { label: 'W', deg: 270 },
  { label: 'NW', deg: 315 },
];

export default function QiblaScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const isDark = colorScheme === 'dark';
  const { qiblaDirection, compassHeading, distance, hasPermission, isAligned, error } = useQiblaDirection();

  // Animated values
  const compassRotation = useRef(new Animated.Value(0)).current;
  const glowOpacity = useRef(new Animated.Value(0)).current;
  const pulseScale = useRef(new Animated.Value(1)).current;
  const wasAligned = useRef(false);

  // Smooth compass rotation
  useEffect(() => {
    Animated.timing(compassRotation, {
      toValue: -compassHeading,
      duration: 150,
      easing: Easing.out(Easing.quad),
      useNativeDriver: true,
    }).start();
  }, [compassHeading]);

  // Alignment glow + haptic
  useEffect(() => {
    if (isAligned && !wasAligned.current) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      wasAligned.current = true;
    } else if (!isAligned) {
      wasAligned.current = false;
    }

    Animated.timing(glowOpacity, {
      toValue: isAligned ? 1 : 0,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, [isAligned]);

  // Pulse animation for the center when aligned
  useEffect(() => {
    if (isAligned) {
      const pulse = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseScale, {
            toValue: 1.15,
            duration: 800,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(pulseScale, {
            toValue: 1,
            duration: 800,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
        ])
      );
      pulse.start();
      return () => pulse.stop();
    } else {
      pulseScale.setValue(1);
    }
  }, [isAligned]);

  const compassSpin = compassRotation.interpolate({
    inputRange: [-360, 360],
    outputRange: ['-360deg', '360deg'],
  });

  // Qibla angle relative to the compass (fixed on the dial)
  const qiblaAngle = qiblaDirection;

  if (error) {
    return (
      <View style={[styles.container, { backgroundColor: isDark ? '#0A0F1A' : '#F0F4F8' }]}>
        <View style={styles.errorContainer}>
          <View style={[styles.errorIcon, { backgroundColor: `${colors.primary}15` }]}>
            <Ionicons name="alert-circle-outline" size={48} color={colors.primary} />
          </View>
          <Text style={[styles.errorTitle, { color: colors.text }]}>Unable to Find Qibla</Text>
          <Text style={[styles.errorText, { color: colors.textSecondary }]}>{error}</Text>
        </View>
      </View>
    );
  }

  if (!hasPermission) {
    return (
      <View style={[styles.container, { backgroundColor: isDark ? '#0A0F1A' : '#F0F4F8' }]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.text }]}>
            Getting your location...
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: isDark ? '#0A0F1A' : '#F0F4F8' }]}>
      {/* Alignment Glow Background */}
      <Animated.View
        style={[
          styles.glowBackground,
          { opacity: glowOpacity },
        ]}
      />

      {/* Header */}
      <View style={styles.header}>
        <Text style={[styles.headingDegree, { color: isAligned ? '#27AE60' : colors.text }]}>
          {Math.round(compassHeading)}°
        </Text>
        <Text style={[styles.subtitle, { color: isAligned ? '#27AE60' : colors.textSecondary }]}>
          {isAligned ? 'You are facing the Qibla' : 'Rotate to face the Qibla'}
        </Text>
      </View>

      {/* Fixed pointer at top */}
      <View style={styles.pointerContainer}>
        <View style={[styles.pointer, { borderBottomColor: isAligned ? '#27AE60' : colors.primary }]} />
      </View>

      {/* Compass */}
      <View style={styles.compassWrapper}>
        <Animated.View
          style={[
            styles.compassDial,
            {
              backgroundColor: isDark ? '#141C2F' : '#FFFFFF',
              borderColor: isDark ? '#1E2A45' : '#E0E6ED',
              transform: [{ rotate: compassSpin }],
            },
          ]}
        >
          {/* Outer ring marks */}
          {[...Array(DEGREE_MARKS)].map((_, i) => {
            const deg = i * 5;
            const isMajor = deg % 90 === 0;
            const isMid = deg % 45 === 0 && !isMajor;
            const isMinor = deg % 15 === 0 && !isMajor && !isMid;
            const markLen = isMajor ? 20 : isMid ? 14 : isMinor ? 10 : 6;
            const markWidth = isMajor ? 2.5 : 1.5;
            const markColor = isMajor
              ? (isDark ? '#FFFFFF' : '#1A1A2E')
              : isMid
                ? (isDark ? '#6B7B9E' : '#8899AA')
                : (isDark ? '#2A3650' : '#C8D4DE');

            return (
              <View
                key={i}
                style={[
                  styles.mark,
                  {
                    height: markLen,
                    width: markWidth,
                    backgroundColor: markColor,
                    transform: [
                      { rotate: `${deg}deg` },
                      { translateY: -(COMPASS_RADIUS - 12) },
                    ],
                  },
                ]}
              />
            );
          })}

          {/* Cardinal labels */}
          {CARDINAL_DIRS.map(({ label, deg }) => {
            const isMain = deg % 90 === 0;
            const rad = (deg - 90) * (Math.PI / 180);
            const labelRadius = COMPASS_RADIUS - 42;
            const x = labelRadius * Math.cos(rad);
            const y = labelRadius * Math.sin(rad);

            return (
              <View
                key={label}
                style={[
                  styles.cardinalWrapper,
                  {
                    transform: [
                      { translateX: x },
                      { translateY: y },
                      { rotate: `${-0}deg` }, // Counter-rotate to keep text upright relative to compass
                    ],
                  },
                ]}
              >
                <Text
                  style={[
                    styles.cardinalLabel,
                    {
                      fontSize: isMain ? 18 : 12,
                      fontWeight: isMain ? '800' : '600',
                      color: label === 'N'
                        ? '#E74C3C'
                        : isMain
                          ? (isDark ? '#FFFFFF' : '#1A1A2E')
                          : (isDark ? '#6B7B9E' : '#8899AA'),
                    },
                  ]}
                />
                <Text
                  style={[
                    styles.cardinalLabel,
                    {
                      fontSize: isMain ? 18 : 12,
                      fontWeight: isMain ? '800' : '600',
                      color: label === 'N'
                        ? '#E74C3C'
                        : isMain
                          ? (isDark ? '#FFFFFF' : '#1A1A2E')
                          : (isDark ? '#6B7B9E' : '#8899AA'),
                    },
                  ]}
                >
                  {label}
                </Text>
              </View>
            );
          })}

          {/* Inner decorative rings */}
          <View style={[styles.innerRing, { borderColor: isDark ? '#1E2A45' : '#E8EDF2' }]} />
          <View style={[styles.innerRing2, { borderColor: isDark ? '#182238' : '#F0F4F8' }]} />

          {/* Qibla indicator on compass dial */}
          <View
            style={[
              styles.qiblaMarker,
              {
                transform: [
                  { rotate: `${qiblaAngle}deg` },
                  { translateY: -(COMPASS_RADIUS - 65) },
                ],
              },
            ]}
          >
            <View style={[styles.qiblaIconOuter, { backgroundColor: isAligned ? '#27AE60' : '#D4AF37' }]}>
              <Text style={styles.kaabaEmoji}>🕋</Text>
            </View>
          </View>

          {/* Qibla line from center to marker */}
          <View
            style={[
              styles.qiblaLine,
              {
                backgroundColor: isAligned ? '#27AE60' : '#D4AF3780',
                transform: [
                  { rotate: `${qiblaAngle}deg` },
                  { translateY: -(COMPASS_RADIUS / 2 - 40) },
                ],
                height: COMPASS_RADIUS - 100,
              },
            ]}
          />
        </Animated.View>

        {/* Center dot (fixed, doesn't rotate) */}
        <Animated.View
          style={[
            styles.centerDot,
            {
              backgroundColor: isAligned ? '#27AE60' : colors.primary,
              transform: [{ scale: pulseScale }],
            },
          ]}
        >
          <View style={styles.centerDotInner} />
        </Animated.View>
      </View>

      {/* Info Cards */}
      <View style={styles.infoContainer}>
        <View style={[styles.infoCard, { backgroundColor: isDark ? '#141C2F' : '#FFFFFF' }]}>
          <Ionicons name="navigate-outline" size={20} color={isAligned ? '#27AE60' : colors.primary} />
          <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>Qibla</Text>
          <Text style={[styles.infoValue, { color: colors.text }]}>{qiblaDirection.toFixed(1)}°</Text>
        </View>

        <View style={[styles.infoCard, { backgroundColor: isDark ? '#141C2F' : '#FFFFFF' }]}>
          <Ionicons name="compass-outline" size={20} color={isAligned ? '#27AE60' : colors.primary} />
          <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>Heading</Text>
          <Text style={[styles.infoValue, { color: colors.text }]}>{Math.round(compassHeading)}°</Text>
        </View>

        <View style={[styles.infoCard, { backgroundColor: isDark ? '#141C2F' : '#FFFFFF' }]}>
          <Ionicons name="location-outline" size={20} color={isAligned ? '#27AE60' : colors.primary} />
          <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>Makkah</Text>
          <Text style={[styles.infoValue, { color: colors.text }]}>{distance.toFixed(0)} km</Text>
        </View>
      </View>

      {/* Calibration Tip */}
      <View style={[styles.tipCard, { backgroundColor: isDark ? '#141C2F' : '#FFFFFF', borderColor: isDark ? '#1E2A45' : '#E0E6ED' }]}>
        <Ionicons name="refresh-outline" size={16} color={colors.textSecondary} />
        <Text style={[styles.tipText, { color: colors.textSecondary }]}>
          Move phone in a figure-8 to calibrate compass
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
  },
  glowBackground: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(39, 174, 96, 0.06)',
  },
  header: {
    alignItems: 'center',
    paddingTop: 16,
    paddingBottom: 4,
  },
  headingDegree: {
    fontSize: 42,
    fontWeight: '200',
    letterSpacing: -1,
  },
  subtitle: {
    fontSize: 14,
    fontWeight: '500',
    marginTop: 2,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  errorIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginTop: 16,
  },
  errorText: {
    fontSize: 14,
    textAlign: 'center',
    marginTop: 8,
  },
  pointerContainer: {
    alignItems: 'center',
    marginBottom: -8,
    zIndex: 10,
  },
  pointer: {
    width: 0,
    height: 0,
    borderLeftWidth: 10,
    borderRightWidth: 10,
    borderBottomWidth: 16,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    transform: [{ rotate: '180deg' }],
  },
  compassWrapper: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    maxHeight: COMPASS_SIZE + 20,
  },
  compassDial: {
    width: COMPASS_SIZE,
    height: COMPASS_SIZE,
    borderRadius: COMPASS_SIZE / 2,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 8,
  },
  mark: {
    position: 'absolute',
    borderRadius: 1,
  },
  cardinalWrapper: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardinalLabel: {
    textAlign: 'center',
  },
  innerRing: {
    position: 'absolute',
    width: COMPASS_SIZE * 0.7,
    height: COMPASS_SIZE * 0.7,
    borderRadius: COMPASS_SIZE * 0.35,
    borderWidth: 1,
  },
  innerRing2: {
    position: 'absolute',
    width: COMPASS_SIZE * 0.45,
    height: COMPASS_SIZE * 0.45,
    borderRadius: COMPASS_SIZE * 0.225,
    borderWidth: 1,
  },
  qiblaMarker: {
    position: 'absolute',
    alignItems: 'center',
    zIndex: 5,
  },
  qiblaIconOuter: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#D4AF37',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 6,
    elevation: 4,
  },
  kaabaEmoji: {
    fontSize: 22,
  },
  qiblaLine: {
    position: 'absolute',
    width: 2,
    borderRadius: 1,
  },
  centerDot: {
    position: 'absolute',
    width: 18,
    height: 18,
    borderRadius: 9,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  centerDotInner: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#FFFFFF',
  },
  infoContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
    gap: 10,
  },
  infoCard: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 14,
    borderRadius: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  infoLabel: {
    fontSize: 11,
    fontWeight: '500',
    marginTop: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  infoValue: {
    fontSize: 17,
    fontWeight: '700',
    marginTop: 2,
  },
  tipCard: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    gap: 8,
  },
  tipText: {
    fontSize: 12,
    flex: 1,
  },
});
