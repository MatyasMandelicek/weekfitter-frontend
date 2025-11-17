/**
 * ResetPasswordPage.js
 * 
 * Obnovení hesla – krok 2.
 * Uživatel zde zadává nové heslo poté, co klikne na odkaz v e-mailu.
 * Reset token se načítá z URL parametru.
 * Po úspěšném nastavení hesla přesměruje na přihlášení
 * spolu s potvrzovací hláškou.
 */

import React, { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Header from "../components/Header";
import "../styles/LoginPage.css";
import { API_URL } from "../lib/config";

const ResetPasswordPage = () => {
  // token z URL, např. /reset-password/<token>
  const { token } = useParams();

  const navigate = useNavigate();

  // nové heslo z formuláře
  const [newPassword, setNewPassword] = useState("");

  // zpráva pro uživatele – chyba nebo info
  const [message, setMessage] = useState("");

  // stav načítání requestu
  const [loading, setLoading] = useState(false);


  /**
   * Odeslání nového hesla na backend.
   * Backend ověří token a nastaví nové heslo.
   */
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    try {
      const res = await fetch(`${API_URL}/api/users/reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, newPassword }),
      });

      if (res.ok) {
        // přesměrování + úspěšná hláška zobrazená na login stránce
        navigate("/login", {
          state: { successMessage: "Heslo bylo úspěšně změněno. Přihlaste se novým heslem." },
        });
      } else {
        setMessage("Neplatný nebo expirovaný odkaz.");
      }
    } catch (error) {
      console.error( error);
      setMessage("Server je momentálně nedostupný.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Header />

      {/* UI sdílí styly přihlašovací stránky */}
      <main className="login-container">
        <div className="login-card">
          <h2>Obnovení hesla</h2>

          {/* formulář pro zadání nového hesla */}
          <form onSubmit={handleSubmit}>
            <input
              type="password"
              placeholder="Nové heslo"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
            />
            <button type="submit" disabled={loading}>
              {loading ? "Ukládám..." : "Změnit heslo"}
            </button>
          </form>

          {message && <div className="error-message">{message}</div>}
        </div>
      </main>
    </>
  );
};

export default ResetPasswordPage;
