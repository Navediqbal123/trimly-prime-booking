// API service for backend endpoints (data only — auth is handled by Supabase client)
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';

const BASE_URL = 'https://saloon-backend-gp4v.onrender.com';

interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
}

async function apiCall<T>(
  endpoint: string,
  options: RequestInit = {},
): Promise<ApiResponse<T>> {
  try {
    // Get Supabase session token
    const { data: { session } } = await supabase.auth.getSession();
    const token = session?.access_token;

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers as Record<string, string>),
    };

    const response = await fetch(`${BASE_URL}${endpoint}`, {
      ...options,
      headers,
    });

    let data: any;
    try {
      data = await response.json();
    } catch {
      data = {};
    }

    if (!response.ok) {
      const errorMessage = data.message || data.error || data.msg || data.detail || `Request failed with status ${response.status}`;
      console.error(`API ${response.status} on ${endpoint}:`, JSON.stringify(data));
      return { success: false, error: `[${response.status}] ${errorMessage}` };
    }

    return { success: true, data };
  } catch (error) {
    console.error('API call error:', error, '| URL:', `${BASE_URL}${endpoint}`);
    return { success: false, error: 'Network error. Please try again.' };
  }
}

// ==========================================
// RESPONSE NORMALIZERS
// Backends may return a bare array, or wrap it as
// { data: [] } / { services: [] } / { barbers: [] } / { results: [] }.
// ==========================================

function asList<T>(payload: unknown): T[] {
  if (Array.isArray(payload)) return payload as T[];
  if (payload && typeof payload === 'object') {
    const obj = payload as Record<string, unknown>;
    for (const key of ['data', 'services', 'barbers', 'results', 'items', 'rows']) {
      if (Array.isArray(obj[key])) return obj[key] as T[];
    }
  }
  return [];
}

function normalizeService(raw: any): ServiceData {
  return {
    id: String(raw?.id ?? raw?.service_id ?? raw?._id ?? ''),
    barber_id: String(raw?.barber_id ?? raw?.barberId ?? raw?.barber?.id ?? ''),
    name: raw?.name ?? raw?.service_name ?? raw?.title ?? 'Service',
    price: Number(raw?.price ?? raw?.cost ?? raw?.amount ?? 0),
    duration: Number(raw?.duration ?? raw?.duration_minutes ?? raw?.minutes ?? 0),
    home_service: Boolean(raw?.home_service ?? raw?.is_home_service ?? false),
  };
}

async function fetchServiceList(endpoint: string): Promise<ApiResponse<ServiceData[]>> {
  const res = await apiCall<unknown>(endpoint, { method: 'GET' });
  if (!res.success) return { success: false, error: res.error };
  return { success: true, data: asList<any>(res.data).map(normalizeService) };
}


// ==========================================
// BARBER ENDPOINTS
// ==========================================

export interface BarberRegisterData {
  shop_name: string;
  location: string;
}

export interface BarberRegisterResponse {
  success: boolean;
  barber_id: string;
}

