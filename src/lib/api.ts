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
      credentials: 'include',
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

/** Fetches the logged-in user's barber_id from /api/barber/me, then posts the service. */
export async function addService(data: AddServiceData): Promise<ApiResponse> {
  // If no barber_id provided, resolve it automatically
  if (!data.barber_id) {
    const profile = await getMyBarberProfile();
    if (!profile.success || !profile.data?.id) {
      return { success: false, error: profile.error || 'Could not resolve barber profile. Are you an approved barber?' };
    }
    data = { ...data, barber_id: profile.data.id };
  }
  return apiCall('/api/services', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function getMyServices(): Promise<ApiResponse<ServiceData[]>> {
  return apiCall<ServiceData[]>('/api/services', { method: 'GET' });
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
  date: string;
  time_slot: string;
  status: string;
  home_service: boolean;
  barber?: {
    shop_name: string;
    location: string;
  };
  service?: {
    name: string;
    price: number;
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
  return apiCall<PendingBarberData[]>('/api/barber/pending', { method: 'GET' });
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
  return apiCall<ApprovedBarberData[]>('/api/barber/approved', { method: 'GET' });
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
  return apiCall<ServiceData[]>(`/api/services/${barberId}`, { method: 'GET' });
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

