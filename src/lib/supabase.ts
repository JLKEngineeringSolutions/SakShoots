import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type Enquiry = {
  id?: string;
  name: string;
  email: string;
  business?: string;
  ideal_date?: string;
  project_type?: string;
  budget?: string;
  brief?: string;
  created_at?: string;
};
