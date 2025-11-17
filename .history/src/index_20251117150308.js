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
import "./index.css"; // globální styly
import { AUTH_STORAGE_KEY } from "./lib/config";

/**
 * Probuzení backendu po startu.
 * Render (free-tier) usíná → první request by byl pomalý.
 * Tímto pingem ho „nahřejeme“ předem.
 */
fetch("https://weekfitter-backend.onrender.com/api/health").catch(() => {});

/**
 * Inicializace kořenového prvku aplikace.
 * index.html obsahuje <div id="root"></div>, sem se vloží React.
 */
const root = ReactDOM.createRoot(document.getElementById("root"));

/**
 * React.StrictMode zapíná dodatečné kontroly během vývoje.
 * Pomáhá odhalit špatné praktiky nebo neočekávané vedlejší efekty.
 */
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

/**
 * Odhlášení uživatele při každém načtení aplikace.
 * Použití to při vývoji (fresh start po reloadu).
 * Stačí tuto sekci odstranit.
 */
localStorage.removeItem(AUTH_STORAGE_KEY);
localStorage.removeItem("isLoggedIn");
localStorage.removeItem("userEmail");
localStorage.removeItem("userName");
