import { useEffect, useState } from "react";
import {
  APIProvider,
  Map as GoogleMap,
  AdvancedMarker,
  Pin,
} from "@vis.gl/react-google-maps";

import { getApprovedBarbers, ApprovedBarberData } from "@/lib/api";

const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

const DEFAULT_CENTER = {
  lat: 25.1337,
  lng: 82.5644,
};

export default function Map() {
  const [barbers, setBarbers] = useState<ApprovedBarberData[]>([]);

  useEffect(() => {
    const loadBarbers = async () => {
      const res = await getApprovedBarbers();

      if (res.success && res.data) {
        setBarbers(res.data);
      }
    };

    loadBarbers();
  }, []);

  if (!GOOGLE_MAPS_API_KEY) {
    return (
      <div className="min-h-screen bg-white px-4 pb-24 pt-4">
        <div className="mb-4">
          <h1 className="text-2xl font-bold text-slate-800">
            Trimly Map
          </h1>
          <p className="mt-1 text-sm text-red-500">
            Google Maps API key is missing.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white px-4 pb-24 pt-4">
      <div className="mb-4">
        <h1 className="text-2xl font-bold text-slate-800">
          Trimly Map
        </h1>

        <p className="mt-1 text-sm text-slate-500">
          Find nearby barber shops
        </p>
      </div>

      <div className="h-[65vh] min-h-[450px] overflow-hidden rounded-[28px] shadow-[7px_8px_17px_rgba(0,0,0,0.10),-6px_-6px_15px_rgba(255,255,255,0.95)]">
        <APIProvider apiKey={GOOGLE_MAPS_API_KEY}>
          <GoogleMap
            defaultCenter={DEFAULT_CENTER}
            defaultZoom={13}
            mapId="DEMO_MAP_ID"
            gestureHandling="greedy"
            disableDefaultUI={false}
            zoomControl
            fullscreenControl
            streetViewControl={false}
            mapTypeControl={false}
          >
            {barbers.map((barber) => {
              if (
                typeof barber.latitude !== "number" ||
                typeof barber.longitude !== "number"
              ) {
                return null;
              }

              return (
                <AdvancedMarker
                  key={barber.id}
                  position={{
                    lat: barber.latitude,
                    lng: barber.longitude,
                  }}
                  title={barber.shop_name || "Barber Shop"}
                >
                  <Pin
                    background="#f97316"
                    borderColor="#ffffff"
                    glyphColor="#ffffff"
                  />
                </AdvancedMarker>
              );
            })}
          </GoogleMap>
        </APIProvider>
      </div>
    </div>
  );
}