/**
 * Header.jsx
 * 
 * Hlavní hlavička aplikace WeekFitter
 * 
 * Zobrazuje logo, navigaci a přepínání menu na mobilních zařízeních.
 * Kontroluje přihlášení uživatele pomocí localStorage.
 * Umožňuje odhlášení a přesměrování na vybrané stránky.
 */

import React, { useEffect, useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import Logo from "../assets/Logo03.png";
import "../styles/Header.css";
import { AUTH_STORAGE_KEY } from "../lib/config";

const Header = () => {
  const navigate = useNavigate();
  const location = useLocation();

  // stav pro informaci, zda je uživatel přihlášen
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  // stav pro otevření / zavření mobilního menu
  const [menuOpen, setMenuOpen] = useState(false);

  // při načtení komponenty zkontroluje, zda je uživatel přihlášen
  useEffect(() => {
    setIsLoggedIn(localStorage.getItem(AUTH_STORAGE_KEY) === "true");
  }, []);

  // při změně URL se uzavře hamburger menu (kvůli mobilní verzi)
  useEffect(() => {
    setMenuOpen(false);
  }, [location.pathname]);

  // odhlášení uživatele – smaže data z localStorage a přesměruje na domovskou stránku
  const handleLogout = () => {
    localStorage.removeItem(AUTH_STORAGE_KEY);
    localStorage.removeItem("userEmail");
    localStorage.removeItem("userName");
    setIsLoggedIn(false);
    navigate("/home");
  };

  const handleLogin = () => navigate("/login");

  return (
    <header className="header">
      <div className="header-content">
        <button
          className="logo-container"
          onClick={() => navigate("/")}
          aria-label="WeekFitter domů"
        >
          <img src={Logo} alt="WeekFitter" className="header-logo" />
          <h2 className="app-name">WeekFitter</h2>
        </button>

        {/* Hamburger pro mobily */}
        <button
          className="hamburger"
          aria-label="Menu"
          aria-expanded={menuOpen}
          onClick={() => setMenuOpen((v) => !v)}
        >
          <span />
          <span />
          <span />
        </button>

        {/* Navigace */}
        <nav className={`nav-links ${menuOpen ? "open" : ""}`}>
          <Link to="/home">Domů</Link>
          <Link to="/calendar">Kalendář</Link>
          <Link to="/dashboard">Dashboard</Link>
          <Link to="/profile">Profil</Link>

          {isLoggedIn ? (
            <button onClick={handleLogout} className="primary-btn">
              Odhlásit se
            </button>
          ) : (
            <button onClick={handleLogin} className="primary-btn">
              Přihlásit se
            </button>
          )}
        </nav>
      </div>
    </header>
  );
};

export default Header;
