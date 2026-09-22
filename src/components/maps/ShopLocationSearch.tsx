import { useEffect, useRef, useState } from 'react';
import {
  APIProvider,
  useMapsLibrary,
} from '@vis.gl/react-google-maps';
import { MapPin, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ShopLocationSearchProps {
  value: string;
  onPlaceSelect: (data: {
    address: string;
    latitude: number;
    longitude: number;
    placeId?: string;
  }) => void;
}

function PlaceSearch({
  value,
  onPlaceSelect,
}: ShopLocationSearchProps) {
  const placesLib = useMapsLibrary('places');

  const containerRef = useRef<HTMLDivElement>(null);
  const autocompleteRef = useRef<any>(null);

  const [locationLoading, setLocationLoading] =
    useState(false);

  const [locationError, setLocationError] =
    useState('');

  useEffect(() => {
    if (!placesLib || !containerRef.current) return;

    const autocomplete =
      new placesLib.PlaceAutocompleteElement();

    autocomplete.placeholder =
      'Search shop address...';

    containerRef.current.innerHTML = '';
    containerRef.current.appendChild(autocomplete);

    const handlePlaceSelect = async (event: any) => {
      try {
        const place =
          event.placePrediction.toPlace();

        await place.fetchFields({
          fields: [
            'formattedAddress',
            'location',
            'id',
          ],
        });

        if (!place.location) return;

        setLocationError('');

        onPlaceSelect({
          address:
            place.formattedAddress || '',
          latitude: place.location.lat(),
          longitude: place.location.lng(),
          placeId: place.id,
        });
      } catch (error) {
        console.error(
          'Place selection error:',
          error
        );
      }
    };

    autocomplete.addEventListener(
      'gmp-select',
      handlePlaceSelect
    );

    autocompleteRef.current =
      autocomplete;

    return () => {
      autocomplete.removeEventListener(
        'gmp-select',
        handlePlaceSelect
      );

      autocompleteRef.current = null;

      if (containerRef.current) {
        containerRef.current.innerHTML = '';
      }
    };
  }, [placesLib, onPlaceSelect]);

  useEffect(() => {
    if (
      autocompleteRef.current &&
      value &&
      autocompleteRef.current.value !== value
    ) {
      autocompleteRef.current.value = value;
    }
  }, [value]);

  const handleUseCurrentLocation = () => {
    if (!navigator.geolocation) {
      setLocationError(
        'Location is not supported by this browser.'
      );
      return;
    }

    setLocationLoading(true);
    setLocationError('');

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const latitude =
          position.coords.latitude;

        const longitude =
          position.coords.longitude;

        onPlaceSelect({
          address:
            'Current shop location',
          latitude,
          longitude,
        });

        setLocationLoading(false);
      },
      (error) => {
        console.error(
          'Shop location error:',
          error
        );

        setLocationLoading(false);

        if (error.code === 1) {
          setLocationError(
            'Location permission was denied. Please allow location access.'
          );
        } else if (error.code === 2) {
          setLocationError(
            'Unable to detect your location. Please try again.'
          );
        } else if (error.code === 3) {
          setLocationError(
            'Location request timed out. Please try again.'
          );
        } else {
          setLocationError(
            'Unable to get your current location.'
          );
        }
      },
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 0,
      }
    );
  };

  return (
    <div className="w-full space-y-3">

      {/* Google Place Search */}
      <div
        ref={containerRef}
        className="w-full"
      />

      {/* Current Location Button */}
      <Button
        type="button"
        variant="outline"
        onClick={handleUseCurrentLocation}
        disabled={locationLoading}
        className="w-full"
      >
        {locationLoading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Detecting location...
          </>
        ) : (
          <>
            <MapPin className="mr-2 h-4 w-4" />
            Use Current Shop Location
          </>
        )}
      </Button>

      {/* Error */}
      {locationError && (
        <p className="text-xs text-red-500">
          {locationError}
        </p>
      )}

      {/* Selected location */}
      {value && (
        <p className="text-xs text-muted-foreground">
          Selected: {value}
        </p>
      )}

    </div>
  );
}

export default function ShopLocationSearch(
  props: ShopLocationSearchProps
) {
  return (
    <APIProvider
      apiKey={
        import.meta.env.VITE_GOOGLE_MAPS_API_KEY
      }
    >
      <PlaceSearch {...props} />
    </APIProvider>
  );
}