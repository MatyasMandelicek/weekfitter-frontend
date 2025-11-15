import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error("Chybí REACT_APP_SUPABASE_URL nebo REACT_APP_SUPABASE_ANON_KEY v .env");
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
