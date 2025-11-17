/**
 * DashboardPage.js
 * 
 * Přehled výkonnostních statistik uživatele
 * 
 * Načítá sportovní události z backendu
 * Filtrování podle období (den/týden/měsíc/rok/vše)
 * Filtrování podle typu sportu
 * Vypočítává celkové metriky (vzdálenost, čas, počet aktivit)
 * Zobrazuje 3 hlavní grafy pomocí knihovny Recharts:
 *  Trend vzdálenosti (LineChart)
 *  Součet času podle sportu (BarChart)
 *  Podíl sportů (PieChart)
 */

import React, { useEffect, useMemo, useState } from "react";
import Header from "../components/Header";
import "../styles/DashboardPage.css";
import {  parseISO, startOfWeek, endOfWeek, startOfMonth, endOfMonth, startOfYear, endOfYear, isWithinInterval, format, eachDayOfInterval, eachWeekOfInterval, addDays } from "date-fns";
import { cs } from "date-fns/locale";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, BarChart, Bar, PieChart, Pie, Cell, Legend } from "recharts";
import { API_URL } from "../lib/config";

// Mapování SportType z backendu -> uživatelské labely
const SPORT_LABEL = {
  RUNNING: "Běh",
  CYCLING: "Kolo",
  SWIMMING: "Plavání",
  OTHER: "Ostatní",
};

const SPORT_ORDER = ["RUNNING", "CYCLING", "SWIMMING", "OTHER"];

const PERIODS = [
  { key: "day", label: "Den" },
  { key: "week", label: "Týden" },
  { key: "month", label: "Měsíc" },
  { key: "year", label: "Rok" },
  { key: "all", label: "Vše" },
];

// Barvy pouze pro legendu/grafy (konzistentní napříč app)
const SPORT_COLORS = {
  RUNNING: "#ff6a00",
  CYCLING: "#ee0979",
  SWIMMING: "#0088FE",
  OTHER: "#8884d8",
};

// Pomocná - bezpečný parse LocalDateTime (ISO string)
const toDate = (dt) => {
  try {
    return typeof dt === "string" ? parseISO(dt) : new Date(dt);
  } catch {
    return null;
  }
};

// Vrací délku trvání události v minutách
const minutesBetween = (start, end) => {
  if (!start || !end) return 0;
  const ms = end.getTime() - start.getTime();
  return Math.max(0, Math.round(ms / 60000));
};

// Vrátí číslo nebo 0
const numberOrZero = (v) => (typeof v === "number" && !isNaN(v) ? v : 0);

