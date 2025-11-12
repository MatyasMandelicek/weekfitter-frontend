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
  getDay,
  addMinutes,
  addDays,
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

// === Lokalizace ===
const locales = { cs };
const localizer = dateFnsLocalizer({
  format,
  parse: (value, fmt) => parse(value, fmt, new Date(), { locale: cs }),
  startOfWeek: () => startOfWeek(new Date(), { weekStartsOn: 1 }),
  getDay,
  locales,
});

const DnDCalendar = withDragAndDrop(Calendar);

const sportIcons = {
  RUNNING: runIcon,
  CYCLING: bikeIcon,
  SWIMMING: swimIcon,
  OTHER: otherIcon,
};

// === Hlavní komponenta ===
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
    typeof window !== "undefined" && window.matchMedia("(max-width: 768px)").matches;
  const calendarHeight = isMobile ? 520 : 750;
  const calendarFont = isMobile ? "0.85rem" : "0.95rem";

  // === Automatická detekce režimu ===
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth <= 768) setView(Views.WEEK);
      else setView(Views.MONTH);
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // === Načtení událostí ===
  const loadEvents = async () => {
    const email = localStorage.getItem("userEmail");
    if (!email) return setEvents([]);

    try {
      const res = await fetch(`${API_URL}/api/events?email=${encodeURIComponent(email)}`);
      const data = await res.json();
      if (!Array.isArray(data)) return setEvents([]);

      const formatted = data.map((event) => ({
        id: event.id,
        title: event.title,
        start: new Date(event.startTime),
        end: new Date(event.endTime),
        description: event.description,
        category: event.category ?? "OTHER",
        allDay: Boolean(event.allDay),
        duration: event.duration,
        distance: event.distance,
        sportDescription: event.sportDescription,
        sportType: event.sportType ?? "OTHER",
        filePath: event.filePath,
        notifications: event.notifications || [],
      }));

      setEvents(
        formatted.filter((e) => e.start instanceof Date && !isNaN(e.start) && e.end instanceof Date)
      );
    } catch (error) {
      console.error("Chyba načítání událostí:", error);
      setEvents([]);
    }
  };

  useEffect(() => {
    loadEvents();
  }, []);

  // === Styl událostí ===
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

  // === Ikony v událostech ===
  const CustomEvent = ({ event }) => {
    if (event.category === "SPORT") {
      const iconSrc = sportIcons[event.sportType] || sportIcons.OTHER;
      return (
        <div className="custom-event">
          <img src={iconSrc} alt={event.sportType || "SPORT"} className="event-icon-img" />
          <span className="event-title">{event.title}</span>
        </div>
      );
    }
    return <div className="event-title">{event.title}</div>;
  };

  // === Slot kliknutí ===
  const handleSelectSlot = (slotInfo) => {
    let start = slotInfo.start;
    let end = addMinutes(start, 30);
    if (view === Views.MONTH)
      start = new Date(start.getFullYear(), start.getMonth(), start.getDate(), 8, 0, 0);

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

  // === Kliknutí na událost ===
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
    setNotifications(event.notifications?.length > 0 ? event.notifications : [60]);
    setShowModal(true);
  };

  const handleCategoryChange = (e) => {
    const category = e.target.value;
    setFormData((prev) => ({
      ...prev,
      category,
      allDay: category === "SPORT" ? false : prev.allDay,
    }));
  };

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
    } else setFormData((prev) => ({ ...prev, duration: e.target.value }));
  };

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
      const newEnd = new Date(newStart.getTime() + 60 * 60 * 1000);
      setFormData((prev) => ({
        ...prev,
        start: format(newStart, "yyyy-MM-dd'T'HH:mm"),
        end: format(newEnd, "yyyy-MM-dd'T'HH:mm"),
      }));
    }
  };

  // === Pomocná funkce ===
  const buildPayloadFromEvent = (base, overrides = {}) => {
    const resolvedCategory = overrides.category ?? base.category ?? "OTHER";
    const isSport = resolvedCategory === "SPORT";
    const startVal = overrides.start ? new Date(overrides.start) : new Date(base.start);
    const endVal = overrides.end ? new Date(overrides.end) : new Date(base.end);
    return {
      id: base.id,
      title: overrides.title ?? base.title,
      description: isSport
        ? overrides.sportDescription ?? base.sportDescription ?? ""
        : overrides.description ?? base.description ?? "",
      startTime: format(startVal, "yyyy-MM-dd'T'HH:mm"),
      endTime: format(endVal, "yyyy-MM-dd'T'HH:mm"),
      category: resolvedCategory,
      allDay: isSport ? false : Boolean(overrides.allDay ?? base.allDay),
      duration: isSport ? Number(overrides.duration ?? base.duration) || null : null,
      distance: isSport ? Number(overrides.distance ?? base.distance) || null : null,
      sportDescription: isSport
        ? overrides.sportDescription ?? base.sportDescription ?? ""
        : null,
      sportType: isSport ? overrides.sportType ?? base.sportType ?? "OTHER" : null,
      filePath: overrides.filePath ?? base.filePath ?? null,
    };
  };



  // === Odeslání a mazání ===
  const handleSubmit = async (e) => {
    e.preventDefault();
    const email = localStorage.getItem("userEmail");
    if (!email) return alert("Uživatel není přihlášen.");

    // Upload souboru
    let uploadedFilePath = formData.filePath;
    if (formData.file) {
      const uploadData = new FormData();
      uploadData.append("file", formData.file);
      try {
        const res = await fetch(`${API_URL}/api/files/upload`, {
          method: "POST",
          body: uploadData,
        });
        if (!res.ok) return alert("Chyba při nahrávání souboru.");
        uploadedFilePath = await res.text();
      } catch {
        return alert("Chyba spojení s backendem při nahrávání souboru.");
      }
    }

    const payload = {
      title: formData.title,
      description:
        formData.category === "SPORT"
          ? formData.sportDescription
          : formData.description,
      startTime: formData.start,
      endTime: formData.end,
      category: formData.category,
      allDay: formData.category !== "SPORT" ? formData.allDay : false,
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
        formData.category === "SPORT" ? formData.sportDescription : null,
      sportType:
        formData.category === "SPORT" ? formData.sportType : null,
      filePath: uploadedFilePath || null,
      notifications,
    };

    const method = selectedEvent ? "PUT" : "POST";
    const url = selectedEvent
      ? `${API_URL}/api/events/${selectedEvent.id}?email=${encodeURIComponent(email)}`
      : `${API_URL}/api/events?email=${encodeURIComponent(email)}`;

    try {
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) return alert("Chyba při ukládání události.");
      setShowModal(false);
      setSelectedEvent(null);
      await loadEvents();
    } catch {
      alert("Chyba spojení s backendem při ukládání události.");
    }
  };

  const handleDelete = async () => {
    if (!selectedEvent) return;
    try {
      await fetch(`${API_URL}/api/events/${selectedEvent.id}`, {
        method: "DELETE",
      });
      setShowModal(false);
      setSelectedEvent(null);
      await loadEvents();
    } catch {
      alert("Chyba při mazání události.");
    }
  };

  // === Drag & Drop ===
  const handleEventDrop = async ({ event, start, end }) => {
    const email = localStorage.getItem("userEmail");
    const payload = buildPayloadFromEvent(event, { start, end });
    setEvents((prev) =>
      prev.map((e) =>
        e.id === event.id ? { ...e, start: new Date(start), end: new Date(end) } : e
      )
    );
    try {
      await fetch(`${API_URL}/api/events/${event.id}?email=${encodeURIComponent(email)}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      await loadEvents();
    } catch {
      await loadEvents();
    }
  };
  const handleEventResize = handleEventDrop;

  // === Export ===
  const handleExportPNG = async () => {
    if (view !== Views.MONTH) return alert("Export dostupný pouze v měsíčním pohledu.");
    const exportElement = document.querySelector(".rbc-calendar");
    if (!exportElement) return alert("Nelze najít kalendář k exportu.");

    try {
      const canvas = await html2canvas(exportElement, {
        backgroundColor: "#fff",
        scale: 2,
        useCORS: true,
      });
      const link = document.createElement("a");
      link.download = `WeekFitter-${format(date, "MM-yyyy")}.png`;
      link.href = canvas.toDataURL("image/png");
      link.click();
    } catch {
      alert("Chyba při exportu obrázku.");
    }
  };

  // === Hlavní render ===
  return (
    <>
      <Header />
      <main className="calendar-container">
        <div className="calendar-card">
          <h2>Kalendář aktivit</h2>

          {/* Mobilní toolbar */}
          {isMobile && (
            <div className="mobile-toolbar">
              <div className="toolbar-nav">
                <button onClick={() => setDate(addDays(date, -7))}>‹</button>
                <button onClick={() => setDate(new Date())}>Dnes</button>
                <button onClick={() => setDate(addDays(date, 7))}>›</button>
              </div>
              <select
                className="view-select"
                value={view}
                onChange={(e) => setView(e.target.value)}
              >
                <option value="month">Měsíc</option>
                <option value="week">Týden</option>
                <option value="day">Den</option>
                <option value="agenda">Agenda</option>
              </select>
            </div>
          )}

          {/* Export */}
          {view === Views.MONTH && (
            <button className="export-btn" onClick={handleExportPNG}>
              Exportovat jako PNG
            </button>
          )}

          {/* Kalendář */}
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
            popup
            eventPropGetter={getEventStyle}
            components={{ event: CustomEvent }}
            view={view}
            date={date}
            onView={setView}
            onNavigate={setDate}
            style={{ height: calendarHeight, fontSize: calendarFont }}
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

          {/* Spodní bar pro mobil */}
          {isMobile && (
            <div className="bottom-bar">
              <button onClick={() => setShowModal(true)}>➕ Nová</button>
              <button onClick={handleExportPNG}>📤 Export</button>
            </div>
          )}

          {/* Modal */}
          {showModal && (
            <div className="modal-overlay">
              <div className="modal-content">
                <h3>{selectedEvent ? "Upravit událost" : "Přidat novou událost"}</h3>
                <form onSubmit={handleSubmit}>
                  <label>Název:</label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) =>
                      setFormData({ ...formData, title: e.target.value })
                    }
                    required
                  />

                  <label>Kategorie:</label>
                  <select value={formData.category} onChange={handleCategoryChange}>
                    <option value="SPORT">Sport</option>
                    <option value="WORK">Práce</option>
                    <option value="SCHOOL">Škola</option>
                    <option value="REST">Odpočinek</option>
                    <option value="OTHER">Jiné</option>
                  </select>

                  {/* SPORT sekce */}
                  {formData.category === "SPORT" ? (
                    <div className="sport-section">
                      <h4>Sportovní údaje</h4>

                      <label>Typ sportu:</label>
                      <select
                        value={formData.sportType}
                        onChange={(e) =>
                          setFormData({ ...formData, sportType: e.target.value })
                        }
                      >
                        <option value="RUNNING">Běh</option>
                        <option value="CYCLING">Kolo</option>
                        <option value="SWIMMING">Plavání</option>
                        <option value="OTHER">Jiné</option>
                      </select>

                      <label>Popis aktivity:</label>
                      <textarea
                        value={formData.sportDescription}
                        onInput={(e) => {
                          e.target.style.height = "auto";
                          e.target.style.height = `${e.target.scrollHeight}px`;
                        }}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            sportDescription: e.target.value,
                          })
                        }
                      />

                      <label>Trvání (minuty):</label>
                      <input
                        type="number"
                        value={formData.duration}
                        onChange={handleDurationChange}
                      />

                      <label>Vzdálenost (km):</label>
                      <input
                        type="number"
                        value={formData.distance}
                        onChange={(e) =>
                          setFormData({ ...formData, distance: e.target.value })
                        }
                      />

                      <label>Soubor GPX/JSON:</label>
                      <input
                        type="file"
                        accept=".gpx,.json"
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            file: e.target.files?.[0] || null,
                          })
                        }
                      />
                      {formData.filePath && (
                        <div className="file-download">
                          <a
                            href={`${API_URL}${formData.filePath}`}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            📄 Stáhnout přiložený soubor
                          </a>
                        </div>
                      )}
                    </div>
                  ) : (
                    <>
                      <div className="allday-row">
                        <input
                          id="allday"
                          type="checkbox"
                          checked={formData.allDay}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              allDay: e.target.checked,
                            })
                          }
                        />
                        <label htmlFor="allday">Celý den</label>
                      </div>

                      <label>Popis:</label>
                      <textarea
                        value={formData.description}
                        onInput={(e) => {
                          e.target.style.height = "auto";
                          e.target.style.height = `${e.target.scrollHeight}px`;
                        }}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            description: e.target.value,
                          })
                        }
                      />
                    </>
                  )}

                  {/* Časy */}
                  {!formData.allDay && (
                    <div className="time-row">
                      <div>
                        <label>Začátek:</label>
                        <input
                          type="datetime-local"
                          value={formData.start}
                          onChange={handleStartChange}
                          required
                        />
                      </div>
                      <div>
                        <label>Konec:</label>
                        <input
                          type="datetime-local"
                          value={formData.end}
                          onChange={(e) =>
                            setFormData({ ...formData, end: e.target.value })
                          }
                          required
                        />
                      </div>
                    </div>
                  )}

                  {/* Notifikace */}
                  <div className="notification-section">
                    <h4>Upozornění</h4>
                    {notifications.map((min, i) => (
                      <div key={i} className="notify-row">
                        <label>Upozornit před:</label>
                        <select
                          value={min}
                          onChange={(e) => {
                            const copy = [...notifications];
                            copy[i] = Number(e.target.value);
                            setNotifications(copy);
                          }}
                        >
                          <option value={5}>5 minut</option>
                          <option value={15}>15 minut</option>
                          <option value={30}>30 minut</option>
                          <option value={60}>1 hodina</option>
                          <option value={120}>2 hodiny</option>
                          <option value={1440}>1 den</option>
                          <option value={2880}>2 dny</option>
                          <option value={10080}>1 týden</option>
                        </select>
                        <button
                          type="button"
                          className="close-notify-btn"
                          onClick={() =>
                            setNotifications(
                              notifications.filter((_, idx) => idx !== i)
                            )
                          }
                        >
                          ✖
                        </button>
                      </div>
                    ))}
                    <button
                      type="button"
                      className="add-notify-btn"
                      onClick={() => setNotifications([...notifications, 60])}
                    >
                      ➕ Další upozornění
                    </button>
                  </div>

                  {/* Tlačítka */}
                  <div className="modal-buttons">
                    <button type="submit">
                      {selectedEvent ? "Uložit" : "Přidat"}
                    </button>
                    {selectedEvent && (
                      <button
                        type="button"
                        className="delete-btn"
                        onClick={handleDelete}
                      >
                        Smazat
                      </button>
                    )}
                    <button
                      type="button"
                      className="cancel-btn"
                      onClick={() => setShowModal(false)}
                    >
                      Zrušit
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      </main>
    </>
  );
};

export default CalendarPage;
