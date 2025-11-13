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

  // Kliknutí na volné místo v kalendáři - otevře nový formulář
  const handleSelectSlot = (slotInfo) => {
    let start = slotInfo.start;
    let end;

    if (view === Views.MONTH) {
      start = new Date(
        start.getFullYear(),
        start.getMonth(),
        start.getDate(),
        8,
        0,
        0
      );
      end = new Date(
        start.getFullYear(),
        start.getMonth(),
        start.getDate(),
        8,
        30,
        0
      );
    } else {
      end = addMinutes(start, 30);
    }

    setSelectedEvent(null);
    setFormData({
      title: "",
      description: "",
      start: format(start, "yyyy-MM-dd'T'HH:mm"),
      end: format(end, "yyyy-MM-dd'T'HH:mm"),
      category: "OTHER",
      allDay: false,
      duration: "",
      distance: "",
      sportDescription: "",
      sportType: "OTHER",
      file: null,
      filePath: null,
    });
    setShowModal(true);
  };

  // Kliknutí na existující událost -> načte ji do formuláře
  const handleSelectEvent = (event) => {
    setSelectedEvent(event);
    setFormData({
      title: event.title,
      description: event.description,
      start: format(event.start, "yyyy-MM-dd'T'HH:mm"),
      end: format(event.end, "yyyy-MM-dd'T'HH:mm"),
      category: event.category,
      allDay: Boolean(event.allDay),
      duration: event.duration || "",
      distance: event.distance || "",
      sportDescription: event.sportDescription || "",
      sportType: event.sportType || "OTHER",
      file: null,
      filePath: event.filePath || null,
    });
    setNotifications(
      event.notifications && event.notifications.length > 0
        ? event.notifications
        : [60]
    );
    setShowModal(true);
  };

  // Změna kategorie události
  const handleCategoryChange = (e) => {
    const category = e.target.value;
    setFormData((prev) => ({
      ...prev,
      category,
      allDay: category === "SPORT" ? false : prev.allDay,
    }));
  };

  // Přepočet délky podle začátku a konce
  const handleDurationChange = (e) => {
    const minutes = parseInt(e.target.value, 10);
    if (!isNaN(minutes) && formData.start) {
      const startDate = new Date(formData.start);
      const newEnd = addMinutes(startDate, minutes);
      setFormData((prev) => ({
        ...prev,
        duration: e.target.value,
        end: format(newEnd, "yyyy-MM-dd'T'HH:mm"),
      }));
    } else {
      setFormData((prev) => ({ ...prev, duration: e.target.value }));
    }
  };

  // Změna začátku události - automaticky upraví konec
  const handleStartChange = (e) => {
    const newStart = new Date(e.target.value);

    if (formData.duration && !isNaN(parseInt(formData.duration, 10))) {
      const minutes = parseInt(formData.duration, 10);
      const newEnd = addMinutes(newStart, minutes);
      setFormData((prev) => ({
        ...prev,
        start: format(newStart, "yyyy-MM-dd'T'HH:mm"),
        end: format(newEnd, "yyyy-MM-dd'T'HH:mm"),
      }));
    } else {
      const prevEnd = new Date(formData.end);
      const prevStart = new Date(formData.start);
      const userManuallyChangedEnd =
        Math.abs(prevEnd - prevStart - 30 * 60 * 1000) >
        60 * 1000;

      const newEnd = userManuallyChangedEnd
        ? prevEnd
        : new Date(newStart.getTime() + 60 * 60 * 1000);

      setFormData((prev) => ({
        ...prev,
        start: format(newStart, "yyyy-MM-dd'T'HH:mm"),
        end: format(newEnd, "yyyy-MM-dd'T'HH:mm"),
      }));
    }
  };

  /* 
    Pomocná funkce – tvorba payloadu pro backend
    používá se u drag&drop, resize, uložit/aktualizovat
   */
  const buildPayloadFromEvent = (base, overrides = {}) => {
    const resolvedCategory = overrides.category ?? base.category ?? "OTHER";
    const isSport = resolvedCategory === "SPORT";

    const startVal = overrides.start
      ? new Date(overrides.start)
      : new Date(base.start);
    const endVal = overrides.end
      ? new Date(overrides.end)
      : new Date(base.end);

    const startTime = format(startVal, "yyyy-MM-dd'T'HH:mm");
    const endTime = format(endVal, "yyyy-MM-dd'T'HH:mm");

    return {
      id: base.id,
      title: overrides.title ?? base.title,
      description: isSport
        ? overrides.sportDescription ??
          base.sportDescription ??
          ""
        : overrides.description ?? base.description ?? "",
      startTime,
      endTime,
      category: resolvedCategory, 
      allDay: isSport
        ? false
        : Boolean(overrides.allDay ?? base.allDay),
      duration: isSport
        ? Number(overrides.duration ?? base.duration) ||
          null
        : null,
      distance: isSport
        ? Number(overrides.distance ?? base.distance) ||
          null
        : null,
      sportDescription: isSport
        ? overrides.sportDescription ??
          base.sportDescription ??
          ""
        : null,
      sportType: isSport
        ? overrides.sportType ?? base.sportType ?? "OTHER"
        : null,
      filePath: overrides.filePath ?? base.filePath ?? null,
    };
  };

  /* 
    Uložení (vytvoření / aktualizace) události
    Upload přiloženého souboru (např. GPX)
    Odeslání kompletního payloadu na backend
    Po uložení znovu načte data
 */
  const handleSubmit = async (e) => {
    e.preventDefault();
    const email = localStorage.getItem("userEmail");
    if (!email) {
      alert("Uživatel není přihlášen.");
      return;
    }

    // Upload souboru (pokud existuje)
    let uploadedFilePath = formData.filePath;
    if (formData.file) {
      const uploadData = new FormData();
      uploadData.append("file", formData.file);

      try {
        const uploadRes = await fetch(`${API_URL}/api/files/upload`, {
          method: "POST",
          body: uploadData,
        });

        if (!uploadRes.ok) {
          const msg = await uploadRes.text();
          alert("Chyba při nahrávání souboru: " + msg);
          return;
        }

        uploadedFilePath = await uploadRes.text();
      } catch (error) {
        alert("Chyba spojení s backendem při nahrávání souboru.");
        return;
      }
    }

    // Příprava payloadu
    const payload = {
      title: formData.title,
      description:
        formData.category === "SPORT"
          ? formData.sportDescription
          : formData.description,
      startTime: formData.start,
      endTime: formData.end,
      category: formData.category,
      allDay:
        formData.category !== "SPORT" ? formData.allDay : false,
      duration:
        formData.category === "SPORT"
          ? formData.duration
            ? Number(formData.duration)
            : null
          : null,
      distance:
        formData.category === "SPORT"
          ? formData.distance
            ? Number(formData.distance)
            : null
          : null,
      sportDescription:
        formData.category === "SPORT"
          ? formData.sportDescription
          : null,
      sportType:
        formData.category === "SPORT"
          ? formData.sportType
          : null,
      filePath: uploadedFilePath || null,
      notifications,
    };

    const method = selectedEvent ? "PUT" : "POST";
    const url = selectedEvent
      ? `${API_URL}/api/events/${
          selectedEvent.id
        }?email=${encodeURIComponent(email)}`
      : `${API_URL}/api/events?email=${encodeURIComponent(email)}`;

    try {
      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const msg = await res.text();
        alert("Chyba při ukládání události: " + msg);
        return;
      }

      setShowModal(false);
      setSelectedEvent(null);
      await loadEvents();
    } catch (error) {
      alert("Chyba spojení s backendem při ukládání události.");
    }
  };

  // Smazání události
  const handleDelete = async () => {
    if (!selectedEvent) return;
    try {
      await fetch(`${API_URL}/api/events/${selectedEvent.id}`, {
        method: "DELETE",
      });
      setShowModal(false);
      setSelectedEvent(null);
      await loadEvents();
    } catch (error) {
      alert("Chyba při mazání události.");
    }
  };

  /* 
    Drag & Drop přesun události
    Optimisticky aktualizuje UI
    Pošle změnu na backend
 */
  const handleEventDrop = async ({ event, start, end }) => {
    const email = localStorage.getItem("userEmail");
    const payload = buildPayloadFromEvent(
      { ...event, start: event.start, end: event.end },
      { start, end }
    );

    // Optimistická UI update
    setEvents((prev) =>
      prev.map((e) =>
        e.id === event.id
          ? { ...e, start: new Date(start), end: new Date(end) }
          : e
      )
    );

    try {
      const res = await fetch(
        `${API_URL}/api/events/${event.id}?email=${encodeURIComponent(
          email
        )}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }
      );
      if (!res.ok) {
        console.error("Chyba při přesunu události:", await res.text());
        await loadEvents();
      } else {
        await loadEvents();
      }
    } catch (error) {
      console.error("Chyba při přesunu události:", error);
      await loadEvents();
    }
  };

  // Resize události
  const handleEventResize = async ({ event, start, end }) => {
    const email = localStorage.getItem("userEmail");
    const payload = buildPayloadFromEvent(
      { ...event, start: event.start, end: event.end },
      { start, end }
    );

    setEvents((prev) =>
      prev.map((e) =>
        e.id === event.id
          ? { ...e, start: new Date(start), end: new Date(end) }
          : e
      )
    );

    try {
      const res = await fetch(
        `${API_URL}/api/events/${event.id}?email=${encodeURIComponent(
          email
        )}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }
      );
      if (!res.ok) {
        console.error(
          "Chyba při změně délky události:",
          await res.text()
        );
        await loadEvents();
      } else {
        await loadEvents();
      }
    } catch (error) {
      console.error("Chyba při změně délky události:", error);
      await loadEvents();
    }
  };

  /* === Měsíční přehled sportů === */
  const renderWeeklySummaryAllWeeks = () => {
    if (view !== Views.MONTH) return null;

    const monthStart = startOfMonth(date);
    const monthEnd = endOfMonth(date);
    const weeks = eachWeekOfInterval(
      { start: monthStart, end: monthEnd },
      { weekStartsOn: 1 }
    );

    const toHours = (min) => {
      const safe = Number.isFinite(min) ? min : 0;
      const h = Math.floor(safe / 60);
      const m = safe % 60;
      return `${h}h ${m}m`;
    };

    return (
      <div className="calendar-with-summary">
        <div className="calendar-left">
          <DnDCalendar
            localizer={localizer}
            events={events}
            startAccessor="start"
            endAccessor="end"
            selectable
            resizable
            onEventDrop={handleEventDrop}
            onEventResize={handleEventResize}
            onSelectSlot={handleSelectSlot}
            onSelectEvent={handleSelectEvent}
            onDoubleClickEvent={handleSelectEvent}
            longPressThreshold={50}
            popup
            eventPropGetter={getEventStyle}
            components={{ event: CustomEvent }}
            view={view}
            date={date}
            onView={setView}
            onNavigate={setDate}
            style={{
              height: calendarHeight,
              fontSize: calendarFont,
              touchAction: "manipulation",
            }}
            messages={{
              next: "Další",
              previous: "Předchozí",
              today: "Dnes",
              month: "Měsíc",
              week: "Týden",
              day: "Den",
              agenda: "Agenda",
            }}
          />
        </div>

        {/* Sloupec souhrnů podle týdne */}
        <div className="calendar-summary-column">
          {weeks.map((weekStart, idx) => {
            const weekEnd = endOfWeek(weekStart, { weekStartsOn: 1 });
            const weekEvents = events.filter(
              (e) =>
                e.category === "SPORT" &&
                e.start >= weekStart &&
                e.start <= weekEnd
            );
            const totals = {
              RUNNING: 0,
              CYCLING: 0,
              SWIMMING: 0,
              OTHER: 0,
            };
            weekEvents.forEach((e) => {
              const dur = e.duration || 0;
              const key =
                e.sportType && totals[e.sportType] !== undefined
                  ? e.sportType
                  : "OTHER";
              totals[key] += dur;
            });
            return (
              <div key={idx} className="summary-row">
                <div className="summary-week-label">
                  {format(weekStart, "d.M.")} –{" "}
                  {format(weekEnd, "d.M.")}
                </div>
                <div className="summary-icons">
                  <div className="sport-item">
                    <img src={runIcon} alt="běh" />
                    <span>{toHours(totals.RUNNING)}</span>
                  </div>
                  <div className="sport-item">
                    <img src={bikeIcon} alt="kolo" />
                    <span>{toHours(totals.CYCLING)}</span>
                  </div>
                  <div className="sport-item">
                    <img src={swimIcon} alt="plavání" />
                    <span>{toHours(totals.SWIMMING)}</span>
                  </div>
                  <div className="sport-item">
                    <img src={otherIcon} alt="jiné" />
                    <span>{toHours(totals.OTHER)}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  // Export měsíčního pohledu jako PNG
  const handleExportPNG = async () => {
    if (view !== Views.MONTH) {
      alert("Export je dostupný pouze v měsíčním pohledu.");
      return;
    }

    const exportElement = document.querySelector(".calendar-with-summary");
    if (!exportElement) {
      alert("Nelze najít obsah k exportu.");
      return;
    }

    try {
      const canvas = await html2canvas(exportElement, {
        backgroundColor: "#ffffff",
        scale: 2,
        useCORS: true,
      });

      const link = document.createElement("a");
      link.download = `WeekFitter-Mesic-${format(
        date,
        "MM-yyyy"
      )}.png`;
      link.href = canvas.toDataURL("image/png");
      link.click();
    } catch (err) {
      console.error("Chyba při exportu:", err);
      alert("Došlo k chybě při exportu kalendáře.");
    }
  };

  
