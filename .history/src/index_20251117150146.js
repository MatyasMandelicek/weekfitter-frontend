/**
 * index.js
 *
 * Vstupní bod React aplikace WeekFitter.
 * 
 * - připraví React root
 * - načte globální CSS
 * - vyrendruje hlavní komponentu <App />
 * - probudí backend (Render free-tier wake-up)
 * - po reloadu aplikace provede odhlášení uživatele
 */

import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./index.css"; // Import globálních stylů
import { AUTH_STORAGE_KEY } from "./lib/config";

/**
 * Probuzení backendu po startu.
 * Render (free-tier) usíná → první request by byl pomalý.
 * Tímto pingem ho „nahřejeme“ předem.
 */
fetch("https://weekfitter-backend.onrender.com/api/health").catch(() => {});

/**
 * Vytvoření "root" elementu, který React používá pro render celé aplikace.
 * index.html obsahuje <div id="root"></div>, sem se vloží App.
 */
const root = ReactDOM.createRoot(document.getElementById("root"));

/**
 * <React.StrictMode> aktivuje dodatečné kontroly v Reactu.
 * Pomáhá detekovat potenciální problémy v komponentách (např. vedlejší efekty).
 */
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// Odhlásení uživatele při načtení aplikace
localStorage.removeItem(AUTH_STORAGE_KEY);
localStorage.removeItem("isLoggedIn");
localStorage.removeItem("userEmail");
localStorage.removeItem("userName");
