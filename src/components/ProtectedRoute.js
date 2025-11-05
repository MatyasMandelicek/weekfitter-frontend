/**
 * ProtectedRoute.js
 * Ochrana přístupu k soukromým stránkám
 * 
 * Kontroluje, zda je uživatel přihlášen
 * Pokud není, přesměruje ho na přihlašovací stránku
 */

import React from "react";
import { Navigate, Outlet } from "react-router-dom";
import { AUTH_STORAGE_KEY } from "../lib/config";

const ProtectedRoute = () => {
  const isLoggedIn = localStorage.getItem(AUTH_STORAGE_KEY) === "true";

  // Pokud není přihlášený, přesměruj ho na login
  return isLoggedIn ? <Outlet /> : <Navigate to="/login" replace />;
};

export default ProtectedRoute;
