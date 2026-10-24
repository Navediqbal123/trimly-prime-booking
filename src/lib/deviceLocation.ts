import { Capacitor } from '@capacitor/core';
import { Geolocation } from '@capacitor/geolocation';

export interface CurrentCoordinates {
  latitude: number;
  longitude: number;
}

export interface CurrentLocationOptions {
  enableHighAccuracy?: boolean;
  timeout?: number;
  maximumAge?: number;
}

export class LocationPermissionDeniedError extends Error {
  constructor() {
    super('Location permission denied');
    this.name = 'LocationPermissionDeniedError';
  }
}

const hasLocationPermission = (status: {
  location: string;
  coarseLocation: string;
}) => status.location === 'granted' || status.coarseLocation === 'granted';

export async function getCurrentLocation(
  options: CurrentLocationOptions = {},
): Promise<CurrentCoordinates> {
  if (Capacitor.isNativePlatform()) {
    const currentPermission = await Geolocation.checkPermissions();
    if (!hasLocationPermission(currentPermission)) {
      const requestedPermission = await Geolocation.requestPermissions({
        permissions: ['location'],
      });
      if (!hasLocationPermission(requestedPermission)) {
        throw new LocationPermissionDeniedError();
      }
    }

    const position = await Geolocation.getCurrentPosition(options);
    return {
      latitude: position.coords.latitude,
      longitude: position.coords.longitude,
    };
  }

  if (typeof navigator === 'undefined' || !navigator.geolocation) {
    throw new Error('Location is not supported by this browser.');
  }

  return new Promise((resolve, reject) => {
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => resolve({
        latitude: coords.latitude,
        longitude: coords.longitude,
      }),
      reject,
      options,
    );
  });
}

export function getLocationErrorMessage(error: unknown): string {
  if (
    error instanceof LocationPermissionDeniedError ||
    (typeof error === 'object' && error !== null && 'code' in error &&
      (error.code === 1 || error.code === 'OS-PLUG-GLOC-0003'))
  ) {
    return 'Location permission denied. Allow location access and try again.';
  }

  if (
    typeof error === 'object' && error !== null && 'code' in error &&
    (error.code === 3 || error.code === 'OS-PLUG-GLOC-0010')
  ) {
    return 'Location request timed out. Please try again.';
  }

  const message = error instanceof Error ? error.message.toLowerCase() : '';
  if (
    (typeof error === 'object' && error !== null && 'code' in error &&
      ['OS-PLUG-GLOC-0007', 'OS-PLUG-GLOC-0009', 'OS-PLUG-GLOC-0017'].includes(String(error.code))) ||
    message.includes('location services') ||
    message.includes('location is disabled')
  ) {
    return 'Turn on device location services and try again.';
  }

  return 'Could not get your location. Check your permission and device location settings, then try again.';
}
