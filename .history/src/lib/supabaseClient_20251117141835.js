/**
 * supabaseClient.js
 * 
 * Konfigurace a inicializace klienta pro Supabase.
 * 
 * Načítá URL a veřejný klíč z .env souboru.
 * Pokud některá proměnná chybí, vypíše chybu do konzole.
 * Exportuje vytvořený Supabase klient pro použití v celé aplikaci.
 */

import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error("Chybí REACT_APP_SUPABASE_URL nebo REACT_APP_SUPABASE_ANON_KEY v .env");
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
