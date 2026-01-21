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

// GET /api/booking/my - Get user's bookings
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

// GET /api/booking/all - Admin: get all bookings
export async function getAllBookings(): Promise<ApiResponse<BookingData[]>> {
  return apiCall<BookingData[]>('/api/booking/all', {
    method: 'GET',
  });
}

// ==========================================
// BARBER FETCH ENDPOINTS
// ==========================================

// GET /api/barber/pending - Admin: get pending barber requests
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

// GET /api/barber/approved - Get approved barbers for booking
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

// GET /api/services/:barber_id - Get services for a barber
export interface ServiceData {
  id: string;
  barber_id: string;
  name: string;
  price: number;
  duration: number;
  home_service: boolean;
}

// GET /api/barber/me - Get current barber's profile (to get barber_id)
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

// GET /api/booking/barber - Barber: get bookings for their shop
export async function getBarberBookings(): Promise<ApiResponse<BookingData[]>> {
  return apiCall<BookingData[]>('/api/booking/barber', {
    method: 'GET',
  });
}

// GET /api/barber/my-services - Get barber's own services
export async function getMyServices(): Promise<ApiResponse<ServiceData[]>> {
  return apiCall<ServiceData[]>('/api/barber/my-services', {
    method: 'GET',
  });
}

// PATCH /api/barber/service/:id - Edit a service
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

// PATCH /api/booking/cancel/:id - Cancel a booking
export async function cancelBooking(bookingId: string): Promise<ApiResponse> {
  return apiCall(`/api/booking/cancel/${bookingId}`, {
    method: 'PATCH',
  });
}

// ==========================================
// ADMIN ENDPOINTS
// ==========================================

// GET /api/admin/users - Admin: get all users
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
