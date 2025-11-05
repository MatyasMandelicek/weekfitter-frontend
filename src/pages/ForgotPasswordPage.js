/**
 * ForgotPasswordPage.js
 * Obnovení hesla – krok 1
 * 
 * Uživatel zadá e-mail pro zaslání odkazu
 * Backend vygeneruje reset token a pošle e-mail
 */

import React, { useState } from "react";
import Header from "../components/Header";
import "../styles/LoginPage.css";
import { API_URL } from "../lib/config";


const ForgotPasswordPage = () => {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");
    
    try {
      const res = await fetch(`${API_URL}/api/users/forgot-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const text = await res.text();
      setMessage(text);
    } catch (error) {
      setMessage("Server je momentálně nedostupný.");
    }
  };

  return (
    <>
      <Header />
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
