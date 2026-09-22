import { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

interface ShopLocationMapProps {
  latitude?: number | null;
  longitude?: number | null;
  onLocationSelect: (
    latitude: number,
    longitude: number
  ) => void;
}

const DEFAULT_CENTER = {
  latitude: 25.1460,
  longitude: 82.5650,
};

export default function ShopLocationMap({
  latitude,
  longitude,
  onLocationSelect,
}: ShopLocationMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const leafletMapRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.CircleMarker | null>(null);

  const [selectedLocation, setSelectedLocation] =
    useState<{
      latitude: number;
      longitude: number;
    } | null>(
      typeof latitude === 'number' &&
        typeof longitude === 'number'
        ? {
            latitude,
            longitude,
          }
        : null
    );

  useEffect(() => {
    if (!mapRef.current) {
      return;
    }

    if (leafletMapRef.current) {
      return;
    }

    const startLatitude =
      typeof latitude === 'number'
        ? latitude
        : DEFAULT_CENTER.latitude;

    const startLongitude =
      typeof longitude === 'number'
        ? longitude
        : DEFAULT_CENTER.longitude;

    const map = L.map(mapRef.current, {
      zoomControl: true,
      scrollWheelZoom: true,
    }).setView(
      [startLatitude, startLongitude],
      typeof latitude === 'number' &&
        typeof longitude === 'number'
        ? 16
        : 13
    );

    L.tileLayer(
      'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png'
    ).addTo(map);

    if (
      typeof latitude === 'number' &&
      typeof longitude === 'number'
    ) {
      markerRef.current = L.circleMarker(
        [latitude, longitude],
        {
          radius: 10,
          color: '#ffffff',
          weight: 3,
          fillColor: '#f97316',
          fillOpacity: 1,
        }
      ).addTo(map);
    }

    map.on('click', (event) => {
      const newLatitude = event.latlng.lat;
      const newLongitude = event.latlng.lng;

      setSelectedLocation({
        latitude: newLatitude,
        longitude: newLongitude,
      });

      if (markerRef.current) {
        markerRef.current.setLatLng([
          newLatitude,
          newLongitude,
        ]);
      } else {
        markerRef.current = L.circleMarker(
          [newLatitude, newLongitude],
          {
            radius: 10,
            color: '#ffffff',
            weight: 3,
            fillColor: '#f97316',
            fillOpacity: 1,
          }
        ).addTo(map);
      }

      onLocationSelect(
        newLatitude,
        newLongitude
      );
    });

    leafletMapRef.current = map;

    return () => {
      map.remove();
      leafletMapRef.current = null;
      markerRef.current = null;
    };
  }, [latitude, longitude, onLocationSelect]);

  return (
    <div className="w-full overflow-hidden rounded-2xl border border-slate-200 bg-white">
      <div
        ref={mapRef}
        className="h-[350px] w-full"
      />

      <div className="bg-white px-4 py-3">
        <p className="text-sm font-semibold text-slate-700">
          Select your shop location
        </p>

        <p className="mt-1 text-xs text-slate-500">
          Tap anywhere on the map to place your
          shop location.
        </p>

        {selectedLocation && (
          <p className="mt-2 text-xs text-slate-500">
            Location selected
          </p>
        )}
      </div>
    </div>
  );
}