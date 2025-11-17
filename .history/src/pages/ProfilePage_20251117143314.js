/**
 * ProfilePage.js
 * 
 * Stránka profilu uživatele.
 * Umožňuje zobrazit a upravovat údaje uživatele:
 *  - jméno, příjmení, e-mail, datum narození, pohlaví
 *  - profilová fotka (upload přes Supabase Storage)
 * 
 * Data se načítají a ukládají přes backend API.
 */

import React, { useEffect, useState } from "react";
import Header from "../components/Header";
import "../styles/ProfilePage.css";
import { API_URL } from "../lib/config";
import { supabase } from "../lib/supabaseClient";

const ProfilePage = () => {
  // hlavní uživatelská data (načtena z backendu)
  const [userData, setUserData] = useState(null);

  // stav načítání profilu
  const [loading, setLoading] = useState(true);

  // stav ukládání do backendu
  const [saving, setSaving] = useState(false);

  // zprávy pro uživatele (chyba / úspěch)
  const [message, setMessage] = useState({ type: "", text: "" });

  // používá se pro vynucený refresh avataru (kvůli cache)
  const [avatarRefresh, setAvatarRefresh] = useState(0);

    // e-mail přihlášeného uživatele (uložený po loginu)

  const email = localStorage.getItem("userEmail");

  // Načtení dat uživatele z backendu
  useEffect(() => {
    const fetchUser = async () => {
      try {
        const response = await fetch(`${API_URL}/api/users/profile`, {
          headers: {
            "Authorization": `Bearer ${localStorage.getItem("token")}`,
          },
        });
        if (response.ok) {
          const user = await response.json();
          setUserData(user);
        } else {
          setMessage({ type: "error", text: "Nepodařilo se načíst údaje o uživateli." });
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
      setUserData((prev) => {
        const hasCustomPhoto =
          prev.photo &&                        
          prev.photo !== "null" &&
          prev.photo !== "undefined" &&
          prev.photo.trim() !== "" &&
          !prev.photo.startsWith("/avatars/");

        return {
          ...prev,
          gender: value,
          photo: hasCustomPhoto ? prev.photo : getDefaultAvatar(value),
        };
      });

      setAvatarRefresh((prev) => prev + 1);
      return;
    }

    setUserData((prev) => ({ ...prev, [name]: value }));
  };


  // Upload nové profilové fotky – nově přes Supabase Storage
  const handlePhotoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!email) {
      setMessage({ type: "error", text: "Chybí e-mail uživatele." });
      return;
    }

    try {
      // unikátní cesta souboru v bucketu
      const fileExt = file.name.split(".").pop();
      const fileName = `${Date.now()}.${fileExt}`;
      const safeFolder = email.replace(/[^a-zA-Z0-9_-]/g, "_");
      const filePath = `${safeFolder}/${fileName}`;

      // 1) Upload do Supabase Storage
      const { data, error } = await supabase.storage
        .from("profile-photos") // <== jméno bucketu
        .upload(filePath, file, {
          cacheControl: "3600",
          upsert: true,
        });

      if (error) {
        console.error("Supabase upload error:", error);
        setMessage({ type: "error", text: "Chyba při nahrávání fotky (Supabase)." });
        return;
      }

      // 2) Získání veřejné URL
      const { data: publicData } = supabase.storage
        .from("profile-photos")
        .getPublicUrl(filePath);

      const publicUrl = publicData?.publicUrl;

      if (!publicUrl) {
        setMessage({ type: "error", text: "Nepodařilo se získat URL fotky." });
        return;
      }

      // 3) Uložení URL do backendu (DB)
      const saveResponse = await fetch(`${API_URL}/api/users/profile`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify({ photo: publicUrl }),
      });

      if (!saveResponse.ok) {
        setMessage({ type: "error", text: "Fotka byla nahrána, ale nepodařilo se ji uložit v profilu." });
        return;
      }

      const updatedUser = await saveResponse.json();

      // 4) Aktualizace lokálního stavu
      setUserData((prev) => ({
        ...prev,
        photo: updatedUser.photo,
      }));

      setMessage({ type: "success", text: "Profilová fotka byla aktualizována!" });

    } catch (error) {
      console.error("Chyba při uploadu fotky:", error);
      setMessage({ type: "error", text: "Chyba při nahrávání fotky." });
    }
  };

  // Uložení změn do databáze
  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMessage({ type: "", text: "" });

    try {
      const response = await fetch(`${API_URL}/api/users/profile`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${localStorage.getItem("token")}`,
        },
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
                key={avatarRefresh} 
                src={resolvePhotoUrl(userData.photo, userData.gender)}
                alt="Profilová fotka"
                className="profile-photo"
                onError={(e) => {
                  e.currentTarget.onerror = null;
                  e.currentTarget.src = getDefaultAvatar(userData.gender);
                }}
              />
              <label htmlFor="photo" className="upload-btn">
                Nahrát novou fotku
              </label>
              <input
                id="photo"
                type="file"
                name="photo"
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
