import {
  APIProvider,
  Map,
} from '@vis.gl/react-google-maps';

const DEFAULT_CENTER = {
  lat: 25.1460,
  lng: 82.5650,
};

export default function GoogleMapView() {
  return (
    <APIProvider apiKey={import.meta.env.VITE_GOOGLE_MAPS_API_KEY}>
      <div className="h-[400px] w-full overflow-hidden rounded-[24px]">
        <Map
          defaultCenter={DEFAULT_CENTER}
          defaultZoom={13}
          gestureHandling="greedy"
          disableDefaultUI={false}
        />
      </div>
    </APIProvider>
  );
}