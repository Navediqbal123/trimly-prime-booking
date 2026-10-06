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
      <div className="fixed inset-x-0 bottom-0 top-[96px] overflow-hidden bg-white">
        <div className="px-5 pt-4">
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
    <div className="fixed inset-x-0 bottom-0 top-[96px] z-0 overflow-hidden bg-transparent">
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
          className="h-full w-full"
        >
          {/* Barber Shop Markers */}
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

        {/* Search + Filters */}
        <div className="pointer-events-none absolute left-0 right-0 top-4 z-20 px-5">
          <div className="pointer-events-auto rounded-[24px] bg-white shadow-[0_8px_25px_rgba(0,0,0,0.12)]">
            <div className="flex h-[58px] items-center gap-3 px-4">
              {/* Search Icon */}
              <svg
                width="25"
                height="25"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#64748b"
                strokeWidth="2.2"
                strokeLinecap="round"
              >
                <circle cx="11" cy="11" r="7" />
                <path d="m20 20-4-4" />
              </svg>

              <span className="flex-1 text-[16px] text-slate-500">
                Search barber shops near you...
              </span>

              {/* Filter Icon */}
              <svg
                width="23"
                height="23"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#111827"
                strokeWidth="2"
                strokeLinecap="round"
              >
                <path d="M4 6h16" />
                <path d="M7 12h10" />
                <path d="M10 18h4" />
                <circle cx="9" cy="6" r="1.5" fill="white" />
                <circle cx="15" cy="12" r="1.5" fill="white" />
                <circle cx="12" cy="18" r="1.5" fill="white" />
              </svg>
            </div>
          </div>

          {/* Filter Chips */}
          <div className="pointer-events-auto mt-4 flex gap-3 overflow-x-auto pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {/* Near Me */}
            <button
              type="button"
              className="flex h-[48px] shrink-0 items-center gap-2 rounded-full bg-orange-500 px-5 text-sm font-semibold text-white shadow-[0_5px_15px_rgba(249,115,22,0.25)]"
            >
              <svg
                width="19"
                height="19"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M20 10c0 5-8 11-8 11S4 15 4 10a8 8 0 1 1 16 0Z" />
                <circle cx="12" cy="10" r="2.5" />
              </svg>
              Near Me
            </button>

            {/* Open Now */}
            <button
              type="button"
              className="flex h-[48px] shrink-0 items-center gap-2 rounded-full bg-white px-5 text-sm font-semibold text-slate-800 shadow-[0_5px_15px_rgba(0,0,0,0.10)]"
            >
              <svg
                width="19"
                height="19"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <circle cx="12" cy="12" r="9" />
                <path d="M12 7v5l3 2" />
              </svg>
              Open Now
            </button>

            {/* Top Rated */}
            <button
              type="button"
              className="flex h-[48px] shrink-0 items-center gap-2 rounded-full bg-white px-5 text-sm font-semibold text-slate-800 shadow-[0_5px_15px_rgba(0,0,0,0.10)]"
            >
              <svg
                width="19"
                height="19"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="m12 3 2.8 5.7 6.2.9-4.5 4.4 1.1 6.2-5.6-2.9-5.6 2.9 1.1-6.2L3 9.6l6.2-.9L12 3Z" />
              </svg>
              Top Rated
            </button>

            {/* All */}
            <button
              type="button"
              className="flex h-[48px] shrink-0 items-center gap-2 rounded-full bg-white px-5 text-sm font-semibold text-slate-800 shadow-[0_5px_15px_rgba(0,0,0,0.10)]"
            >
              <svg
                width="19"
                height="19"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <rect x="4" y="4" width="6" height="6" rx="1" />
                <rect x="14" y="4" width="6" height="6" rx="1" />
                <rect x="4" y="14" width="6" height="6" rx="1" />
                <rect x="14" y="14" width="6" height="6" rx="1" />
              </svg>
              All
            </button>
          </div>
        </div>

        {/* Current Location */}
        <button
          type="button"
          className="absolute right-5 top-[245px] z-20 flex h-14 w-14 items-center justify-center rounded-2xl bg-white shadow-[0_6px_18px_rgba(0,0,0,0.15)]"
          aria-label="Current location"
        >
          <svg
            width="27"
            height="27"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <circle cx="12" cy="12" r="3" />
            <circle cx="12" cy="12" r="8" />
            <path d="M12 2v3" />
            <path d="M12 19v3" />
            <path d="M2 12h3" />
            <path d="M19 12h3" />
          </svg>
        </button>
      </APIProvider>
    </div>
  );
}