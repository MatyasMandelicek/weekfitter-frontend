/**
 * config.js
 * 
 * Konfigurační soubor celé aplikace WeekFitter.
 * 
 * Obsahuje základní konstanty a nastavení, která se používají napříč frontendem.
 * Umožňuje přepínat mezi lokálním a produkčním backendem (pomocí proměnných prostředí).
 */

// API endpoint – vezme URL z .env (REACT_APP_API_URL), pokud není dostupná, použije lokální backend
export const API_URL = process.env.REACT_APP_API_URL || "http://localhost:8080";

// Klíč v localStorage používaný pro ověření, zda je uživatel přihlášen
export const AUTH_STORAGE_KEY = "isLoggedIn";