export async function registerBarber(data: BarberRegisterData): Promise<ApiResponse<BarberRegisterResponse>> {
  return apiCall<BarberRegisterResponse>('/api/barber/register', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function approveBarber(requestId: string, userId: string): Promise<ApiResponse> {
  return apiCall(`/api/admin/approve-barber`, {
    method: 'POST',
    body: JSON.stringify({ id: requestId, user_id: userId }),
  });
}

export interface AddServiceData {
  name: string;
  price: number;
  duration: number;
  home_service: boolean;
  barber_id?: string;
}

/** Fetches the logged-in user's barber_id from /api/barber/me; auto-registers if missing. */
export async function addService(data: AddServiceData): Promise<ApiResponse> {
  if (!data.barber_id) {
    let profile = await getMyBarberProfile();

    // Auto-register barber profile if not found
    if (!profile.success || !profile.data?.id) {
      const regResult = await registerBarber({ shop_name: 'My Salon', location: 'Not set' });
      if (!regResult.success || !regResult.data?.barber_id) {
        return { success: false, error: regResult.error || 'Failed to auto-create barber profile.' };
      }
      data = { ...data, barber_id: regResult.data.barber_id };
      return apiCall('/api/barber/add-service', {
        method: 'POST',
        body: JSON.stringify(data),
      });
    }

    data = { ...data, barber_id: profile.data.id };
  }
  return apiCall('/api/barber/add-service', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function getMyServices(): Promise<ApiResponse<ServiceData[]>> {
  // Auth token is attached automatically by apiCall (barber-scoped list)
  return fetchServiceList('/api/services');
}


// ==========================================
// BOOKING ENDPOINTS
// ==========================================

export interface CreateBookingData {
  barber_id: string;
  service_id: string;
  date: string;
  time_slot: string;
  home_service: boolean;
}

export async function checkSlotAvailability(
  barber_id: string,
  date: string,
  time_slot: string,
): Promise<ApiResponse<{ available: boolean }>> {
  const qs = new URLSearchParams({ barber_id, date, time_slot }).toString();
  return apiCall<{ available: boolean }>(`/api/booking/check-slot?${qs}`, { method: 'GET' });
}

export async function createBooking(data: CreateBookingData): Promise<ApiResponse> {
  return apiCall('/api/booking/create', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

/** Helper: resolve the current user's barber_id from /api/barber/me */
export async function getMyBarberId(): Promise<string | null> {
  const res = await getMyBarberProfile();
  return res.success && res.data?.id ? res.data.id : null;
}

export interface BookingData {
  id: string;
  barber_id: string;
  service_id: string;
  user_id?: string;
  customer_id?: string;
  date: string;
  time_slot: string;
  status: string;
  home_service: boolean;
  otp?: string;
  created_at?: string;
  barber?: {
    shop_name: string;
    location: string;
  };
  service?: {
    name: string;
    price: number;
  };
  user?: {
    name?: string;
    full_name?: string;
    email?: string;
  };
}


export async function getMyBookings(): Promise<ApiResponse<BookingData[]>> {
  return apiCall<BookingData[]>('/api/booking/my', { method: 'GET' });
}

export async function getAllBookings(): Promise<ApiResponse<BookingData[]>> {
  return apiCall<BookingData[]>('/api/booking/all', { method: 'GET' });
}

// ==========================================
// BARBER FETCH ENDPOINTS
// ==========================================

export interface PendingBarberData {
  id: string;
  user_id: string;
  shop_name: string;
  location: string;
  status: string;
  created_at: string;
  user?: { email: string; name: string };
}

export async function getPendingBarbers(): Promise<ApiResponse<PendingBarberData[]>> {
  const res = await apiCall<unknown>('/api/barber/pending', { method: 'GET' });
  if (!res.success) return { success: false, error: res.error };
  return { success: true, data: asList<PendingBarberData>(res.data) };
}


export interface ApprovedBarberData {
  id: string;
  shop_name: string;
  location: string;
  user_id: string;
  status: string;
  user?: { email: string; name: string };
}

export async function getApprovedBarbers(): Promise<ApiResponse<ApprovedBarberData[]>> {
  const res = await apiCall<unknown>('/api/barber/approved', { method: 'GET' });
  if (!res.success) return { success: false, error: res.error };
  return { success: true, data: asList<ApprovedBarberData>(res.data) };
}


// ==========================================
// SERVICES ENDPOINTS
// ==========================================

export interface ServiceData {
  id: string;
  barber_id: string;
  name: string;
  price: number;
  duration: number;
  home_service: boolean;
}

export interface BarberProfileData {
  id: string;
  shop_name: string;
  location: string;
  status: string;
}

export async function getMyBarberProfile(): Promise<ApiResponse<BarberProfileData>> {
  return apiCall<BarberProfileData>('/api/barber/me', { method: 'GET' });
}

export async function getBarberServices(barberId: string): Promise<ApiResponse<ServiceData[]>> {
  const qs = new URLSearchParams({ barber_id: barberId }).toString();
  const primary = await fetchServiceList(`/api/services?${qs}`);
  if (primary.success && primary.data && primary.data.length > 0) {
    return { success: true, data: primary.data.filter((s) => !s.barber_id || s.barber_id === barberId) };
  }

  // Fallback 1: alt route some backends expose
  const alt = await fetchServiceList(`/api/barber/${barberId}/services`);
  if (alt.success && alt.data && alt.data.length > 0) return alt;

  // Fallback 2: fetch all services and filter client-side
  const all = await fetchServiceList('/api/services');
  if (all.success && all.data) {
    return { success: true, data: all.data.filter((s) => s.barber_id === barberId) };
  }
  return primary;
}


export async function getBarberBookings(): Promise<ApiResponse<BookingData[]>> {
  return apiCall<BookingData[]>('/api/booking/barber', { method: 'GET' });
}

// getMyServices moved above near addService

export interface UpdateServiceData {
  name?: string;
  price?: number;
  duration?: number;
  home_service?: boolean;
}

export async function updateService(serviceId: string, data: UpdateServiceData): Promise<ApiResponse> {
  return apiCall(`/api/barber/service/${serviceId}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
}

export async function cancelBooking(bookingId: string): Promise<ApiResponse> {
  return apiCall(`/api/booking/cancel/${bookingId}`, { method: 'PATCH' });
}

export async function updateBookingStatus(
  bookingId: string,
  status: 'approved' | 'rejected' | 'completed',
): Promise<ApiResponse> {
  return apiCall(`/api/booking/status/${bookingId}`, {
    method: 'PATCH',
    body: JSON.stringify({ status }),
  });
}

export async function verifyBookingOtp(booking_id: string, otp: string): Promise<ApiResponse> {
  return apiCall('/api/booking/verify-otp', {
    method: 'POST',
    body: JSON.stringify({ booking_id, otp }),
  });
}

// ==========================================
// ADMIN ENDPOINTS
// ==========================================

export interface UserData {
  id: string;
  email: string;
  name: string;
  role: string;
  created_at: string;
}

export async function getAdminUsers(): Promise<ApiResponse<UserData[]>> {
  return apiCall<UserData[]>('/api/admin/users', { method: 'GET' });
}

// ==========================================
// NOTIFICATIONS
// ==========================================

export interface NotificationData {
  id: string;
  message: string;
  read: boolean;
  created_at: string;
}

export async function getNotifications(): Promise<ApiResponse<NotificationData[]>> {
  return apiCall<NotificationData[]>('/api/booking/notifications', { method: 'GET' });
}

export async function markNotificationsRead(): Promise<ApiResponse> {
  return apiCall('/api/booking/notifications/read', { method: 'PATCH' });
}

