/**
 * App.js
 *
 * Hlavní komponenta aplikace WeekFitter.
 *
 * Zajišťuje směrování (routing) pomocí React Routeru.
 * Odděluje veřejné stránky (login, registrace, reset hesla)
 * od chráněných sekcí aplikace (kalendář, dashboard, profil).
 *
 * Chráněné trasy jsou zapouzdřené v komponentě <ProtectedRoute>,
 * která ověřuje, zda je uživatel přihlášen.
 */

import React from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";

// Stránky aplikace
import HomePage from "./pages/HomePage";
import LoginPage from "./pages/LoginPage";
import DashboardPage from "./pages/DashboardPage";
import CalendarPage from "./pages/CalendarPage";
import RegisterPage from "./pages/RegisterPage";
import ForgotPasswordPage from "./pages/ForgotPasswordPage";
import ResetPasswordPage from "./pages/ResetPasswordPage";
import ProfilePage from "./pages/ProfilePage";

// Komponenta pro chráněné cesty
import ProtectedRoute from "./components/ProtectedRoute";

/**
 * Hlavní komponenta aplikace – obsahuje definici všech rout.
 * Router obaluje celou aplikaci a určuje, co se renderuje při jaké URL.
 */
function App() {
  return (
    <Router>
      <Routes>
        {/* Veřejné stránky – dostupné bez přihlášení */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/reset-password/:token" element={<ResetPasswordPage />} />

        {/* Přesměrování rootu na domovskou stránku */}
        <Route path="/" element={< Navigate to ="/home" replace />} />
        <Route path="/home" element={<HomePage />} />

        {/* Sekce s daty a profilem */}
        <Route element={<ProtectedRoute />}>
          <Route path="/calendar" element={<CalendarPage />} />
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/profile" element={<ProfilePage />} />
        </Route>

        {/* Fallback - když uživatel zadá neexistující cestu */}
        <Route path="*" element={<Navigate to="/home" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
