import React, { useState, useEffect } from 'react';
import io from 'socket.io-client';
import FactoryMap from './components/FactoryMap';
import './App.css';
import AIForeman from './components/AIForeman';

const SOCKET_URL = process.env.REACT_APP_SERVER_URL || "http://localhost:3001";
const socket = io.connect(SOCKET_URL);

/* ─── 🏛️ TN GOVERNMENT SEAL ─── */
const TnEmblem = ({ size = 52 }) => (
  <svg width={size} height={size} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="50" cy="50" r="47" fill="#002147" stroke="#D4AF37" strokeWidth="2.5" />
    <circle cx="50" cy="50" r="40" fill="none" stroke="rgba(212,175,55,0.4)" strokeWidth="1" />
    {/* Lions / pillars */}
    <rect x="30" y="28" width="6" height="22" rx="3" fill="#D4AF37" opacity="0.9" />
    <rect x="64" y="28" width="6" height="22" rx="3" fill="#D4AF37" opacity="0.9" />
    {/* Center pillar */}
    <rect x="47" y="22" width="6" height="28" rx="3" fill="#D4AF37" />
    <circle cx="50" cy="18" r="5" fill="#D4AF37" />
    {/* Base */}
    <rect x="26" y="52" width="48" height="4" rx="2" fill="#D4AF37" opacity="0.8" />
    {/* Wheel-like emblem */}
    <circle cx="50" cy="40" r="8" fill="none" stroke="#D4AF37" strokeWidth="1.5" opacity="0.5" />
    {/* Wave / prosperity */}
    <path d="M28 66 Q38 60 50 66 Q62 72 72 66" stroke="#2E7D32" strokeWidth="3" fill="none" strokeLinecap="round" />
    <text x="50" y="82" textAnchor="middle" fill="#D4AF37" fontSize="6.5" fontWeight="700" letterSpacing="0.5">TAMIL NADU</text>
  </svg>
);