// Hlavní komponenta DashboardPage
const DashboardPage = () => {
  const [loading, setLoading] = useState(true);
  const [events, setEvents] = useState([]);
  const [period, setPeriod] = useState("week");
  const [sportFilter, setSportFilter] = useState("ALL");
  const [error, setError] = useState("");

  /**
   * Načítání dat z backendu
   * 
   * Načítá sportovní události pro přihlášeného uživatele.
   * Filtrované pouze na záznamy, které mají `sportType`.
   */
  useEffect(() => {
    const email = localStorage.getItem("userEmail");
    if (!email) {
      setError("Chybí e-mail přihlášeného uživatele. Nastav jej v profilu.");
      setLoading(false);
      return;
    }

    const load = async () => {
      try {
        setLoading(true);
        const res = await fetch(`${API_URL}/api/events?email=${encodeURIComponent(email)}`);

        console.log("Dashboard fetch status:", res.status);
        let text = await res.text();
        console.log("Dashboard raw response:", text);

        if (!res.ok) throw new Error(`HTTP ${res.status}`);

        let data;
        try {
        data = JSON.parse(text);
        } catch {
        console.warn("Response nebyl JSON – obsah:", text);
        data = [];
        }

        // Normalizace dat pro další zpracování
        const normalized = (data || [])
          .filter((e) => e.sportType)
          .map((e) => {
            const start = toDate(e.startTime);
            const end = toDate(e.endTime);
            const durationMin =
              typeof e.duration === "number" && !isNaN(e.duration)
                ? e.duration
                : minutesBetween(start, end);

            return {
              ...e,
              _start: start,
              _end: end,
              _durationMin: durationMin,
              _distanceKm: numberOrZero(e.distance),
            };
          });

        setEvents(normalized);
        setError("");
      } catch (err) {
        console.error(err);
        setError("Nepodařilo se načíst data pro dashboard.");
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  // Časový interval podle zvoleného období
  const interval = useMemo(() => {
    const now = new Date();
    switch (period) {
      case "day": {
        const start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const end = addDays(start, 1);
        return { start, end };
      }
      case "week":
        return { start: startOfWeek(now, { locale: cs, weekStartsOn: 1 }), end: endOfWeek(now, { locale: cs, weekStartsOn: 1 }) };
      case "month":
        return { start: startOfMonth(now), end: endOfMonth(now) };
      case "year":
        return { start: startOfYear(now), end: endOfYear(now) };
      case "all":
      default:
        return null;
    }
  }, [period]);

  // Filtrování podle sportu a období
  const filtered = useMemo(() => {
    return events.filter((e) => {
      if (sportFilter !== "ALL" && e.sportType !== sportFilter) return false;
      if (!interval) return true;
      if (!e._start) return false;
      return isWithinInterval(e._start, { start: interval.start, end: interval.end });
    });
  }, [events, sportFilter, interval]);

  // Hlavní metriky
  const totals = useMemo(() => {
    const distance = filtered.reduce((s, e) => s + numberOrZero(e._distanceKm), 0);
    const duration = filtered.reduce((s, e) => s + numberOrZero(e._durationMin), 0);
    const activities = filtered.length;
    return {
      distanceKm: distance,
      durationMin: duration,
      activities,
    };
  }, [filtered]);

  // Trend vzdálenosti (x-osa: dny/týdny podle period)
  const trendData = useMemo(() => {
    if (filtered.length === 0) return [];

    // Vytvoření „bucketu“ podle období
    if (period === "day" || period === "week" || period === "month") {
      const start = interval.start;
      const end = interval.end;

      // Den/týden/měsíc - dny na ose X
      const days = eachDayOfInterval({ start, end });
      const map = new Map(days.map((d) => [format(d, "yyyy-MM-dd"), 0]));

      filtered.forEach((e) => {
        if (!e._start) return;
        const key = format(e._start, "yyyy-MM-dd");
        if (map.has(key)) {
          map.set(key, map.get(key) + numberOrZero(e._distanceKm));
        }
      });

      return Array.from(map.entries()).map(([day, val]) => ({
        name: format(parseISO(day), "d.M.", { locale: cs }),
        distance: Number(val.toFixed(2)),
      }));
    }

    if (period === "year") {
      // Rok - týdny
      const start = interval.start;
      const end = interval.end;
      const weeks = eachWeekOfInterval({ start, end }, { weekStartsOn: 1 });
      const map = new Map(weeks.map((w) => [format(w, "yyyy-'W'II"), 0]));

      filtered.forEach((e) => {
        if (!e._start) return;
        const wkKey = format(startOfWeek(e._start, { weekStartsOn: 1 }), "yyyy-'W'II");
        if (map.has(wkKey)) {
          map.set(wkKey, map.get(wkKey) + numberOrZero(e._distanceKm));
        }
      });

      return Array.from(map.entries()).map(([wk, val]) => ({
        name: wk.replace("W", "Týd "),
        distance: Number(val.toFixed(2)),
      }));
    }

    // Vše - seskupení po měsících
    const map = new Map();
    filtered.forEach((e) => {
      if (!e._start) return;
      const key = format(e._start, "yyyy-MM");
      map.set(key, (map.get(key) || 0) + numberOrZero(e._distanceKm));
    });

    return Array.from(map.entries())
      .sort(([a], [b]) => (a < b ? -1 : 1))
      .map(([key, val]) => ({
        name: format(parseISO(key + "-01"), "LLL yyyy", { locale: cs }),
        distance: Number(Number(val).toFixed(2)),
      }));
  }, [filtered, period, interval]);

  // Sloupcový graf - součet času podle sportu
  const durationBySport = useMemo(() => {
    const sums = SPORT_ORDER.reduce((acc, s) => ({ ...acc, [s]: 0 }), {});
    filtered.forEach((e) => {
      if (!e.sportType) return;
      sums[e.sportType] += numberOrZero(e._durationMin);
    });
    return SPORT_ORDER.map((s) => ({
      sport: SPORT_LABEL[s],
      minutes: Math.round(sums[s]),
      key: s,
    }));
  }, [filtered]);

  // Koláč - podíl sportů (podle hodin)
  const distribution = useMemo(() => {
    const counts = SPORT_ORDER.reduce((acc, s) => ({ ...acc, [s]: 0 }), {});
    filtered.forEach((e) => {
      if (e.sportType && e.duration) {
        counts[e.sportType] += e.duration;
      }
    });
    const total = Object.values(counts).reduce((a, b) => a + b, 0) || 1;
    return SPORT_ORDER.map((s) => ({
      name: SPORT_LABEL[s],
      value: counts[s],
      percent: Math.round((counts[s] / total) * 100),
      key: s,
    }));
  }, [filtered]);


  return (
    <>
      <Header />
      <div className="dashboard-container">
        <div className="dashboard-card">
          <h2 className="dashboard-title">Dashboard</h2>

          {loading && <div className="dash-loading">Načítám data…</div>}
          {error && !loading && <div className="dash-error">{error}</div>}

          {!loading && !error && (
            <>
              {/* Ovládání */}
              <div className="dash-controls">
                <div className="period-switch">
                  {PERIODS.map((p) => (
                    <button
                      key={p.key}
                      className={`pill-btn ${period === p.key ? "active" : ""}`}
                      onClick={() => setPeriod(p.key)}
                    >
                      {p.label}
                    </button>
                  ))}
                </div>

                <div className="sport-switch">
                  {["ALL", ...SPORT_ORDER].map((s) => (
                    <button
                      key={s}
                      className={`pill-btn ${sportFilter === s ? "active" : ""}`}
                      onClick={() => setSportFilter(s)}
                      style={s !== "ALL" ? { borderColor: SPORT_COLORS[s] } : {}}
                      title={s === "ALL" ? "Všechny sporty" : SPORT_LABEL[s]}
                    >
                      {s === "ALL" ? "Vše" : SPORT_LABEL[s]}
                    </button>
                  ))}
                </div>
              </div>

              {/* Karty s metrikami */}
              <div className="stats-grid">
                <div className="stat-card">
                  <div className="stat-label">Vzdálenost</div>
                  <div className="stat-value">
                    {totals.distanceKm.toFixed(2)} <span className="unit">km</span>
                  </div>
                </div>
                <div className="stat-card">
                  <div className="stat-label">Čas</div>
                  <div className="stat-value">
                    {Math.floor(totals.durationMin / 60)}h {totals.durationMin % 60}m
                  </div>
                </div>
                <div className="stat-card">
                  <div className="stat-label">Aktivity</div>
                  <div className="stat-value">{totals.activities}</div>
                </div>
              </div>

              {/* Grafy */}
              <div className="charts-grid">
                <div className="chart-card">
                  <h3>Trend vzdálenosti</h3>
                  <ResponsiveContainer width="100%" height={280}>
                    <LineChart data={trendData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip />
                      <Line type="monotone" dataKey="distance" stroke="#ff6a00" dot={false} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>

                <div className="chart-card">
                  <h3>Součet času podle sportu</h3>
                  <ResponsiveContainer width="100%" height={280}>
                    <BarChart data={durationBySport}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="sport" />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="minutes">
                        {durationBySport.map((d, i) => (
                          <Cell key={i} fill={SPORT_COLORS[d.key]} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                <div className="chart-card">
                  <h3>Podíl sportů</h3>
                  <ResponsiveContainer width="100%" height={280}>
                    <PieChart>
                      <Tooltip />
                      <Legend />
                      <Pie
                        data={distribution}
                        dataKey="value"
                        nameKey="name"
                        outerRadius={100}
                        label={(d) => `${d.name} ${d.percent}%`}
                      >
                        {distribution.map((d, i) => (
                          <Cell key={i} fill={SPORT_COLORS[d.key]} />
                        ))}
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
};

export default DashboardPage;
