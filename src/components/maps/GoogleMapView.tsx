import {
  APIProvider,
  Map,
  AdvancedMarker,
} from '@vis.gl/react-google-maps';
import type { ApprovedBarberData } from '@/lib/api';

interface GoogleMapViewProps {
  barbers: ApprovedBarberData[];
}

const DEFAULT_CENTER = {
  lat: 25.1460,
  lng: 82.5650,
};

export default function GoogleMapView({
  barbers,
}: GoogleMapViewProps) {
  const validBarbers = barbers.filter(
    (barber) =>
      typeof barber.latitude === 'number' &&
      typeof barber.longitude === 'number'
  );

  return (
    <APIProvider apiKey={import.meta.env.VITE_GOOGLE_MAPS_API_KEY}>
      <div className="h-[400px] w-full overflow-hidden rounded-[24px]">
        <Map
          defaultCenter={DEFAULT_CENTER}
          defaultZoom={13}
          gestureHandling="greedy"
          disableDefaultUI={false}
          mapId="TRIMLY_MAP"
        >
          {validBarbers.map((barber) => (
            <AdvancedMarker
              key={barber.id}
              position={{
                lat: barber.latitude as number,
                lng: barber.longitude as number,
              }}
              title={barber.shop_name}
            />
          ))}
        </Map>
      </div>
    </APIProvider>
  );
}