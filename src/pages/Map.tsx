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

  // Lock page scrolling while Map page is open
  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    const previousOverscroll = document.body.style.overscrollBehavior;

    document.body.style.overflow = "hidden";
    document.body.style.overscrollBehavior = "none";

    return () => {
      document.body.style.overflow = previousOverflow;
      document.body.style.overscrollBehavior = previousOverscroll;
    };
  }, []);

  if (!GOOGLE_MAPS_API_KEY) {
    return (
      <div className="fixed inset-0 z-[5] overflow-hidden bg-white">
        <div className="px-5 pt-5">
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
    <div
      className="fixed inset-0 z-[5] overflow-hidden"
      style={{
        width: "100vw",
        height: "100dvh",
        touchAction: "none",
      }}
    >
      <APIProvider apiKey={GOOGLE_MAPS_API_KEY}>
        {/* FULL SCREEN MAP */}
        <div
          className="absolute left-0 top-0"
          style={{
            width: "100%",
            height: "calc(100dvh - 95px)",
          }}
        >
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
            style={{
              width: "100%",
              height: "100%",
            }}
          >
            {/* BARBER SHOP MARKERS */}
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
        </div>

        {/* SEARCH + FILTERS */}
        <div className="pointer-events-none absolute left-0 right-0 top-0 z-[20] px-5 pt-5">
          {/* SEARCH BAR */}
          <div className="pointer-events-auto rounded-[28px] bg-white shadow-[0_8px_25px_rgba(0,0,0,0.14)]">
            <div className="flex min-h-[68px] items-center gap-4 px-5">
              {/* Search Icon */}
              <svg
                width="30"
                height="30"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#64748b"
                strokeWidth="2.2"
                strokeLinecap="round"
              >
                <circle cx="11" cy="11" r="7" />
                <path d="m20 20-4-4" />
              </svg>

              {/* Search Text */}
              <span className="flex-1 text-[18px] leading-[1.35] text-slate-500">
                Search barber shops
                <br />
                near you...
              </span>

              {/* Filter Icon */}
              <svg
                width="27"
                height="27"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#111827"
                strokeWidth="2"
                strokeLinecap="round"
              >
                <path d="M4 6h16" />
                <path d="M7 12h10" />
                <path d="M10 18h4" />

                <circle
                  cx="9"
                  cy="6"
                  r="1.5"
                  fill="white"
                />

                <circle
                  cx="15"
                  cy="12"
                  r="1.5"
                  fill="white"
                />

                <circle
                  cx="12"
                  cy="18"
                  r="1.5"
                  fill="white"
                />
              </svg>
            </div>
          </div>

          {/* FILTER CHIPS */}
          <div className="pointer-events-auto mt-4 flex gap-4">
            {/* NEAR ME */}
            <button
              type="button"
              className="flex h-[56px] flex-1 items-center justify-center gap-2 rounded-full bg-orange-500 px-4 text-[17px] font-semibold text-white shadow-[0_6px_18px_rgba(249,115,22,0.28)]"
            >
              <svg
                width="23"
                height="23"
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

            {/* OPEN NOW */}
            <button
              type="button"
              className="flex h-[56px] flex-1 items-center justify-center gap-2 rounded-full bg-white px-4 text-[17px] font-semibold text-slate-800 shadow-[0_6px_18px_rgba(0,0,0,0.10)]"
            >
              <svg
                width="23"
                height="23"
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
          </div>
        </div>

        {/* CURRENT LOCATION BUTTON */}
        <button
          type="button"
          className="absolute right-5 top-[235px] z-[20] flex h-[60px] w-[60px] items-center justify-center rounded-[20px] bg-white shadow-[0_7px_20px_rgba(0,0,0,0.15)]"
          aria-label="Current location"
        >
          <svg
            width="30"
            height="30"
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