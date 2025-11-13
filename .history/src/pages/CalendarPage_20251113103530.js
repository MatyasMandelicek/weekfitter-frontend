/**
 * CalendarPage.js
 * 
 * Hlavní kalendářová stránka aplikace WeekFitter
 * 
 * Zobrazuje události (sport, práce, odpočinek, jiné)
 * Umožňuje CRUD operace (vytvořit, upravit, smazat)
 * Drag & Drop pro přesun / změnu délky
 * Automatická synchronizace s backendem
 * Připojení souborů + notifikace
 */

import React, { useState, useEffect } from "react";
import { Calendar, dateFnsLocalizer, Views } from "react-big-calendar";
import withDragAndDrop from "react-big-calendar/lib/addons/dragAndDrop";
import "react-big-calendar/lib/addons/dragAndDrop/styles.css";
import "react-big-calendar/lib/css/react-big-calendar.css";

import {
  format,
  parse,
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  eachWeekOfInterval,
  getDay,
  addMinutes
} from "date-fns";
import { cs } from "date-fns/locale";

import Header from "../components/Header";
import "../styles/CalendarPage.css";
import { API_URL } from "../lib/config";

import runIcon from "../assets/icons/run.png";
import bikeIcon from "../assets/icons/bike.png";
import swimIcon from "../assets/icons/swim.png";
import otherIcon from "../assets/icons/other.png";

import html2canvas from "html2canvas";

// Nastavení lokalizace (čeština pro react-big-calendar)
const locales = { cs };
const localizer = dateFnsLocalizer({
  format,
  parse: (value, fmt) => parse(value, fmt, new Date(), { locale: cs }),
  startOfWeek: () => startOfWeek(new Date(), { weekStartsOn: 1 }),
  getDay,
  locales,
});

// Kalendář s podporou drag & drop
const DnDCalendar = withDragAndDrop(Calendar);

// Ikony pro sportovní typy aktivit
const sportIcons = {
  RUNNING: runIcon,
  CYCLING: bikeIcon,
  SWIMMING: swimIcon,
  OTHER: otherIcon,
};

// Hlavní komponenta CalendarPage
const CalendarPage = () => {
  const [events, setEvents] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    start: "",
    end: "",
    category: "OTHER",
    allDay: false,
    duration: "",
    distance: "",
    sportDescription: "",
    sportType: "OTHER",
    file: null,
    filePath: null,
  });

  const [notifications, setNotifications] = useState([60]);
  const [view, setView] = useState(Views.MONTH);
  const [date, setDate] = useState(new Date());
  const isMobile =
    typeof window !== "undefined" &&
    window.matchMedia("(max-width: 640px)").matches;
  const calendarHeight = isMobile ? 520 : 750;
  const calendarFont = isMobile ? "0.85rem" : "0.95rem";

  // === Automatické přizpůsobení pohledu kalendáře ===
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth <= 768) {
        setView(Views.WEEK);
      } else {
        setView(Views.MONTH);
      }
    };

    handleResize(); // spustit hned při načtení
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  /* 
    Načtení událostí z backendu
    filtruje podle přihlášeného uživatele
    převádí datové typy z backendu na objekty Date
  */
  const loadEvents = async () => {
    const email = localStorage.getItem("userEmail");
    if (!email) {
      console.error("Uživatel není přihlášen – chybí e-mail v localStorage.");
      setEvents([]);
      return;
    }

    try {
      const res = await fetch(
        `${API_URL}/api/events?email=${encodeURIComponent(email)}`
      );
      const data = await res.json();

      if (!Array.isArray(data)) {
        console.error("Server nevrátil pole událostí:", data);
        setEvents([]);
        return;
      }

      const formatted = data.map((event) => {
        const category = event.category ?? "OTHER";
        const start = new Date(event.startTime);
        const end = new Date(event.endTime);
        return {
          id: event.id,
          title: event.title,
          start,
          end,
          description: event.description,
          category,
          allDay: Boolean(event.allDay),
          duration: event.duration,
          distance: event.distance,
          sportDescription: event.sportDescription,
          sportType: event.sportType ?? "OTHER",
          filePath: event.filePath,
          notifications: event.notifications || [],
        };
      });

      // Pouze validní časové údaje
      setEvents(
        formatted.filter(
          (e) =>
            e.start instanceof Date &&
            !isNaN(e.start) &&
            e.end instanceof Date &&
            !isNaN(e.end)
        )
      );
    } catch (error) {
      console.error("Chyba při načítání událostí:", error);
      setEvents([]);
    }
  };

  useEffect(() => {
    loadEvents();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Stylování událostí podle kategorie
  const getEventStyle = (event) => {
    const colors = {
      SPORT: "#28a745",
      WORK: "#007bff",
      SCHOOL: "#ffc107",
      REST: "#6f42c1",
      OTHER: "#ff6a00",
    };
    return {
      style: {
        backgroundColor: colors[event.category] || "#ff6a00",
        borderRadius: "8px",
        color: "white",
        border: "none",
        padding: "2px 4px",
      },
    };
  };

  // Vlastní zobrazení události s ikonou
  const CustomEvent = ({ event }) => {
    if (event.category === "SPORT") {
      const iconSrc = sportIcons[event.sportType] || sportIcons.OTHER;
      return (
        <div className="custom-event">
          <img
            src={iconSrc}
            alt={event.sportType || "SPORT"}
            className="event-icon-img"
          />
          <span className="event-title">{event.title}</span>
        </div>
      );
    }
    return <div className="event-title">{event.title}</div>;
  };

  // Dynamické zvětšování textarea 
  const autoResize = (e) => {
    e.target.style.height = "auto";
    e.target.style.height = `${e.target.scrollHeight}px`;
  };
