// API service for backend endpoints
const BASE_URL = 'https://saloon-backend-gp4v.onrender.com';

const TOKEN_KEY = 'auth_token';

interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
}

// Get stored token
export function getAuthToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

// Store token
export function setAuthToken(token: string): void {
  localStorage.setItem(TOKEN_KEY, token);
}

// Remove token
export function removeAuthToken(): void {
  localStorage.removeItem(TOKEN_KEY);
}

// Check if user is logged in
export function isAuthenticated(): boolean {
  return !!getAuthToken();
}

// Helper function for API calls with Authorization header
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

    const data = await response.json();

    if (!response.ok) {
      return { success: false, error: data.message || data.error || 'Request failed' };
    }

    return { success: true, data };
  } catch (error) {
    return { success: false, error: 'Network error. Please try again.' };
  }
}

// ==========================================
// AUTH ENDPOINTS
// ==========================================

// POST /api/auth/login
export interface LoginData {
  email: string;
  password: string;
}

export interface LoginResponse {
  token: string;
}

export async function login(data: LoginData): Promise<ApiResponse<LoginResponse>> {
  const result = await apiCall<LoginResponse>('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify(data),
  }, false);

  // Store token on successful login
  if (result.success && result.data?.token) {
    setAuthToken(result.data.token);
  }

  return result;
}

// ==========================================
// BARBER ENDPOINTS
// ==========================================

// POST /api/barber/register
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

// POST /api/barber/approve/:id
export async function approveBarber(barberId: string): Promise<ApiResponse> {
  return apiCall(`/api/barber/approve/${barberId}`, {
    method: 'POST',
  });
}

// POST /api/barber/add-service
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

// POST /api/booking/create
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
