import { useState, useEffect, useRef } from 'react';
import * as Location from 'expo-location';
import { KAABA_COORDINATES } from '@/constants/prayerTimes';

interface QiblaState {
  qiblaDirection: number;
  compassHeading: number;
  deviceHeading: number;
  distance: number;
  hasPermission: boolean;
  isCalibrated: boolean;
  isAligned: boolean;
  error: string | null;
}

function toRadians(degrees: number): number {
  return degrees * (Math.PI / 180);
}

function toDegrees(radians: number): number {
  return radians * (180 / Math.PI);
}

function calculateQiblaDirection(lat: number, lng: number): number {
  const kaabaLat = toRadians(KAABA_COORDINATES.latitude);
  const kaabaLng = toRadians(KAABA_COORDINATES.longitude);
  const userLat = toRadians(lat);
  const userLng = toRadians(lng);

  const dLng = kaabaLng - userLng;

  const x = Math.sin(dLng) * Math.cos(kaabaLat);
  const y = Math.cos(userLat) * Math.sin(kaabaLat) -
            Math.sin(userLat) * Math.cos(kaabaLat) * Math.cos(dLng);

  let bearing = toDegrees(Math.atan2(x, y));
  bearing = (bearing + 360) % 360;

  return bearing;
}

function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = toRadians(lat2 - lat1);
  const dLon = toRadians(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// Low-pass filter for smooth compass rotation
function lowPassFilter(
  oldValue: number,
  newValue: number,
  alpha: number
): number {
  let diff = newValue - oldValue;
  if (diff > 180) diff -= 360;
  if (diff < -180) diff += 360;
  return (oldValue + alpha * diff + 360) % 360;
}

export function useQiblaDirection() {
  const [state, setState] = useState<QiblaState>({
    qiblaDirection: 0,
    compassHeading: 0,
    deviceHeading: 0,
    distance: 0,
    hasPermission: false,
    isCalibrated: true,
    isAligned: false,
    error: null,
  });

  const lastHeading = useRef(0);

  useEffect(() => {
    let headingSubscription: Location.LocationSubscription | null = null;
    let isMounted = true;

    const setup = async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();

        if (status !== 'granted') {
          if (isMounted) {
            setState(prev => ({
              ...prev,
              hasPermission: false,
              error: 'Location permission is required for Qibla direction',
            }));
          }
          return;
        }

        const location = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        });

        const { latitude, longitude } = location.coords;
        const qiblaDir = calculateQiblaDirection(latitude, longitude);
        const dist = calculateDistance(
          latitude,
          longitude,
          KAABA_COORDINATES.latitude,
          KAABA_COORDINATES.longitude
        );

        if (isMounted) {
          setState(prev => ({
            ...prev,
            qiblaDirection: qiblaDir,
            distance: dist,
            hasPermission: true,
          }));
        }

        // Use Location heading for true north (accounts for magnetic declination)
        headingSubscription = await Location.watchHeadingAsync((heading) => {
          if (!isMounted) return;

          const trueHeading = heading.trueHeading >= 0 ? heading.trueHeading : heading.magHeading;

          // Apply low-pass filter for smoothness
          const smoothed = lowPassFilter(lastHeading.current, trueHeading, 0.15);
          lastHeading.current = smoothed;

          // Check if aligned with Qibla (within 5 degrees)
          let diff = Math.abs(smoothed - qiblaDir);
          if (diff > 180) diff = 360 - diff;
          const aligned = diff < 5;

          setState(prev => ({
            ...prev,
            compassHeading: smoothed,
            deviceHeading: smoothed,
            isAligned: aligned,
          }));
        });

      } catch (error) {
        if (isMounted) {
          setState(prev => ({
            ...prev,
            error: 'Failed to get location or compass data',
          }));
        }
      }
    };

    setup();

    return () => {
      isMounted = false;
      if (headingSubscription) {
        headingSubscription.remove();
      }
    };
  }, []);

  return state;
}
