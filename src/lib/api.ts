// API service for backend endpoints
import { toast } from 'sonner';

const BASE_URL = 'https://saloon-backend-gp4v.onrender.com';

const TOKEN_KEY = 'auth_token';
const EXPIRES_KEY = 'auth_expires_at';
const USER_KEY = 'auth_user';

interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
}

// ==========================================
// TOKEN MANAGEMENT
// ==========================================

// Get stored token
export function getAuthToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

// Get token expiry timestamp
export function getTokenExpiry(): number | null {
  const expiry = localStorage.getItem(EXPIRES_KEY);
  return expiry ? parseInt(expiry, 10) : null;
}

// Get stored user
export function getStoredUser(): { email: string; id: string } | null {
  const user = localStorage.getItem(USER_KEY);
  if (user) {
    try {
      return JSON.parse(user);
    } catch {
      return null;
    }
  }
  return null;
}

// Store token with expiry
export function setAuthToken(token: string, expiresAt?: number): void {
  localStorage.setItem(TOKEN_KEY, token);
  if (expiresAt) {
    localStorage.setItem(EXPIRES_KEY, expiresAt.toString());
  }
}

// Store user data
export function setStoredUser(user: { email: string; id: string }): void {
  localStorage.setItem(USER_KEY, JSON.stringify(user));
}

// Remove all auth data
export function removeAuthToken(): void {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(EXPIRES_KEY);
  localStorage.removeItem(USER_KEY);
}

// Check if token is expired
export function isTokenExpired(): boolean {
  const expiry = getTokenExpiry();
  if (!expiry) return true;
  return Date.now() >= expiry;
}

// Check if user is logged in with valid token
export function isAuthenticated(): boolean {
  const token = getAuthToken();
  if (!token) return false;
  return !isTokenExpired();
}

// Handle session expiry - centralized logout (no redirect, let components handle it)
export function handleSessionExpiry(showToast = true): void {
  removeAuthToken();
  if (showToast) {
    toast.error('Session expired. Please login again.');
  }
}

// ==========================================
// API INTERCEPTOR
// ==========================================

async function apiCall<T>(
  endpoint: string,
  options: RequestInit = {},
  requiresAuth = true
): Promise<ApiResponse<T>> {
  try {
    // Pre-flight check for auth required calls
    if (requiresAuth) {
      const token = getAuthToken();
      if (!token) {
        handleSessionExpiry(false);
        return { success: false, error: 'No authentication token' };
      }
      
      if (isTokenExpired()) {
        handleSessionExpiry(true);
        return { success: false, error: 'Session expired' };
      }
    }

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string>),
    };

    // Add Authorization header if token exists and auth is required
    if (requiresAuth) {
      const token = getAuthToken();
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
    }

    const response = await fetch(`${BASE_URL}${endpoint}`, {
      ...options,
      headers,
    });

    // Handle 401 Unauthorized responses
    if (response.status === 401) {
      handleSessionExpiry(true);
      return { success: false, error: 'Session expired' };
    }

    const data = await response.json();

    // Check for token-related error messages
    if (!response.ok) {
      const errorMessage = data.message || data.error || 'Request failed';
      
      // Check for token expiry/invalid messages
      if (
        errorMessage.toLowerCase().includes('invalid') && 
        (errorMessage.toLowerCase().includes('token') || errorMessage.toLowerCase().includes('expired'))
      ) {
        handleSessionExpiry(true);
        return { success: false, error: 'Session expired' };
      }
      
      if (errorMessage.toLowerCase().includes('unauthorized')) {
        handleSessionExpiry(true);
        return { success: false, error: 'Session expired' };
      }

      return { success: false, error: errorMessage };
    }

    return { success: true, data };
  } catch (error) {
    console.error('API call error:', error, '| URL:', `${BASE_URL}${endpoint}`);
    return { success: false, error: 'Network error. Please try again.' };
  }
}

// ==========================================
// JWT DECODER
// ==========================================

export function decodeJWT(token: string): { id?: string; email?: string; role?: string; exp?: number; iat?: number } | null {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonPayload);
  } catch {
    return null;
  }
}

