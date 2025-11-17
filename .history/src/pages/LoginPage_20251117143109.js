/**
 * LoginPage.js
 * 
 * Přihlašovací stránka aplikace.
 * Umožňuje přihlášení pomocí e-mailu a hesla.
 * Po úspěšném přihlášení ukládá uživatelská data a token do localStorage.
 * Zpracovává chyby a zobrazuje uživateli informační hlášky.
 */

import React, { useState, useEffect } from "react";
import Header from "../components/Header";
import Logo from "../assets/Logo02.png";
import { useNavigate, useLocation } from "react-router-dom";
import "../styles/LoginPage.css";
import { API_URL } from "../lib/config";

const LoginPage = () => {
  const navigate = useNavigate();
  const location = useLocation();

  // stav formuláře – e-mail a heslo
  const [formData, setFormData] = useState({ email: "", password: "" });

  // zprávy pro uživatele
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  // stav načítání (tlačítko)
  const [loading, setLoading] = useState(false);

  /**
   * Pokud je uživatel již přihlášen (localStorage), přesměruje ho na /home.
   * Zabraňuje zbytečnému zobrazení přihlašovací stránky.
   */
  useEffect(() => {
    if (localStorage.getItem("isLoggedIn") === "true") navigate("/home");
  }, [navigate]);

  /**
   * Zobrazení hlášky po úspěšném resetu hesla.
   * Příchozí hláška se přenáší přes location.state.
   */
  useEffect(() => {
    if (location.state?.successMessage) {
      setSuccessMessage(location.state.successMessage);

      // odstraní state ze URL, aby se hláška nezobrazovala znovu při reloadu
      navigate(location.pathname, { replace: true });
    }
  }, [location, navigate]);

  /**
   * Zpracování změn v přihlašovacím formuláři.
   * Při psaní zároveň smaže předchozí chyby / úspěchy.
   */
  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setErrorMessage("");
    setSuccessMessage("");
  };

  /**
   * Odeslání přihlašovacích údajů na backend.
   * Backend vrátí JWT token a základní informace o uživateli.
   */
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorMessage("");
    setSuccessMessage("");

    try {
      const res = await fetch(`${API_URL}/api/users/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      // špatný status -> špatné přihlašovací údaje
      if (!res.ok) {
        setErrorMessage("Nesprávný e-mail nebo heslo.");
        setLoading(false);
        return;
      }

      const data = await res.json();

      if (data) {
        // uložení přístupového tokenu a základních údajů uživatele
        localStorage.setItem("token", data.token);
        localStorage.setItem("userEmail", data.email);
        localStorage.setItem("userName", data.firstName);
        localStorage.setItem("isLoggedIn", "true");

        // přesměrování po úspěšném přihlášení
        navigate("/home");
      } else {
        setErrorMessage("Nesprávný e-mail nebo heslo.");
      }
    } catch (error) {
      console.error(error);
      setErrorMessage("Server momentálně nedostupný.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Header />

      {/* hlavní kontejner přebírá stylování z LoginPage.css */}
      <main className="login-container">
        <div className="login-card">

          {/* logo nad formulářem */}
          <img src={Logo} alt="Logo" className="login-logo" />
          
          <h2>Přihlášení</h2>

          {successMessage && <div className="success-message">{successMessage}</div>}

          <form onSubmit={handleSubmit}>
            <input
              type="email"
              name="email"
              placeholder="E-mail"
              value={formData.email}
              onChange={handleChange}
              required
            />
            <input
              type="password"
              name="password"
              placeholder="Heslo"
              value={formData.password}
              onChange={handleChange}
              required
            />

            <div
              className="forgot-password-link"
              onClick={() => navigate("/forgot-password")}>
                Zapomenuté heslo?
            </div>

            {errorMessage && <div className="error-message">{errorMessage}</div>}

            <button type="submit" className="primary-btn" disabled={loading}>
              {loading ? "Přihlašuji..." : "Přihlásit se"}
            </button>
          </form>

          <p>
            Nemáte účet?{" "}
            <span
              className="register-link"
              onClick={() => navigate("/register")}>
                Zaregistrujte se
            </span>
          </p>
        </div>
      </main>
    </>
  );
};

export default LoginPage;
