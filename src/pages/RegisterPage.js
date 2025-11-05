/**
 * RegisterPage.js
 * Registrační stránka
 * 
 * Umožňuje vytvoření nového účtu
 * Ukládá uživatele do DB přes backend API
 * Po registraci automaticky přihlašuje
 */

import React, { useState } from "react";
import Header from "../components/Header";
import Logo from "../assets/Logo02.png";
import MaleAvatar from "../assets/male_avatar.png";
import FemaleAvatar from "../assets/female_avatar.png";
import NeutralAvatar from "../assets/neutral_avatar.png";
import { useNavigate } from "react-router-dom";
import "../styles/RegisterPage.css";
import { API_URL } from "../lib/config";

const RegisterPage = () => {
  const navigate = useNavigate();

  // Lokální stav formuláře
  const [formData, setFormData] = useState({
    gender: "",
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    birthDate: "",
    profilePicture: "",
  });

  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [loading, setLoading] = useState(false);

  // Nastaví pohlaví a výchozí profilový obrázek
  const handleGenderSelect = (gender) => {
    const avatar = 
      gender === "MALE"
        ? MaleAvatar
        : gender === "FEMALE"
        ? FemaleAvatar
        : NeutralAvatar;

    setFormData((prev) => ({...prev, gender, profilePicture: avatar }));
  };
  
  // Změna polí formuláře
  const handleChange = (e) => {
    setErrorMessage("");
    setSuccessMessage("");
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // Odeslání dat na backend
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch(`${API_URL}/api/users/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        const newUser = await res.json();

        localStorage.setItem("isLoggedIn", "true");
        localStorage.setItem("userEmail", newUser.email);
        localStorage.setItem("userName", newUser.firstName);

        setSuccessMessage("Registrace proběhla úspěšně! Přihlašuji vás...");
        setTimeout(() => navigate("/home"), 1200);
      } else if (res.status === 409) {
        setErrorMessage("Uživatel s tímto e-mailem již existuje.");
      } else {
        setErrorMessage("Chyba při registraci, zkuste to znovu.");
      }
    } catch (error) {
      console.error("Chyba při registraci:", error);
      setErrorMessage("Server je momentálně nedostupný.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Header />
      <main className="register-container">
        <div className="register-card">
          <img src={Logo} alt="Logo" className="register-logo" />
          <h2>Registrace</h2>

          {/* Volba pohlaví pomocí avatarů */}
          <div className="gender-selection">
            <h4>Zvolte pohlaví</h4>
            <div className="gender-options">
              <label>
                <input
                  type="radio"
                  name="gender"
                  value="MALE"
                  checked={formData.gender === "MALE"}
                  onChange={() => handleGenderSelect("MALE")}
                />
                <img src={MaleAvatar} alt="Muž" />
              </label>

              <label>
                <input
                  type="radio"
                  name="gender"
                  value="FEMALE"
                  checked={formData.gender === "FEMALE"}
                  onChange={() => handleGenderSelect("FEMALE")}
                />
                <img src={FemaleAvatar} alt="Žena" />
              </label>

              <label>
                <input
                  type="radio"
                  name="gender"
                  value="OTHER"
                  checked={formData.gender === "OTHER"}
                  onChange={() => handleGenderSelect("OTHER")}
                />
                <img src={NeutralAvatar} alt="Ostatní" />
              </label>
            </div>
          </div>

          {/* Formulářová pole */}
          <form onSubmit={handleSubmit}>
            <input
              type="text"
              name="firstName"
              placeholder="Jméno"
              value={formData.firstName}
              onChange={handleChange}
              required
            />
            <input
              type="text"
              name="lastName"
              placeholder="Příjmení"
              value={formData.lastName}
              onChange={handleChange}
              required
            />
            <input
              type="date"
              name="birthDate"
              value={formData.birthDate}
              onChange={handleChange}
              required
            />
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

            {errorMessage && <div className="error-message">{errorMessage}</div>}
            {successMessage && <div className="success-message">{successMessage}</div>}

            <button type="submit" className="primary-btn" disabled={loading}>
              {loading ? "Registruji..." : "Registrovat"}
            </button>
          </form>

          <p>
            Máte již účet?{" "}
            <span className="login-link" onClick={() => navigate("/login")}>
              Přihlaste se
            </span>
          </p>
        </div>
      </main>
    </>
  );
};

export default RegisterPage;