// ==========================================
// AUTH ENDPOINTS
// ==========================================

export interface LoginData {
  email: string;
  password: string;
}

export interface LoginResponse {
  token: string;
}

export interface RegisterData {
  email: string;
  password: string;
  name: string;
}

export async function register(data: RegisterData): Promise<ApiResponse<LoginResponse>> {
  const result = await apiCall<LoginResponse>('/api/auth/register', {
    method: 'POST',
    body: JSON.stringify(data),
  }, false);

  // Store token on successful registration
  if (result.success && result.data?.token) {
    const token = result.data.token;
    const decoded = decodeJWT(token);
    
    let expiresAt: number;
    if (decoded?.exp) {
      expiresAt = decoded.exp * 1000;
    } else {
      expiresAt = Date.now() + (7 * 24 * 60 * 60 * 1000);
    }
    
    setAuthToken(token, expiresAt);
    
    if (decoded?.email && decoded?.id) {
      setStoredUser({ email: decoded.email, id: decoded.id });
    }
  }

  return result;
}

export async function login(data: LoginData): Promise<ApiResponse<LoginResponse>> {
  const result = await apiCall<LoginResponse>('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify(data),
  }, false);

  // Store token and user data on successful login
  if (result.success && result.data?.token) {
    const token = result.data.token;
    const decoded = decodeJWT(token);
    
    // Calculate expiry - use exp from JWT or default to 7 days
    let expiresAt: number;
    if (decoded?.exp) {
      expiresAt = decoded.exp * 1000; // Convert seconds to ms
    } else {
      expiresAt = Date.now() + (7 * 24 * 60 * 60 * 1000); // 7 days default
    }
    
    setAuthToken(token, expiresAt);
    
    if (decoded?.email && decoded?.id) {
      setStoredUser({ email: decoded.email, id: decoded.id });
    }
  }

  return result;
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
  return apiCall<BookingData[]>('/api/booking/my', {
    method: 'GET',
  });
}

export async function getAllBookings(): Promise<ApiResponse<BookingData[]>> {
  return apiCall<BookingData[]>('/api/booking/all', {
    method: 'GET',
  });
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
  user?: {
    email: string;
    name: string;
  };
}

export async function getPendingBarbers(): Promise<ApiResponse<PendingBarberData[]>> {
  return apiCall<PendingBarberData[]>('/api/barber/pending', {
    method: 'GET',
  });
}

export interface ApprovedBarberData {
  id: string;
  shop_name: string;
  location: string;
  user_id: string;
  status: string;
  user?: {
    email: string;
    name: string;
  };
}

export async function getApprovedBarbers(): Promise<ApiResponse<ApprovedBarberData[]>> {
  return apiCall<ApprovedBarberData[]>('/api/barber/approved', {
    method: 'GET',
  });
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
  return apiCall<BarberProfileData>('/api/barber/me', {
    method: 'GET',
  });
}

export async function getBarberServices(barberId: string): Promise<ApiResponse<ServiceData[]>> {
  return apiCall<ServiceData[]>(`/api/services/${barberId}`, {
    method: 'GET',
  });
}

export async function getBarberBookings(): Promise<ApiResponse<BookingData[]>> {
  return apiCall<BookingData[]>('/api/booking/barber', {
    method: 'GET',
  });
}

export async function getMyServices(): Promise<ApiResponse<ServiceData[]>> {
  return apiCall<ServiceData[]>('/api/barber/my-services', {
    method: 'GET',
  });
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
  return apiCall(`/api/booking/cancel/${bookingId}`, {
    method: 'PATCH',
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
  return apiCall<UserData[]>('/api/admin/users', {
    method: 'GET',
  });
}

// ==========================================
// USER ROLE FETCH (from backend)
// ==========================================

export async function getMyRole(): Promise<ApiResponse<{ role: string }>> {
  // Use barber/me to determine role from backend
  const barberResult = await apiCall<BarberProfileData>('/api/barber/me', {
    method: 'GET',
  });
  
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
