import { createClient } from "@supabase/supabase-js";
import { isSupabaseConfigured } from "./runtime";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey)
  : createClient("https://local-demo.supabase.co", "local-demo-anon-key");
