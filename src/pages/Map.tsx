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
    <div className="relative min-h-screen overflow-hidden bg-white">
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
          className="absolute inset-0 h-full w-full"
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

        {/* Top Header Overlay */}
        <div className="pointer-events-none absolute left-0 right-0 top-0 z-10">
          <div className="pointer-events-auto bg-white/95 px-5 pb-4 pt-4 shadow-sm backdrop-blur-md">
            <div className="flex items-center justify-between">
              <button
                type="button"
                className="flex h-11 w-11 items-center justify-center rounded-full bg-white shadow-[0_4px_14px_rgba(0,0,0,0.10)]"
                aria-label="Menu"
              >
                <svg
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                >
                  <path d="M4 6h16" />
                  <path d="M4 12h16" />
                  <path d="M4 18h16" />
                </svg>
              </button>

              <div className="text-[38px] font-bold leading-none tracking-[-2px]">
                <span className="text-slate-900">Triml</span>
                <span className="text-orange-500">y</span>
              </div>

              <button
                type="button"
                className="relative flex h-11 w-11 items-center justify-center rounded-full bg-white shadow-[0_4px_14px_rgba(0,0,0,0.10)]"
                aria-label="Notifications"
              >
                <svg
                  width="25"
                  height="25"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9" />
                  <path d="M10 21h4" />
                </svg>

                <span className="absolute right-1 top-1 h-2.5 w-2.5 rounded-full bg-orange-500" />
              </button>
            </div>
          </div>
        </div>

        {/* Search + Filters */}
        <div className="absolute left-0 right-0 top-[88px] z-10 px-5">
          <div className="rounded-[24px] bg-white shadow-[0_8px_25px_rgba(0,0,0,0.12)]">
            <div className="flex h-[58px] items-center gap-3 px-4">
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

          <div className="mt-4 flex gap-3 overflow-x-auto pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            <div className="flex h-[48px] shrink-0 items-center gap-2 rounded-full bg-orange-500 px-5 text-sm font-semibold text-white shadow-[0_5px_15px_rgba(249,115,22,0.25)]">
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
            </div>

            <div className="flex h-[48px] shrink-0 items-center gap-2 rounded-full bg-white px-5 text-sm font-semibold text-slate-800 shadow-[0_5px_15px_rgba(0,0,0,0.10)]">
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
            </div>

            <div className="flex h-[48px] shrink-0 items-center gap-2 rounded-full bg-white px-5 text-sm font-semibold text-slate-800 shadow-[0_5px_15px_rgba(0,0,0,0.10)]">
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
            </div>

            <div className="flex h-[48px] shrink-0 items-center gap-2 rounded-full bg-white px-5 text-sm font-semibold text-slate-800 shadow-[0_5px_15px_rgba(0,0,0,0.10)]">
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
            </div>
          </div>
        </div>

        {/* Current Location Button */}
        <button
          type="button"
          className="absolute right-5 top-[250px] z-10 flex h-14 w-14 items-center justify-center rounded-2xl bg-white shadow-[0_6px_18px_rgba(0,0,0,0.15)]"
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