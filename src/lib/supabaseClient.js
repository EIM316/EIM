import { createClient } from "@supabase/supabase-js";

// ✅ Your Supabase environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// ✅ Create a single client for the whole app
export const supabase = createClient(supabaseUrl, supabaseAnonKey);
