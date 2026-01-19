// API service for backend endpoints
const BASE_URL = 'https://saloon-backend-gp4v.onrender.com';

interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
}

// Helper function for API calls
async function apiCall<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  try {
    const response = await fetch(`${BASE_URL}${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    const data = await response.json();

    if (!response.ok) {
      return { success: false, error: data.message || 'Request failed' };
    }

    return { success: true, data };
  } catch (error) {
    return { success: false, error: 'Network error. Please try again.' };
  }
}

// POST /api/barber/register
export interface BarberRegisterData {
  fullName: string;
  shopName: string;
  phone: string;
  email: string;
  address: string;
  description: string;
  imageUrl?: string;
}

export async function registerBarber(data: BarberRegisterData): Promise<ApiResponse> {
  return apiCall('/api/barber/register', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

// POST /api/barber/approve/:id
export async function approveBarber(id: string): Promise<ApiResponse> {
  return apiCall(`/api/barber/approve/${id}`, {
    method: 'POST',
  });
}

// POST /api/barber/add-service
export interface AddServiceData {
  name: string;
  price: number;
  duration: number;
}

export async function addService(data: AddServiceData): Promise<ApiResponse> {
  return apiCall('/api/barber/add-service', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

// POST /api/booking/create
export interface CreateBookingData {
  barber_id: string;
  service_id: string;
  date: string;
  time: string;
}

export async function createBooking(data: CreateBookingData): Promise<ApiResponse> {
  return apiCall('/api/booking/create', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}
