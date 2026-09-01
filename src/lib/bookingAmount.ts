import { BookingData, ServiceData } from '@/lib/api';

export function buildServiceMap(services: ServiceData[]): Map<string, ServiceData> {
  const m = new Map<string, ServiceData>();
  services.forEach((s) => m.set(s.id, s));
  return m;
}

/**
 * Total value of a booking, resolved only from the booking payload and the
 * barber's own services list (no profiles join required).
 */
export function bookingAmount(b: BookingData, serviceMap?: Map<string, ServiceData>): number {
  if (b.services && b.services.length > 0) {
    const sum = b.services.reduce((acc, s) => acc + (Number(s.price) || 0), 0);
    if (sum > 0) return sum;
  }
  if (b.service_ids && b.service_ids.length > 0 && serviceMap) {
    const sum = b.service_ids.reduce(
      (acc, id) => acc + (Number(serviceMap.get(id)?.price) || 0),
      0,
    );
    if (sum > 0) return sum;
  }
  const direct = Number(b.service?.price) || 0;
  if (direct > 0) return direct;
  if (b.service_id && serviceMap) {
    return Number(serviceMap.get(b.service_id)?.price) || 0;
  }
  return 0;
}

export function bookingServiceNames(
  b: BookingData,
  serviceMap?: Map<string, ServiceData>,
): string[] {
  if (b.services && b.services.length > 0) return b.services.map((s) => s.name).filter(Boolean);
  if (b.service_ids && b.service_ids.length > 0 && serviceMap) {
    const names = b.service_ids.map((id) => serviceMap.get(id)?.name).filter(Boolean) as string[];
    if (names.length) return names;
  }
  if (b.service?.name) return [b.service.name];
  if (b.service_id && serviceMap) {
    const n = serviceMap.get(b.service_id)?.name;
    if (n) return [n];
  }
  return [];
}
