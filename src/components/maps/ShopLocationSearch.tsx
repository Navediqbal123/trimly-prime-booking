import { useEffect, useRef } from 'react';
import {
  APIProvider,
  useMapsLibrary,
} from '@vis.gl/react-google-maps';

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

  useEffect(() => {
    if (!placesLib || !containerRef.current) return;

    const autocomplete =
      new placesLib.PlaceAutocompleteElement();

    autocomplete.placeholder = 'Search shop address...';

    containerRef.current.innerHTML = '';
    containerRef.current.appendChild(autocomplete);

    autocomplete.addEventListener(
      'gmp-select',
      async (event: any) => {
        const place = event.placePrediction.toPlace();

        await place.fetchFields({
          fields: [
            'formattedAddress',
            'location',
            'id',
          ],
        });

        if (!place.location) return;

        onPlaceSelect({
          address: place.formattedAddress || '',
          latitude: place.location.lat(),
          longitude: place.location.lng(),
          placeId: place.id,
        });
      }
    );

    autocompleteRef.current = autocomplete;

    return () => {
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

  return (
    <div
      ref={containerRef}
      className="w-full"
    />
  );
}

export default function ShopLocationSearch(
  props: ShopLocationSearchProps
) {
  return (
    <APIProvider
      apiKey={import.meta.env.VITE_GOOGLE_MAPS_API_KEY}
    >
      <PlaceSearch {...props} />
    </APIProvider>
  );
}