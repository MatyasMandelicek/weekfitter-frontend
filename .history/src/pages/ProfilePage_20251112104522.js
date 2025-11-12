/**
 * ProfilePage.js
 * Stránka profilu uživatele
 * 
 * Umožňuje prohlížet a upravovat uživatelská data
 * Změna jména, data narození, pohlaví i profilové fotky
 * Data se načítají a ukládají přes backend API
 */

import React, { useEffect, useState } from "react";
import Header from "../components/Header";
import "../styles/ProfilePage.css";
import { API_URL } from "../lib/config";

const ProfilePage = () => {
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });
  const [avatarRefresh, setAvatarRefresh] = useState(0);

  const email = localStorage.getItem("userEmail");

  // Načtení dat uživatele z backendu
  useEffect(() => {
    const fetchUser = async () => {
      try {
          const response = await fetch(`${API_URL}/api/users/profile?email=${email}`);
        if (response.ok) {
          const user = await response.json();
          setUserData(user);
        } else {
          setMessage({ type: "error", text: "Nepodařilo se načíst údaje o uživateli."});
        }
      } catch (error) {
        console.error("Chyba při načítání profilu:", error);
        setMessage({ type: "error", text: "Chyba připojení k serveru."});
      } finally {
        setLoading(false);
      }
    };

    if (email) fetchUser();
    else {
      setMessage({ type: "error", text: "Nepodařilo se načíst e-mail z localStorage."});
      setLoading(false);
    }
  }, [email]);

  // Výběr správného výchozího avataru podle pohlaví
  const getDefaultAvatar = (gender) => {
    if (gender === "MALE") return "/avatars/male_avatar.png";
    if (gender === "FEMALE") return "/avatars/female_avatar.png";
    return "/avatars/neutral_avatar.png";
  };

  const isDefaultAvatar = (photo) =>
    typeof photo === "string" && photo.startsWith("/avatars/");

  // Vrátí správnou URL pro fotku (řeší frontendové i backendové cesty)
  const resolvePhotoUrl = (photo, gender) => {
    if (!photo || photo === "null" || photo === "undefined" || photo.trim() === "") {
      return getDefaultAvatar(gender);
    }

    // Pokud už je to cesta z frontend /avatars nebo plná URL
    if (photo.startsWith("/avatars/") || photo.startsWith("http")) {
      return photo;
    }

    // Jinak je to backendová relativní cesta (např. /uploads/photo.png)
    return `${API_URL}${photo}`;
  };


  // Změna údajů ve formuláři
  const handleChange = (e) => {
    const { name, value } = e.target;

if (name === "gender") {
  const newAvatar = getDefaultAvatar(value);
  setUserData((prev) => ({
    ...prev,
    gender: value,
    photo: newAvatar,
  }));
  setAvatarRefresh((prev) => prev + 1); // 👈 přinutí přerenderování
  return;
}


    setUserData((prev) => ({ ...prev, [name]: value }));
  };

  // Upload nové profilové fotky
  const handlePhotoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await fetch(
        `${API_URL}/api/users/upload-photo?email=${email}`, {
          method: "POST",
          body: formData,
      });

      if (response.ok) {
        const updatedUser = await response.json();
        setUserData(updatedUser);
        setMessage({ type: "success", text: "Profilová fotka byla aktualizována!" });
      } else {
        setMessage({ type: "error", text: "Chyba při nahrávání fotky." });
      }
    } catch (error) {
      console.error("Chyba při uploadu fotky:", error);
      setMessage({ type: "error", text: "Chyba připojení k serveru." });
    }
  };

  // Uložení změn do databáze
  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMessage({ type: "", text: "" });

    try {
      const response = await fetch(`${API_URL}/api/users/profile?email=${email}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(userData),
      });

      if (response.ok) {
        setMessage({ type: "success", text: "Změny byly úspěšně uloženy!" });
        localStorage.setItem("userName", userData.firstName);
      } else {
        setMessage({ type: "error", text: "Nepodařilo se uložit změny." });
      }
    } catch (error) {
      console.error("Chyba při ukládání profilu:", error);
      setMessage({ type: "error", text: "Chyba připojení k serveru." });
    } finally {
      setSaving(false);
    }
  };

  // Zobrazení načítací obrazovky
  if (loading || !userData) {
    return (
      <>
        <Header />
        <div className="profile-container">
          <div className="profile-card loading">Načítání profilu...</div>
        </div>
      </>
    );
  }

  return (
    <>
      <Header />
      <div className="profile-container">
        <div className="profile-card">
          <h2 className="profile-title">Můj profil</h2>

          {message.text && (
            <div
              className={
                message.type === "error"
                  ? "error-message"
                  : "success-message"
              }
            >
              {message.text}
            </div>
          )}

          <div className="profile-content">
            <div className="profile-photo-section">
              <img
                key={userData.photo} 
                src={resolvePhotoUrl(userData.photo, userData.gender)}
                alt="Profilová fotka"
                className="profile-photo"
                onError={(e) => {
                  e.currentTarget.onerror = null;
                  e.currentTarget.src = getDefaultAvatar(userData.gender);
                }}
              />
              <label htmlFor="profilePicture" className="upload-btn">
                Nahrát novou fotku
              </label>
              <input
                id="profilePicture"
                type="file"
                name="profilePicture"
                accept="image/*"
                onChange={handlePhotoUpload}
                style={{ display: "none" }}
              />
            </div>

            <form className="profile-form" onSubmit={handleSave}>
              <div className="form-row">
                <label>Jméno</label>
                <input
                  type="text"
                  name="firstName"
                  value={userData.firstName || ""}
                  onChange={handleChange}
                />
              </div>

              <div className="form-row">
                <label>Příjmení</label>
                <input
                  type="text"
                  name="lastName"
                  value={userData.lastName || ""}
                  onChange={handleChange}
                />
              </div>

              <div className="form-row">
                <label>E-mail</label>
                <input type="email" value={userData.email} disabled />
              </div>

              <div className="form-row">
                <label>Datum narození</label>
                <input
                  type="date"
                  name="birthDate"
                  value={userData.birthDate || ""}
                  onChange={handleChange}
                />
              </div>

              <div className="form-row">
                <label>Pohlaví</label>
                <select
                  name="gender"
                  value={userData.gender || ""}
                  onChange={handleChange}
                >
                  <option value="MALE">Muž</option>
                  <option value="FEMALE">Žena</option>
                  <option value="OTHER">Jiné</option>
                </select>
              </div>

              <button type="submit" className="save-btn" disabled={saving}>
                {saving ? "Ukládám..." : "Uložit změny"}
              </button>
            </form>
          </div>
        </div>
      </div>
    </>
  );
};

export default ProfilePage;
