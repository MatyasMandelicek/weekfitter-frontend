import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Logo from "../assets/Logo03.png";
import "../styles/Header.css";
import { AUTH_STORAGE_KEY } from "../lib/config";

const Header = () => {
  const navigate = useNavigate();
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  // Zkontroluje, jestli je uživatel přihlášen (uloženo v localStorage)
  useEffect(() => {
    const loggedIn = localStorage.getItem(AUTH_STORAGE_KEY) === "true";
    setIsLoggedIn(loggedIn);
  }, []);

  // Odhlášení
  const handleLogout = () => {
    localStorage.removeItem("isLoggedIn");
    localStorage.removeItem("userEmail");
    localStorage.removeItem("userName");
    setIsLoggedIn(false);
    console.log("Uživatel odhlášen");
    navigate("/home");
  };

  // Přihlášení
  const handleLogin = () => {
    navigate("/login");
  };

  return (
    <header className="header">
      <div className="header-content">
        {/* Logo vlevo - kliknutí vrací na domovskou stránku */}
        <div className="logo-container" onClick={() => navigate("/")}>
          <img src={Logo} alt="WeekFitter Logo" className="header-logo" />
          <h2 className="app-name">WeekFitter</h2>
        </div>

        {/* Navigace */}
        <nav className="nav-links">
          <Link to="/home">Domů</Link>
          <Link to="/calendar">Kalendář</Link>
          <Link to="/dashboard">Dashboard</Link>
          <Link to="/profile">Profil</Link>

          {/* Dynamické tlačítko */}
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
