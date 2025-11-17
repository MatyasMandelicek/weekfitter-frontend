/**
 * HomePage.js
 * 
 * Domovská stránka aplikace zobrazená po přihlášení.
 * Obsahuje logo, úvodní text a tlačítko pro zahájení plánování.
 * Kliknutím uživatel přejde buď do kalendáře, nebo na přihlášení podle stavu přihlášení.
 */

import React from "react";
import Header from "../components/Header";
import Logo from "../assets/Logo01.png";
import { useNavigate } from "react-router-dom";
import "../styles/HomePage.css";

const HomePage = () => {
  const navigate = useNavigate();

  /**
   * Přesměruje uživatele podle toho, zda je přihlášen:
   *  - přihlášený -> kalendář
   *  - nepřihlášený -> login
   */
  const handleStartClick = () => {
    const isLoggedIn = localStorage.getItem("isLoggedIn") === "true";
    navigate(isLoggedIn ? "/calendar" : "/login");
  };

  return (
    <>
      <Header />

      {/* Hlavní obsah úvodní stránky */}
      <main className="home-container">
        <img src={Logo} alt="WeekFitter Logo" className="home-logo" />
        <h1>Vítejte ve WeekFitter</h1>
        <p>Plánujte svůj sportovní týden jednoduše a přehledně.</p>

        <button className="home-btn" onClick={handleStartClick}>
          Začít plánovat
        </button>
      </main>
    </>
  );
};

export default HomePage;
