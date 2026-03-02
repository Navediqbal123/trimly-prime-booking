// API service for backend endpoints
import { toast } from 'sonner';

const BASE_URL = 'https://saloon-backend-gp4v.onrender.com';

interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
}

// ==========================================
// SESSION AUTH - No localStorage, cookies only
// ==========================================

// Handle session expiry
export function handleSessionExpiry(showToast = true): void {
  if (showToast) {
    toast.error('Session expired. Please login again.');
  }
}

// ==========================================
// API INTERCEPTOR - credentials: 'include' on ALL requests
// ==========================================

async function apiCall<T>(
  endpoint: string,
  options: RequestInit = {},
  requiresAuth = true
): Promise<ApiResponse<T>> {
  try {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string>),
    };

    const response = await fetch(`${BASE_URL}${endpoint}`, {
      ...options,
      headers,
      credentials: 'include', // Send HTTP-only cookies with every request
    });

    // Handle 401 Unauthorized responses
    if (response.status === 401) {
      if (requiresAuth) {
        handleSessionExpiry(true);
      }
      return { success: false, error: 'Session expired' };
    }

    let data: any;
    try {
      data = await response.json();
    } catch {
      data = {};
    }

    if (!response.ok) {
      const errorMessage = data.message || data.error || data.msg || data.detail || JSON.stringify(data) || `Request failed with status ${response.status}`;
      console.error('API error response:', { status: response.status, url: `${BASE_URL}${endpoint}`, body: data });
      return { success: false, error: errorMessage };
    }

    return { success: true, data };
  } catch (error) {
    console.error('API call error:', error, '| URL:', `${BASE_URL}${endpoint}`);
    return { success: false, error: 'Network error. Please try again.' };
  }
}

// ==========================================
// AUTH ENDPOINTS
// ==========================================

export interface LoginData {
  email: string;
  password: string;
}

export interface AuthUserData {
  id: string;
  email: string;
  name?: string;
  role?: string;
}

export interface RegisterData {
  email: string;
  password: string;
  name: string;
  phone?: string;
  role?: string;
}

// POST /api/auth/signup
export async function register(data: RegisterData): Promise<ApiResponse<AuthUserData>> {
  return apiCall<AuthUserData>('/api/auth/signup', {
    method: 'POST',
    body: JSON.stringify({
      email: data.email,
      password: data.password,
      name: data.name,
      phone: data.phone || '',
      role: data.role || 'user',
    }),
  }, false);
}

// POST /api/auth/login
export async function login(data: LoginData): Promise<ApiResponse<AuthUserData>> {
  return apiCall<AuthUserData>('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify(data),
  }, false);
}

// GET /api/auth/me - Check current session
export async function getMe(): Promise<ApiResponse<AuthUserData>> {
  return apiCall<AuthUserData>('/api/auth/me', {
    method: 'GET',
  }, false);
}

// POST /api/auth/logout
export async function logout(): Promise<ApiResponse> {
  return apiCall('/api/auth/logout', {
    method: 'POST',
  }, false);
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
}

export async function addService(data: AddServiceData): Promise<ApiResponse> {
  return apiCall('/api/barber/add-service', {
    method: 'POST',
    body: JSON.stringify(data),
  });
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

export async function getMyServices(): Promise<ApiResponse<ServiceData[]>> {
  return apiCall<ServiceData[]>('/api/barber/my-services', { method: 'GET' });
}

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

// ==========================================
// USER ROLE FETCH (from backend)
// ==========================================

export async function getMyRole(): Promise<ApiResponse<{ role: string }>> {
  const barberResult = await apiCall<BarberProfileData>('/api/barber/me', { method: 'GET' });
  
  if (barberResult.success && barberResult.data) {
    if (barberResult.data.status === 'approved') {
      return { success: true, data: { role: 'barber' } };
    }
    if (barberResult.data.status === 'pending') {
      return { success: true, data: { role: 'barber_pending' } };
    }
  }
  
  return { success: true, data: { role: 'user' } };
}
