/**
 * ProtectedRoute.js
 * 
 * Komponenta pro ochranu soukromých stránek
 * 
 * Ověřuje, zda je uživatel přihlášen (kontrola přes localStorage).
 * Pokud není přihlášený, přesměruje ho na přihlašovací stránku.
 * Pokud přihlášený je, zobrazí dětské routy (Outlet).
 */

import React from "react";
import { Navigate, Outlet } from "react-router-dom";
import { AUTH_STORAGE_KEY } from "../lib/config";

const ProtectedRoute = () => {
  // kontrola přihlášení – uložený stav v localStorage
  const isLoggedIn = localStorage.getItem(AUTH_STORAGE_KEY) === "true";

  // pokud není přihlášený, přesměruj na login, jinak povol zobrazit danou stránku
  return isLoggedIn ? <Outlet /> : <Navigate to="/login" replace />;
};

export default ProtectedRoute;
