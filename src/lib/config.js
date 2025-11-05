/**
 * config.js
 * Konfigurační soubor aplikace
 * 
 * Obsahuje základní proměnné (např. API URL)
 * Umožňuje přepínat mezi vývojovým a produkčním backendem
 */

// Backend API endpoint – načte z .env nebo použije lokální server
export const API_URL = process.env.REACT_APP_API_URL || "http://localhost:8080";

// Klíč pro uložení stavu přihlášení v localStorage
export const AUTH_STORAGE_KEY = "isLoggedIn";