/* ─── 🟢 NIMIRNDHU NIL LOGO ─── */
const NimirndhuNilLogo = ({ size = 42 }) => (
  <svg width={size} height={size} viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M32 4L8 16V34C8 48 20 58 32 62C44 58 56 48 56 34V16L32 4Z" fill="url(#nnGrad)" stroke="rgba(74,222,128,0.5)" strokeWidth="1.5" />
    <rect x="29" y="18" width="6" height="22" rx="3" fill="white" opacity="0.95" />
    <circle cx="32" cy="14" r="4" fill="white" opacity="0.95" />
    <rect x="22" y="42" width="20" height="3" rx="1.5" fill="#4ade80" opacity="0.9" />
    <path d="M32 22L25 30" stroke="#4ade80" strokeWidth="1.5" strokeLinecap="round" opacity="0.8" />
    <path d="M32 22L39 30" stroke="#4ade80" strokeWidth="1.5" strokeLinecap="round" opacity="0.8" />
    <defs>
      <linearGradient id="nnGrad" x1="8" y1="4" x2="56" y2="62" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#15803d" />
        <stop offset="100%" stopColor="#166534" />
      </linearGradient>
    </defs>
  </svg>
);

/* ─── 🎓 EDII-TN / CAHCET INNOVATION LOGO ─── */
const EdiiTnLogo = ({ size = 32 }) => (
  <svg width={size} height={size} viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect width="64" height="64" rx="10" fill="url(#ediiGrad)" />
    {/* Book shape */}
    <rect x="12" y="16" width="40" height="32" rx="3" fill="none" stroke="white" strokeWidth="2" opacity="0.8" />
    <line x1="32" y1="16" x2="32" y2="48" stroke="white" strokeWidth="1.5" opacity="0.7" />
    {/* Lines on pages */}
    <line x1="16" y1="24" x2="28" y2="24" stroke="white" strokeWidth="1.5" opacity="0.6" strokeLinecap="round" />
    <line x1="16" y1="30" x2="28" y2="30" stroke="white" strokeWidth="1.5" opacity="0.6" strokeLinecap="round" />
    <line x1="16" y1="36" x2="28" y2="36" stroke="white" strokeWidth="1.5" opacity="0.6" strokeLinecap="round" />
    <line x1="36" y1="24" x2="48" y2="24" stroke="white" strokeWidth="1.5" opacity="0.6" strokeLinecap="round" />
    <line x1="36" y1="30" x2="48" y2="30" stroke="white" strokeWidth="1.5" opacity="0.6" strokeLinecap="round" />
    <line x1="36" y1="36" x2="48" y2="36" stroke="white" strokeWidth="1.5" opacity="0.6" strokeLinecap="round" />
    {/* Torch at top */}
    <polygon points="32,4 29,12 35,12" fill="#D4AF37" opacity="0.9" />
    <rect x="30.5" y="10" width="3" height="6" rx="1" fill="#D4AF37" opacity="0.9" />
    <defs>
      <linearGradient id="ediiGrad" x1="0" y1="0" x2="64" y2="64" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#1e3a8a" />
        <stop offset="100%" stopColor="#1e40af" />
      </linearGradient>
    </defs>
  </svg>
);

const statusColors = {
  "Idle": "#64748b",
  "Working": "#3b82f6",
  "Charging": "#10b981",
  "DEADLOCK": "#ef4444",
  "SERVICE INTERCEPT": "#D4AF37"
};

function App() {
  const [data, setData] = useState({
    grid: [], robots: [], taskHistory: [], autopilotActive: true,
    mesMetrics: { energyHarvested: 0, carbonOffset: 0, fleetROI: 0, fleetEfficiency: 0, preventedFailures: 0, maintenanceSavings: 0 },
    fleetStats: { avgBattery: 0, activeTasks: 0, totalCongestion: 0 },
    zones: {}, schedule: [], taskQueue: []
  });

  useEffect(() => {
    socket.on("update", (incoming) => setData(incoming));
    return () => socket.off("update");
  }, []);

  const handleManualTask = (robotId, taskName) => socket.emit("assignTask", { robotId, taskName });

  const [messages, setMessages] = useState([{
    text: "🏛️ State Logistics Auditor online. Government of Tamil Nadu — Sovereign Digital Twin V9.0 operational. KERS and solar harvest systems active. All AGV telemetry nominal.",
    type: "bot"
  }]);

  useEffect(() => {
    socket.on("chatResponse", (text) => setMessages(prev => [...prev, { text, type: "bot" }]));
    return () => socket.off("chatResponse");
  }, []);

  const handleSendMessage = (text) => {
    setMessages(prev => [...prev, { text, type: "user" }]);
    socket.emit("chatQuery", text);
  };

  const [gridTheme, setGridTheme] = useState('dark');
  const [cameraMode, setCameraMode] = useState('MANUAL');
  const [zoomRequest, setZoomRequest] = useState(null);

  const autoTarget = data.robots.slice().sort((a, b) => {
    const scoreA = (a.health < 50 ? 1000 : 0) + (a.priority || 0);
    const scoreB = (b.health < 50 ? 1000 : 0) + (b.priority || 0);
    return scoreB - scoreA;
  })[0];

  /* ─── SIDEBAR / UI: Full bilingual Tamil-English zone names ─── */
  const getSovereignZoneName = (name) => {
    const mapping = {
      "நெல் கிடங்கு (Rice Intake)": "நெல் கிடங்கு – Rice Intake",
      "Rice Intake": "நெல் கிடங்கு – Rice Intake",
      "Warehouse": "நெல் கிடங்கு – Rice Intake",
      "Grading Mill A": "மதிப்புக்கூட்டு மையம் A – Value Addition A",
      "Grading Mill B": "மதிப்புக்கூட்டு மையம் B – Value Addition B",
      "Production": "மதிப்புக்கூட்டு மையம் – Value Addition",
      "Quality Lab": "தரக்கட்டுப்பாட்டு ஆய்வகம் – Quality Lab",
      "Quality Control": "தரக்கட்டுப்பாட்டு ஆய்வகம் – Quality Lab",
      "PDS Dispatch": "விநியோக மையம் – Distribution Hub",
      "Shipping": "விநியோக மையம் – Distribution Hub",
      "PDS Packaging": "PDS பொதியல் மையம் – PDS Packaging",
      "Distribution Hub": "விநியோக மையம் – Distribution Hub",
      "Reserve Godown": "இருப்பு கிடங்கு – Reserve Godown",
      "மருந்து சேமிப்பு (Medicine Storage)": "மருந்து சேமிப்பு – Medicine Storage",
      "Medicine Storage": "மருந்து சேமிப்பு – Medicine Storage",
      "Charging Bay": "சார்ஜிங் மையம் – Charging Bay",
    };
    return mapping[name] || name;
  };

  /* ─── 3D TWIN: Short English-only labels (Tamil won't render in Three.js default font) ─── */
  const get3DZoneLabel = (name) => {
    const mapping = {
      "நெல் கிடங்கு (Rice Intake)": "🌾 Rice Intake",
      "Rice Intake": "🌾 Rice Intake",
      "Warehouse": "🌾 Rice Intake",
      "Grading Mill A": "⚙️ Value Addition A",
      "Grading Mill B": "⚙️ Value Addition B",
      "Production": "⚙️ Value Addition",
      "Quality Lab": "🔬 Quality Lab",
      "Quality Control": "🔬 Quality Lab",
      "PDS Dispatch": "📦 PDS Dispatch",
      "Shipping": "📦 Distribution Hub",
      "PDS Packaging": "🏷️ PDS Packaging",
      "Distribution Hub": "🚚 Distribution Hub",
      "Reserve Godown": "🏚️ Reserve Godown",
      "மருந்து சேமிப்பு (Medicine Storage)": "💊 Medicine Storage",
      "Medicine Storage": "💊 Medicine Storage",
      "Charging Bay": "⚡ Charging Bay",
      "Ready": "✅ Ready Zone",
    };
    return mapping[name] || name;
  };

  return (
    <div className="app-container">

      {/* ══════════════════════════════════════════════════════════ */}
      {/* 🏛️ SOVEREIGN STATE TOPBAR                                 */}
      {/* ══════════════════════════════════════════════════════════ */}
      <div className="state-topbar">
        <div className="state-emblem-pair">
          <TnEmblem size={52} />
          <div className="topbar-divider" />
          <NimirndhuNilLogo size={40} />
        </div>

        <div className="state-title-group">
          <div className="state-main-title">State Logistics Command Center</div>
          <div className="state-subtitle">Government of Tamil Nadu · Civil Supplies & Consumer Protection · Sovereign Digital Twin V9.0</div>
        </div>

        <div className="state-topbar-right">
          <div className="topbar-badge audit">🔐 AUDIT ACTIVE</div>
          <div className="topbar-badge live">
            <span className="live-dot" />
            LIVE
          </div>
          <EdiiTnLogo size={36} />
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════ */}
      {/* 1️⃣ LEFT COLUMN: SERVICE LOGISTICS KPIS                   */}
      {/* ══════════════════════════════════════════════════════════ */}
      <div className="sidebar">

        <div className="sidebar-header">
          <span className="sidebar-header-icon">🏛️</span>
          <span>Service Logistics KPIs</span>
        </div>

        {/* PUBLIC SERVICE ROI */}
        <div className="kpi-card gold">
          <div className="kpi-icon">💰</div>
          <div className="kpi-body">
            <div className="kpi-label">Public Service ROI</div>
            <div className="kpi-value">₹{(data.mesMetrics?.fleetROI || 0).toLocaleString('en-IN')}</div>
            <div className="kpi-trend gold">↑ State Budget Savings Impact</div>
          </div>
        </div>

        {/* KERS ENERGY HARVESTED */}
        <div className="kpi-card emerald">
          <div className="kpi-icon">⚡</div>
          <div className="kpi-body">
            <div className="kpi-label">KERS Energy Harvested</div>
            <div className="kpi-value emerald">{data.mesMetrics?.energyHarvested || 0} <span className="kpi-unit">Wh</span></div>
            <div className="kpi-trend emerald">🌞 Solar: {Math.round(data.solarIrradiance || 0)} W/m² · 100% Recovery</div>
          </div>
        </div>

        {/* STATE CARBON OFFSET */}
        <div className="kpi-card emerald">
          <div className="kpi-icon">🌿</div>
          <div className="kpi-body">
            <div className="kpi-label">State Carbon Offset</div>
            <div className="kpi-value emerald">{data.mesMetrics?.carbonOffset || 0} <span className="kpi-unit">kg</span></div>
            <div className="kpi-trend emerald">🌱 Green TN Mission Compliance</div>
          </div>
        </div>

        {/* INFRASTRUCTURE SAVINGS */}
        <div className="kpi-card gold">
          <div className="kpi-icon">🛠️</div>
          <div className="kpi-body">
            <div className="kpi-label">Infrastructure Savings</div>
            <div className="kpi-value">₹{(data.mesMetrics?.maintenanceSavings || 0).toLocaleString('en-IN')}</div>
            <div className="kpi-trend muted">{data.mesMetrics?.preventedFailures || 0} equipment failures prevented</div>
          </div>
        </div>

        {/* GREEN TN BANNER */}
        <div className="green-tn-banner">
          <div className="green-tn-banner-icon">🌱</div>
          <div>
            <div className="green-tn-banner-title">Green Tamil Nadu Mission</div>
            <div className="green-tn-banner-sub">KERS + Solar harvesting active · Carbon neutral PDS logistics</div>
          </div>
        </div>

        {/* ─── PRIORITY SUPPLY QUEUE ─── */}
        <div className="sidebar-section">
          <div className="sidebar-section-title">
            <span>📋</span> Priority Supply Queue
          </div>
          <div className="mission-list">
            {data.taskQueue?.length > 0 ? (
              data.taskQueue.slice(0, 4).map((task, idx) => (
                <div key={idx} className={`mission-item ${task.priority > 7 ? 'high' : ''}`}>
                  <div className="mission-item-name">
                    {task.displayName || task.name}
                  </div>
                  <div className="mission-item-meta">
                    {task.type?.replace("_", " ") || "STOCKS"} · P{task.priority}
                    {task.priority > 7 && <span className="mission-govt-badge">GOVT PRIORITY</span>}
                  </div>
                </div>
              ))
            ) : (
              <div className="mission-empty">All state orders fulfilled</div>
            )}
            {data.taskQueue?.length > 4 && (
              <div className="mission-overflow">+{data.taskQueue.length - 4} more missions queued</div>
            )}
          </div>
        </div>

        {/* ─── DAILY SCHEDULE ─── */}
        <div className="sidebar-section">
          <div className="sidebar-section-title">
            <span>📅</span> Daily Operations
          </div>
          {(data.schedule || []).slice(0, 4).map((job) => (
            <div
              key={job.id}
              draggable
              onDragStart={(e) => {
                e.dataTransfer.setData("zone", job.zone);
                e.dataTransfer.setData("type", "schedule");
              }}
              className={`schedule-item ${job.status === 'Completed' ? 'completed' : ''}`}
            >
              <div>
                <div className="schedule-time">{job.time}</div>
                <div className="schedule-task">{job.task}</div>
              </div>
              <span className={`schedule-status ${job.status === 'Completed' ? 'completed' : ''}`}>
                {job.status}
              </span>
            </div>
          ))}
        </div>

        {/* ─── SAFETY HEARTBEAT ─── */}
        <div className="safety-heartbeat">
          <div className="safety-indicator">
            <div className="safety-dot" />
            SAFETY HEARTBEAT
          </div>
          <div className="safety-info">
            <span className="safety-badge">50×50m</span> Zone Verified
            <span className="safety-badge">100ms</span> Tick
          </div>
        </div>

      </div>

      {/* ══════════════════════════════════════════════════════════ */}
      {/* 2️⃣ CENTER: DIGITAL TWIN VISUALIZATION                    */}
      {/* ══════════════════════════════════════════════════════════ */}
      <div className="twin-viewport">
        <FactoryMap
          grid={data.grid}
          robots={data.robots}
          solarIrradiance={data.solarIrradiance}
          gridTheme={gridTheme}
          zones={data.zones}
          onZoneClick={(name) => handleSendMessage(`State audit report for ${getSovereignZoneName(name).replace('\n', ' — ')}`)}
          cameraMode={cameraMode}
          targetBot={autoTarget}
          zoomRequest={zoomRequest}
          getZoneDisplayName={get3DZoneLabel}
        />

        {/* ─── CAMERA CONTROLS ─── */}
        <div className="camera-controls">
          <div className="camera-zoom">
            <button className="cam-btn" onClick={() => setZoomRequest({ dir: 'IN', id: Date.now() })}>+</button>
            <button className="cam-btn" onClick={() => setZoomRequest({ dir: 'OUT', id: Date.now() })}>−</button>
          </div>
          <button
            className={`cam-btn-wide ${cameraMode === 'AUTO' ? 'active-red' : ''}`}
            onClick={() => setCameraMode(prev => prev === 'AUTO' ? 'MANUAL' : 'AUTO')}
          >
            {cameraMode === 'AUTO' ? '🛑 STOP' : '🎥 AUDITOR LOCK'}
          </button>
          <button
            className={`cam-btn-wide ${cameraMode === 'TOUR' ? 'active-blue' : ''}`}
            onClick={() => setCameraMode(prev => prev === 'TOUR' ? 'MANUAL' : 'TOUR')}
          >
            {cameraMode === 'TOUR' ? '⏹️ END TOUR' : '🚌 SITE TOUR'}
          </button>
          <button
            className="cam-btn-wide"
            onClick={() => setGridTheme(prev => prev === 'light' ? 'dark' : 'light')}
          >
            {gridTheme === 'dark' ? '🌞 LIGHT' : '🌚 DARK'}
          </button>
        </div>

        {/* ─── LIVE STATUS OVERLAY ─── */}
        <div className="twin-status-bar">
          <span className="live-pulse-badge">⬤ LIVE SOVEREIGN TWIN</span>
          <span>Fleet: {data.robots.filter(r => r.task !== 'Ready').length}/{data.robots.length} ACTIVE</span>
          <span>Avg Battery: {data.fleetStats?.avgBattery || 0}%</span>
          <span>☀️ {Math.round(data.solarIrradiance || 0)} W/m²</span>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════ */}
      {/* 3️⃣ RIGHT COLUMN: CIVIL SUPPLY FLEET + AI AUDITOR        */}
      {/* ══════════════════════════════════════════════════════════ */}
      <div className="right-panel">

        {/* ─── FLEET HEADER ─── */}
        <div className="right-panel-header">
          <span>🚛</span> Civil Supply Vehicle State
          <span className="fleet-count-badge">
            {data.robots.filter(r => r.task !== 'Ready').length} ACTIVE
          </span>
        </div>

        {/* ─── SCROLLABLE FLEET LIST ─── */}
        <div className="fleet-list">
          {data.robots.map(bot => {
            const mainStatus = bot.status?.split(":")?.[0] || "Idle";
            const isServiceMode = bot.status?.includes("SERVICE") || bot.status?.includes("MAINTENANCE");
            const isHighPriority = bot.isCritical || bot.task?.includes("Medicine") || bot.task?.includes("PDS") || bot.task?.includes("மருந்து");
            const statusColor = statusColors[mainStatus] || '#3b82f6';

            return (
              <div
                key={bot.id}
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  const zone = e.dataTransfer.getData("zone");
                  if (zone) handleManualTask(bot.id, zone);
                }}
                className={`agv-card ${isServiceMode ? 'service-mode' : ''} ${isHighPriority ? 'high-priority-mission' : ''}`}
                style={{ borderLeft: `4px solid ${bot.color}` }}
              >
                {/* POWERBANK ALERT */}
                {bot.status?.includes("POWERBANK") && (
                  <div className="agv-alert powerbank">⚠️ EMERGENCY RESERVE ACTIVE</div>
                )}
                {/* SOVEREIGN MISSION BANNER */}
                {isHighPriority && (
                  <div className="agv-alert sovereign-mission">🏛️ CRITICAL SOVEREIGN MISSION</div>
                )}

                {/* AGV HEADER */}
                <div className="agv-header">
                  <div>
                    <div className="agv-id">
                      AGV-{bot.id}
                      <span className="agv-coords">n-{bot.x}-{bot.y}</span>
                    </div>
                    <div className="agv-status" style={{ color: statusColor }}>{bot.status}</div>
                  </div>
                  {/* FRUGAL SENSORS */}
                  <div className="sensor-gauges">
                    <div className="sensor-gauge">
                      <div className="sensor-circle" style={{ borderColor: bot.esp32CamStatus === 'ONLINE' ? '#10b981' : '#ef4444' }}>
                        <span style={{ fontSize: 5 }}>{bot.esp32CamStatus === 'ONLINE' ? 'ON' : 'OFF'}</span>
                      </div>
                      <span className="sensor-label">CAM</span>
                    </div>
                    <div className="sensor-gauge">
                      <div className="sensor-circle" style={{ borderColor: '#3b82f6' }}>
                        <span style={{ fontSize: 7 }}>{Math.round(bot.ultrasonicDist || 150)}</span>
                      </div>
                      <span className="sensor-label">HC-SR04</span>
                    </div>
                  </div>
                </div>

                {/* BATTERY & HEALTH BARS */}
                <div className="agv-bars">
                  <div className="agv-bar-row">
                    <span className="bar-label">🔋 {Math.round(bot.battery || 0)}%</span>
                    <div className="bar-track">
                      <div className="bar-fill battery" style={{
                        width: `${bot.battery || 0}%`,
                        background: bot.battery > 50 ? '#10b981' : bot.battery > 25 ? '#f59e0b' : '#ef4444'
                      }} />
                    </div>
                  </div>
                  <div className="agv-bar-row">
                    <span className="bar-label">❤️ {Math.round(bot.health || 0)}%</span>
                    <div className="bar-track">
                      <div className="bar-fill health" style={{
                        width: `${bot.health || 0}%`,
                        background: bot.health > 70 ? '#10b981' : bot.health > 40 ? '#f59e0b' : '#ef4444'
                      }} />
                    </div>
                  </div>
                </div>

                {/* COMMODITY LOAD */}
                <div className="agv-commodity">
                  <div className="agv-commodity-row">
                    <span className="agv-commodity-label">LOAD:</span>
                    <span className="agv-commodity-value">
                      {bot.payloadWeight || 0} kg
                      {(bot.payloadWeight || 0) >= 100 && <span className="kers-max-badge">◆ KERS MAX</span>}
                    </span>
                  </div>
                  <div className="agv-commodity-sub">
                    🌡️ {Math.round(bot.motorTemp || 0)}°C ·
                    Stress: {Math.round(bot.stress || 0)} ·
                    <span style={{ color: bot.evBatteryStress === 'OPTIMAL SOC' ? '#10b981' : bot.evBatteryStress === 'DEEP DISCHARGE RISK' ? '#ef4444' : '#f59e0b' }}>
                      {' '}EV: {bot.evBatteryStress || 'MONITOR'}
                    </span>
                  </div>
                </div>

                {/* SOLAR / KERS BADGES */}
                {bot.solarActive && <div className="agv-energy-badge solar">☀️ SOLAR</div>}
                {bot.kersActive && !bot.solarActive && <div className="agv-energy-badge kers">⚡ KERS</div>}

                {/* ZONE DISPATCH BUTTONS */}
                <div className="zone-btn-grid">
                  {Object.keys(data.zones || {}).filter(z => z !== 'Ready').slice(0, 6).map(zone => (
                    <button
                      key={zone}
                      onClick={() => handleManualTask(bot.id, zone)}
                      className="zone-dispatch-btn"
                      title={getSovereignZoneName(zone)}
                    >
                      {zone.length > 18 ? zone.slice(0, 16) + '…' : zone}
                    </button>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        {/* ─── AI STATE LOGISTICS AUDITOR ─── */}
        <div className="ai-auditor-section">
          <div className="ai-auditor-label">
            <NimirndhuNilLogo size={14} />
            STATE LOGISTICS AUDITOR · AI COMMAND CENTER
          </div>
          <div style={{ flex: 1, minHeight: 0 }}>
            <AIForeman messages={messages} onSendMessage={handleSendMessage} />
          </div>
        </div>

      </div>
    </div>
  );
}

export default App;