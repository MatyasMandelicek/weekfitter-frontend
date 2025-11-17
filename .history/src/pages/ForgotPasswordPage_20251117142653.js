/**
 * ForgotPasswordPage.js
 * 
 * Stránka pro obnovení hesla – krok 1.
 * Uživatel zadá svůj e-mail, backend vytvoří reset token a odešle e-mail s odkazem.
 * Slouží pouze k odeslání žádosti o reset hesla.
 */

import React, { useState } from "react";
import Header from "../components/Header";
import "../styles/LoginPage.css";
import { API_URL } from "../lib/config";


const ForgotPasswordPage = () => {
  // stav pro e-mail zadaný uživatelem
  const [email, setEmail] = useState("");

  // informační zpráva po odeslání formuláře (úspěch nebo chyba)
  const [message, setMessage] = useState("");

  /**
   * Odeslání e-mailu na backend.
   * Backend zpracuje žádost a pošle uživateli e-mail s odkazem na reset hesla.
   */
  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");
    
    try {
      const res = await fetch(`${API_URL}/api/users/forgot-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      // backend vrací textovou odpověď (např. „Ověřte si e-mail“)
      const text = await res.text();
      setMessage(text);
    } catch (error) {
      // fallback při nedostupném backendu
      setMessage("Server je momentálně nedostupný.");
    }
  };

  return (
    <>
      <Header />

      {/* hlavní container přebírá styly z LoginPage.css */}
      <main className="login-container">
        <div className="login-card">
          <h2>Obnovení hesla</h2>
          <form onSubmit={handleSubmit}>
            <input
              type="email"
              placeholder="Zadejte svůj e-mail"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <button type="submit">Odeslat odkaz</button>
          </form>
          {message && <div className="success-message">{message}</div>}
        </div>
      </main>
    </>
  );
};

export default ForgotPasswordPage;
