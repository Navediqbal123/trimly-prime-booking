import GoogleMapView from '@/components/maps/GoogleMapView';

export default function Map() {
  return (
    <div className="min-h-screen bg-white px-4 pb-24 pt-4">
      <div className="mb-4">
        <h1 className="text-2xl font-bold text-slate-800">Trimly Map</h1>
        <p className="mt-1 text-sm text-slate-500">
          Find nearby barber shops
        </p>
      </div>

      <GoogleMapView />
    </div>
  );
}