import { createClient } from '@supabase/supabase-js';

// Vite uses import.meta.env instead of process.env
// Variables MUST start with VITE_ to be accessible in the browser
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

// This prevents the app from crashing if keys are missing
export const supabase = (supabaseUrl && supabaseAnonKey) 
  ? createClient(supabaseUrl, supabaseAnonKey) 
  : null;
