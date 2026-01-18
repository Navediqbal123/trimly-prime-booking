import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://tojsyblbhahkhmbuzmsq.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRvanN5YmxiaGFoa2htYnV6bXNxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjgyMjQ5MjMsImV4cCI6MjA4MzgwMDkyM30.drLOSPq0SmwgFx222z3Q0Noaiy-BeA9R-npJmz7ehfA';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type UserRole = 'user' | 'barber_pending' | 'barber' | 'admin' | 'super_admin';

export interface Profile {
  id: string;
  email: string;
  full_name: string;
  role: UserRole;
  phone?: string;
  avatar_url?: string;
  created_at: string;
}

export interface BarberShop {
  id: string;
  owner_id: string;
  shop_name: string;
  description: string;
  address: string;
  phone: string;
  image_url: string;
  is_approved: boolean;
  created_at: string;
}

export interface Service {
  id: string;
  shop_id: string;
  name: string;
  duration: number;
  price: number;
  created_at: string;
}

export interface Booking {
  id: string;
  user_id: string;
  shop_id: string;
  service_id: string;
  date: string;
  time: string;
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled';
  created_at: string;
}

export const SUPER_ADMIN_EMAIL = 'navedahmad9012@gmail.com';
