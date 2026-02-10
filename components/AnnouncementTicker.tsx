import React, { useEffect, useRef, useState } from 'react';
import { StyleSheet, View, Animated, Text, Easing } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const SCROLL_SPEED = 60; // pixels per second

interface AnnouncementTickerProps {
  messages: string[];
  colors: {
    primary: string;
    accent: string;
    text: string;
  };
}

export default function AnnouncementTicker({ messages, colors }: AnnouncementTickerProps) {
  const scrollAnim = useRef(new Animated.Value(0)).current;
  const [textWidth, setTextWidth] = useState(0);
  const [wrapperWidth, setWrapperWidth] = useState(0);
  const animationRef = useRef<Animated.CompositeAnimation | null>(null);

  const validMessages = messages.filter((m) => m && m.trim().length > 0);
  const combinedText = validMessages.join('     \u2022     ');

  // Restart animation when measurements are ready or text changes
  useEffect(() => {
    if (textWidth <= 0 || wrapperWidth <= 0) return;

    const totalDistance = wrapperWidth + textWidth;
    const duration = (totalDistance / SCROLL_SPEED) * 1000;
    let cancelled = false;

    const runScroll = () => {
      if (cancelled) return;
      scrollAnim.setValue(wrapperWidth);
      animationRef.current = Animated.timing(scrollAnim, {
        toValue: -textWidth,
        duration,
        easing: Easing.linear,
        useNativeDriver: true,
      });
      animationRef.current.start(({ finished }) => {
        if (finished && !cancelled) {
          runScroll();
        }
      });
    };

    runScroll();

    return () => {
      cancelled = true;
      animationRef.current?.stop();
    };
  }, [textWidth, wrapperWidth, combinedText]);

  if (validMessages.length === 0) return null;

  return (
    <View style={[styles.container, { backgroundColor: colors.primary }]}>
      <View style={styles.iconContainer}>
        <Ionicons name="megaphone" size={14} color="#FFFFFF" />
      </View>
      <View
        style={styles.tickerWrapper}
        onLayout={(e) => {
          const w = e.nativeEvent.layout.width;
          if (w > 0 && w !== wrapperWidth) setWrapperWidth(w);
        }}
      >
        <Animated.Text
          style={[
            styles.tickerText,
            {
              transform: [{ translateX: scrollAnim }],
              ...(textWidth > 0 && { width: textWidth }),
            },
          ]}
          numberOfLines={1}
        >
          {combinedText}
        </Animated.Text>
      </View>
      {/* Hidden text to measure full intrinsic width */}
      <Text
        style={styles.hiddenText}
        numberOfLines={1}
        onLayout={(e) => {
          const w = e.nativeEvent.layout.width;
          if (w > 0 && w !== textWidth) {
            setTextWidth(w);
          }
        }}
      >
        {combinedText}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
    marginTop: 0,
    marginBottom: 4,
    borderRadius: 8,
    paddingVertical: 8,
    overflow: 'hidden',
  },
  iconContainer: {
    paddingHorizontal: 10,
    zIndex: 1,
  },
  tickerWrapper: {
    flex: 1,
    overflow: 'hidden',
  },
  tickerText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '600',
    letterSpacing: 0.3,
  },
  hiddenText: {
    position: 'absolute',
    opacity: 0,
    fontSize: 13,
    fontWeight: '600',
    letterSpacing: 0.3,
    // Ensure no width constraint so we get the full intrinsic width
    left: -9999,
    top: -9999,
  },
});
