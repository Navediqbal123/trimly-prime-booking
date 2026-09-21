import { useEffect, useState } from 'react';
import GoogleMapView from '@/components/maps/GoogleMapView';
import { getApprovedBarbers, ApprovedBarberData } from '@/lib/api';

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

  return (
    <div className="min-h-screen bg-white px-4 pb-24 pt-4">
      <div className="mb-4">
        <h1 className="text-2xl font-bold text-slate-800">Trimly Map</h1>
        <p className="mt-1 text-sm text-slate-500">
          Find nearby barber shops
        </p>
      </div>

      <GoogleMapView barbers ={barbers} />
    </div>
  );
}