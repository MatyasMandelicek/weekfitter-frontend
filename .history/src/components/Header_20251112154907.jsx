.dashboard-container {
    min-height: 100vh;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;

    background: 
        linear-gradient(135deg, rgba(255, 106, 0, 0.95), rgba(238, 9, 121, 0.95)),
        url("../assets/Triathlon.png");
    background-size: cover;
    background-position: center 49%;
    background-repeat: no-repeat;
    background-blend-mode: overlay;

    color: white;
    text-align: center;
    padding: 40px;
    overflow: hidden;
}

.dashboard-card {
  background-color: rgba(255, 255, 255, 0.97);
  border-radius: 20px;
  box-shadow: 0 4px 25px rgba(0, 0, 0, 0.25);
  padding: 30px;
  max-width: 1100px;
  width: 100%;
  animation: fadeIn 0.5s ease-in-out;
}

.dashboard-title {
  color: #ff6a00;
  margin-bottom: 18px;
  text-align: center;
  font-size: 2rem;
  font-weight: 700;
}

.dash-loading,
.dash-error {
  text-align: center;
  padding: 18px;
  border-radius: 12px;
  margin: 16px 0 8px;
  font-weight: 600;
}
.dash-error { background: #ffe7e7; color: #b00020; }

.dash-controls {
  display: flex;
  gap: 16px;
  flex-wrap: wrap;
  justify-content: space-between;
  margin-bottom: 22px;
}

.period-switch,
.sport-switch {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.pill-btn {
  padding: 8px 14px;
  border-radius: 999px;
  border: 2px solid #eee;
  background: #fafafa;
  color: #333;
  font-weight: 600;
  transition: all 0.2s ease;
}
.pill-btn:hover { transform: translateY(-1px); }
.pill-btn.active {
  background: linear-gradient(135deg, #ff6a00, #ee0979);
  color: #fff;
  border-color: transparent;
  box-shadow: 0 3px 12px rgba(238, 9, 121, 0.25);
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 14px;
  margin-bottom: 22px;
}

.stat-card {
  background: #fff;
  border-radius: 16px;
  padding: 18px 16px;
  box-shadow: 0 2px 14px rgba(0,0,0,0.08);
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.stat-label {
  font-size: 0.9rem;
  color: #666;
  font-weight: 600;
}

.stat-value {
  font-size: 1.6rem;
  font-weight: 800;
  color: #222;
}

.unit { font-size: 0.95rem; color: #888; margin-left: 4px; }

.charts-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 18px;
}

.chart-card {
  background: #fff;
  border-radius: 16px;
  padding: 16px;
  box-shadow: 0 2px 14px rgba(0,0,0,0.08);
}

.chart-card h3 {
  color: #444;
  font-size: 1.1rem;
  margin-bottom: 8px;
  font-weight: 700;
}

@media (min-width: 900px) {
  .charts-grid {
    grid-template-columns: 1fr 1fr;
  }
  .charts-grid .chart-card:nth-child(3) {
    grid-column: span 2;
  }
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}
