import { useEffect, useMemo, useState } from "react";
import {
  APIProvider,
  Map as GoogleMap,
  AdvancedMarker,
  Pin,
} from "@vis.gl/react-google-maps";

import {
  getApprovedBarbers,
  getNearbyBarbers,
  getBarberServices,
  ApprovedBarberData,
  NearbyBarberData,
} from "@/lib/api";

import { shopRating } from "@/lib/shopMedia";

const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

const DEFAULT_CENTER = {
  lat: 25.1337,
  lng: 82.5644,
};

type Filter = "all" | "near" | "top" | "home";

export default function Map() {
  const [barbers, setBarbers] = useState<ApprovedBarberData[]>([]);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<Filter>("all");

  // Near Me
  const [nearbyBarbers, setNearbyBarbers] = useState<
    NearbyBarberData[]
  >([]);
  const [nearbyLoading, setNearbyLoading] = useState(false);

  // Home Service
  const [homeServiceIds, setHomeServiceIds] = useState<Set<string>>(
    new Set()
  );

  // ==========================================
  // LOAD APPROVED BARBERS
  // ==========================================

  useEffect(() => {
    const loadBarbers = async () => {
      const res = await getApprovedBarbers();

      if (res.success && res.data) {
        setBarbers(res.data);
      }
    };

    loadBarbers();
  }, []);

  // ==========================================
  // LOAD HOME SERVICE FLAGS
  // ==========================================

  useEffect(() => {
    const loadHomeServices = async () => {
      if (!barbers.length) {
        setHomeServiceIds(new Set());
        return;
      }

      const results = await Promise.all(
        barbers.map(async (barber) => {
          const res = await getBarberServices(barber.id);

          const hasHome =
            res.success && res.data
              ? res.data.some((service) => service.home_service)
              : false;

          return [barber.id, hasHome] as const;
        })
      );

      const ids = new Set(
        results
          .filter(([, hasHome]) => hasHome)
          .map(([id]) => id)
      );

      setHomeServiceIds(ids);
    };

    loadHomeServices();
  }, [barbers]);

  // ==========================================
  // CURRENT LOCATION
  // ==========================================

  const getCurrentLocation = (): Promise<{
    latitude: number;
    longitude: number;
  }> => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(
          new Error("Location is not supported by this browser.")
        );
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          resolve({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          });
        },
        (error) => {
          reject(error);
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0,
        }
      );
    });
  };

  // ==========================================
  // LOAD NEARBY BARBERS
  // ==========================================

  const loadNearbyBarbers = async () => {
    try {
      setNearbyLoading(true);

      const { latitude, longitude } =
        await getCurrentLocation();

      const res = await getNearbyBarbers(
        latitude,
        longitude,
        10
      );

      if (res.success && res.data) {
        setNearbyBarbers(res.data);
      } else {
        setNearbyBarbers([]);

        console.error(
          "Nearby barbers error:",
          res.error
        );
      }
    } catch (error) {
      console.error(
        "Near Me location error:",
        error
      );

      setNearbyBarbers([]);
    } finally {
      setNearbyLoading(false);
    }
  };

  // ==========================================
  // FILTER HANDLER
  // ==========================================

  const handleFilter = async (nextFilter: Filter) => {
    setFilter(nextFilter);

    if (
      nextFilter === "near" &&
      nearbyBarbers.length === 0
    ) {
      await loadNearbyBarbers();
    }
  };

  // ==========================================
  // FILTERED BARBERS
  // ==========================================

  const filteredBarbers = useMemo(() => {
    const search = query.trim().toLowerCase();

    const source =
      filter === "near"
        ? nearbyBarbers
        : barbers;

    return source.filter((barber) => {
      // Search
      if (search) {
        const shopName =
          barber.shop_name?.toLowerCase() || "";

        const location =
          barber.location?.toLowerCase() || "";

        if (
          !shopName.includes(search) &&
          !location.includes(search)
        ) {
          return false;
        }
      }

      // Top Rated
      if (
        filter === "top" &&
        shopRating(barber.id).rating < 4.7
      ) {
        return false;
      }

      // Home Service
      if (
        filter === "home" &&
        !homeServiceIds.has(barber.id)
      ) {
        return false;
      }

      return true;
    });
  }, [
    barbers,
    nearbyBarbers,
    query,
    filter,
    homeServiceIds,
  ]);

  // ==========================================
  // LOCK PAGE SCROLLING
  // ==========================================

  useEffect(() => {
    const previousOverflow =
      document.body.style.overflow;

    const previousOverscroll =
      document.body.style.overscrollBehavior;

    document.body.style.overflow = "hidden";
    document.body.style.overscrollBehavior = "none";

    return () => {
      document.body.style.overflow =
        previousOverflow;

      document.body.style.overscrollBehavior =
        previousOverscroll;
    };
  }, []);

  // ==========================================
  // GOOGLE MAP API KEY CHECK
  // ==========================================

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

  // ==========================================
  // UI
  // ==========================================

  return (
    <div
      className="fixed left-[-12px] right-0 top-[-60px] bottom-0 z-[5] overflow-hidden"
      style={{
        width: "100vw",
        height: "100dvh",
        touchAction: "none",
      }}
    >
<APIProvider
  apiKey={GOOGLE_MAPS_API_KEY}
  libraries={["places"]}
>
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

            {filteredBarbers.map((barber) => {
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
                  title={
                    barber.shop_name ||
                    "Barber Shop"
                  }
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
          {/* SEARCH BOX */}

          <div className="pointer-events-auto relative mb-3 w-full">
            <div
              className="
                flex h-[54px] w-full items-center
                rounded-[21px]
                border border-orange-100
                bg-white
                p-1.5
                shadow-[6px_7px_15px_rgba(0,0,0,0.09),-4px_-4px_11px_rgba(255,255,255,0.95)]
              "
            >
              {/* Search Icon */}

              <div
                className="
                  flex h-[41px] w-[41px] shrink-0 items-center justify-center
                  rounded-[15px]
                  bg-[#fff0df]
                  shadow-[3px_4px_8px_rgba(0,0,0,0.06),inset_2px_2px_4px_rgba(255,255,255,0.9),inset_-2px_-2px_4px_rgba(230,110,20,0.10)]
                "
              >
                <svg
                  width="21"
                  height="21"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="#ff7417"
                  strokeWidth="2"
                  strokeLinecap="round"
                >
                  <circle
                    cx="11"
                    cy="11"
                    r="7"
                  />
                  <path d="m20 20-4-4" />
                </svg>
              </div>

              {/* WORKING SEARCH INPUT */}

              <input
                type="text"
                value={query}
                onChange={(event) =>
                  setQuery(event.target.value)
                }
                placeholder="Search barber shops..."
                className="
                  h-full
                  min-w-0
                  flex-1
                  border-0
                  bg-transparent
                  px-3
                  text-[15px]
                  font-medium
                  text-slate-800
                  outline-none
                  placeholder:text-slate-400
                "
              />

              {/* Filter Icon */}

              <div
                className="
                  mr-0.5
                  flex h-[38px] w-[45px]
                  shrink-0
                  items-center justify-center
                  border-l border-orange-100
                  pl-1
                "
              >
                <svg
                  width="19"
                  height="19"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="#ff7417"
                  strokeWidth="2"
                  strokeLinecap="round"
                >
                  <path d="M4 6h16" />
                  <path d="M7 12h10" />
                  <path d="M10 18h4" />
                </svg>
              </div>
            </div>
          </div>

          {/* CATEGORY BUTTONS */}

          <div className="pointer-events-auto mb-4 flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {/* ALL */}

            <button
              type="button"
              onClick={() =>
                handleFilter("all")
              }
              className={`
                inline-flex h-[40px]
                shrink-0
                items-center justify-center
                gap-1.5
                rounded-full
                border border-orange-300
                px-3.5
                text-[13px]
                font-semibold
                transition-all
                duration-200
                active:scale-[0.97]
                ${
                  filter === "all"
                    ? "bg-[#ff7417] text-white shadow-[5px_6px_12px_rgba(255,116,23,0.28),inset_2px_2px_4px_rgba(255,255,255,0.28),inset_-2px_-2px_5px_rgba(190,70,0,0.22)]"
                    : "bg-[#fff3e5] text-slate-800 shadow-[4px_5px_10px_rgba(0,0,0,0.08),-3px_-3px_8px_rgba(255,255,255,0.95),inset_1px_1px_3px_rgba(255,255,255,0.8)]"
                }
              `}
            >
              <svg
                width="15"
                height="15"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="m12 3 9 5-9 5-9-5 9-5Z" />
                <path d="m3 12 9 5 9-5" />
                <path d="m3 16 9 5 9-5" />
              </svg>

              All
            </button>

            {/* NEAR ME */}

            <button
              type="button"
              onClick={() =>
                handleFilter("near")
              }
              disabled={nearbyLoading}
              className={`
                inline-flex h-[40px]
                shrink-0
                items-center justify-center
                gap-1.5
                rounded-full
                border border-orange-100
                px-3.5
                text-[13px]
                font-semibold
                transition-all
                duration-200
                active:scale-[0.97]
                ${
                  filter === "near"
                    ? "bg-[#ff7417] text-white border-orange-300 shadow-[5px_6px_12px_rgba(255,116,23,0.28),inset_2px_2px_4px_rgba(255,255,255,0.28),inset_-2px_-2px_5px_rgba(190,70,0,0.22)]"
                    : "bg-[#fff3e5] text-slate-800 shadow-[4px_5px_10px_rgba(0,0,0,0.08),-3px_-3px_8px_rgba(255,255,255,0.95),inset_1px_1px_3px_rgba(255,255,255,0.8)]"
                }
                ${
                  nearbyLoading
                    ? "cursor-wait opacity-70"
                    : ""
                }
              `}
            >
              <svg
                width="15"
                height="15"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M20 10c0 5-8 11-8 11S4 15 4 10a8 8 0 1 1 16 0Z" />
                <circle
                  cx="12"
                  cy="10"
                  r="2.5"
                />
              </svg>

              {nearbyLoading
                ? "..."
                : "Near Me"}
            </button>

            {/* TOP RATED */}

            <button
              type="button"
              onClick={() =>
                handleFilter("top")
              }
              className={`
                inline-flex h-[40px]
                shrink-0
                items-center justify-center
                gap-1.5
                rounded-full
                border border-orange-100
                px-3.5
                text-[13px]
                font-semibold
                transition-all
                duration-200
                active:scale-[0.97]
                ${
                  filter === "top"
                    ? "bg-[#ff7417] text-white border-orange-300 shadow-[5px_6px_12px_rgba(255,116,23,0.28),inset_2px_2px_4px_rgba(255,255,255,0.28),inset_-2px_-2px_5px_rgba(190,70,0,0.22)]"
                    : "bg-[#fff3e5] text-slate-800 shadow-[4px_5px_10px_rgba(0,0,0,0.08),-3px_-3px_8px_rgba(255,255,255,0.95),inset_1px_1px_3px_rgba(255,255,255,0.8)]"
                }
              `}
            >
              <svg
                width="15"
                height="15"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="m12 3 2.8 5.7 6.2.9-4.5 4.4 1.1 6.2-5.6-2.9-5.6 2.9 1.1-6.2L3 9.6l6.2-.9L12 3Z" />
              </svg>

              Top Rated
            </button>

            {/* HOME SERVICE */}

            <button
              type="button"
              onClick={() =>
                handleFilter("home")
              }
              className={`
                inline-flex h-[40px]
                shrink-0
                items-center justify-center
                gap-1.5
                rounded-full
                border border-orange-100
                px-3.5
                text-[13px]
                font-semibold
                transition-all
                duration-200
                active:scale-[0.97]
                ${
                  filter === "home"
                    ? "bg-[#ff7417] text-white border-orange-300 shadow-[5px_6px_12px_rgba(255,116,23,0.28),inset_2px_2px_4px_rgba(255,255,255,0.28),inset_-2px_-2px_5px_rgba(190,70,0,0.22)]"
                    : "bg-[#fff3e5] text-slate-800 shadow-[4px_5px_10px_rgba(0,0,0,0.08),-3px_-3px_8px_rgba(255,255,255,0.95),inset_1px_1px_3px_rgba(255,255,255,0.8)]"
                }
              `}
            >
              <svg
                width="15"
                height="15"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M3 10.5 12 3l9 7.5" />
                <path d="M5 9.5V21h14V9.5" />
                <path d="M9 21v-6h6v6" />
                        </svg>

              Home Service
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