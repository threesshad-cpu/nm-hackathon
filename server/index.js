const express = require('express');

const http = require('http');

const { Server } = require("socket.io");

const cors = require('cors');



const app = express();

app.use(cors());

const server = http.createServer(app);

const io = new Server(server, { cors: { origin: "*" } });



// --- ⚙️ CONFIG & AUTONOMOUS THRESHOLDS ---

const ROWS = 50;
const COLS = 50;

const TICK_RATE = 300;

const MAX_CHARGING_SLOTS = 7;

const MAINTENANCE_THRESHOLD = 50;



// --- 📊 STATE AWARENESS ---

let staticMap = Array(ROWS).fill().map(() => Array(COLS).fill(0));

let heatmap = Array(ROWS).fill().map(() => Array(COLS).fill(0));

let taskHistory = [];

let taskQueue = []; // 📋 Pending Missions

let autopilotActive = true;

// ☀️ GLOBAL ENVIRONMENT STATE (SIEMS)
let solarIrradiance = 0; // W/m²
let solarClock = 0; // Ticks for oscillation

// 📊 MISSION ECONOMIC SCORE (MES)
let totalEnergyHarvested = 0; // Wh
let totalFleetROI = 0; // ₹ Saved
let totalCarbonOffset = 0; // kg CO2
let totalEfficiencyTicks = 0;
let totalTimeTicks = 0;

// 🛠️ PREDICTIVE MAINTENANCE TRACKING
let totalPreventedFailures = 0;
let totalMaintenanceSavings = 0; // Estimated ₹ saved by avoiding emergency repairs



// --- 🏗️ VIRTUAL FACTORY LAYOUT (50x50) ---
// 1. Clear Grid
staticMap = Array(ROWS).fill().map(() => Array(COLS).fill(0));

// 2. Perimeter Walls
for (let i = 0; i < ROWS; i++) { staticMap[i][0] = 4; staticMap[i][COLS - 1] = 4; }
for (let j = 0; j < COLS; j++) { staticMap[0][j] = 4; staticMap[ROWS - 1][j] = 4; }

// 3. Zone Dividers
// Horiz Splits
for (let c = 1; c < COLS - 1; c++) {
  staticMap[18][c] = 4; // Split Top/Mid
  staticMap[35][c] = 4; // Split Mid/Bot
}
// Vert Splits
for (let r = 1; r < ROWS - 1; r++) {
  staticMap[r][18] = 4; // Left Divider
  staticMap[r][32] = 4; // Right Divider
}

// 4. Transit Arches/Gaps
// Horizontal Gaps (Crossings)
[8, 25, 42].forEach(c => {
  for (let d = 0; d < 4; d++) {
    if (staticMap[18][c + d] == 4) staticMap[18][c + d] = 0;
    if (staticMap[35][c + d] == 4) staticMap[35][c + d] = 0;
  }
});
// Vertical Gaps
[8, 26, 42].forEach(r => {
  for (let d = 0; d < 4; d++) {
    if (staticMap[r + d][18] == 4) staticMap[r + d][18] = 0;
    if (staticMap[r + d][32] == 4) staticMap[r + d][32] = 0;
  }
});

// 5. Asset Population
// Warehouse (Top Left): Racks (6)
for (let r = 2; r < 14; r += 3) for (let c = 2; c < 14; c += 3) staticMap[r][c] = 6;

// Overflow (Top Right): Racks (6)
for (let r = 2; r < 14; r += 3) for (let c = 34; c < 48; c += 3) staticMap[r][c] = 6;

// Production A (Mid Left) & B (Mid Right): Conveyors (7) & Arms (9)
// Prod A
for (let r = 22; r < 32; r += 4) {
  for (let c = 2; c < 12; c++) staticMap[r][c] = 7;
  staticMap[r][12] = 9;
}
// Prod B
for (let r = 22; r < 32; r += 4) {
  for (let c = 38; c < 48; c++) staticMap[r][c] = 7;
  staticMap[r][37] = 9;
}

// Packaging (Bot Left): Conveyors (7)
for (let c = 2; c < 14; c += 4) {
  for (let r = 38; r < 46; r++) staticMap[r][c] = 7;
}

// Shipping (Bot Right): Crates (8) & ATL Trailer
for (let r = 38; r < 44; r += 2) for (let c = 34; c < 48; c += 2) staticMap[r][c] = 8;
// ATL Dock (Bot Right Edge)
for (let c = 40; c < 48; c++) staticMap[48][c] = 7; // Conveyor loading into trailer

// Charging Bay (Bot Center): Ports (5)
for (let c = 22; c < 30; c += 2) staticMap[46][c] = 5;

// Quality Control (Center): Inspection Table (7 - conveyor loop)
for (let c = 24; c < 28; c++) staticMap[25][c] = 7;



// --- 🤖 FLEET INITIALIZATION ---

// --- ♻️ ECO-BUILD CHASSIS SPECS ---
// Chassis: Coconut-Fiber Composite + Recycled HDPE shell
// Source: Agricultural waste coir + post-consumer plastic
// Result: ~36% lighter than steel frame, biodegradable under ISO 14855
const BOT_MASS = 32; // kg — Eco-chassis (was 50kg steel)
const ECO_FRICTION = 0.018; // Rolling resistance coefficient (HDPE wheel on concrete)
const EV_BATTERY_CYCLE_LIMIT = 1200; // Repurposed EV cell rated lifecycle (cycles)
const EV_OPTIMAL_SOC_MIN = 0.20; // 20% — Deep discharge protection for Li-Ion health
const EV_OPTIMAL_SOC_MAX = 0.88; // 88% — Overcharge protection (extends cell longevity)

let robots = [
  { id: 1, x: 22, y: 46, color: '#16a34a', battery: 50, status: 'Charging Bay', task: 'Charging Bay', workTimer: 0, targetX: 22, targetY: 46, velocity: 0, prevVelocity: 0, stress: 0, paused: false, waitCount: 0, priority: Math.random(), motorTemp: 45, torqueRipple: 0.1, vibrationIndex: 0.5, health: 100, esp32CamStatus: 'ONLINE', ultrasonicDist: 150 },
  { id: 2, x: 24, y: 46, color: '#1e40af', battery: 50, status: 'Charging Bay', task: 'Charging Bay', workTimer: 0, targetX: 24, targetY: 46, velocity: 0, prevVelocity: 0, stress: 0, paused: false, waitCount: 0, priority: Math.random(), motorTemp: 48, torqueRipple: 0.12, vibrationIndex: 0.6, health: 98, esp32CamStatus: 'ONLINE', ultrasonicDist: 150 },
  { id: 3, x: 26, y: 46, color: '#b45309', battery: 50, status: 'Charging Bay', task: 'Charging Bay', workTimer: 0, targetX: 26, targetY: 46, velocity: 0, prevVelocity: 0, stress: 0, paused: false, waitCount: 0, priority: Math.random(), motorTemp: 55, torqueRipple: 0.2, vibrationIndex: 0.8, health: 85, esp32CamStatus: 'LOW_RES_MODE', ultrasonicDist: 150 },
  { id: 4, x: 28, y: 46, color: '#7c3aed', battery: 50, status: 'Charging Bay', task: 'Charging Bay', workTimer: 0, targetX: 28, targetY: 46, velocity: 0, prevVelocity: 0, stress: 0, paused: false, waitCount: 0, priority: Math.random(), motorTemp: 42, torqueRipple: 0.08, vibrationIndex: 0.4, health: 100, esp32CamStatus: 'ONLINE', ultrasonicDist: 150 },
  { id: 5, x: 30, y: 46, color: '#dc2626', battery: 50, status: 'Charging Bay', task: 'Charging Bay', workTimer: 0, targetX: 30, targetY: 46, velocity: 0, prevVelocity: 0, stress: 0, paused: false, waitCount: 0, priority: Math.random(), motorTemp: 60, torqueRipple: 0.15, vibrationIndex: 0.7, health: 90, esp32CamStatus: 'ONLINE', ultrasonicDist: 150 }
];



const ZONE_CAPACITY = {
  "நெல் கிடங்கு (Rice Intake)": 5, "Grading Mill A": 3, "Grading Mill B": 3, "Quality Lab": 4,
  "PDS Packaging": 3, "PDS Dispatch": 5, "Distribution Hub": 2, "Charging Bay": 7, "Reserve Godown": 3, "மருந்து சேமிப்பு (Medicine Storage)": 4
};

const ZONES = {

  // Flow: Rice Intake -> Grading Mill -> Quality Lab -> Packaging -> PDS Dispatch -> Distribution Hub
  "நெல் கிடங்கு (Rice Intake)": { x: [2, 15], y: [2, 15], labelPos: { x: 8.5, z: 8.5 }, next: "Grading Mill A", work: "Receiving Raw Rice Stocks...", type: "RAW_MATERIAL", weight: 0, action: "Receiving" },

  "Reserve Godown": { x: [34, 48], y: [2, 15], labelPos: { x: 41, z: 8.5 }, next: "நெல் கிடங்கு (Rice Intake)", work: "Stacking Reserve Commodities...", type: "RAW_MATERIAL", weight: 50, action: "Stacking" },

  "Grading Mill A": { x: [2, 15], y: [20, 32], labelPos: { x: 8.5, z: 26 }, next: "Quality Lab", work: "Grading & Milling Rice...", type: "RAW_MATERIAL", weight: 50, action: "Milling" },

  "Grading Mill B": { x: [34, 48], y: [20, 32], labelPos: { x: 41, z: 26 }, next: "Quality Lab", work: "Processing Sugar & Pulses...", type: "RAW_MATERIAL", weight: 50, action: "Processing" },

  "Quality Lab": { x: [20, 30], y: [20, 30], labelPos: { x: 25, z: 25 }, next: "PDS Packaging", work: "FSSAI Quality Inspection...", type: "WIP", weight: 30, action: "Inspecting" },

  "PDS Packaging": { x: [2, 15], y: [38, 48], labelPos: { x: 8.5, z: 43 }, next: "PDS Dispatch", work: "Sealing PDS Ration Packets...", type: "WIP", weight: 30, action: "Packing" },

  "PDS Dispatch": { x: [34, 48], y: [38, 45], labelPos: { x: 41, z: 41.5 }, next: "Distribution Hub", work: "Staging for Fair Price Shops...", type: "FINISHED_GOOD", weight: 100, action: "Staging" },

  "Distribution Hub": { x: [40, 48], y: [46, 49], labelPos: { x: 44, z: 47.5 }, next: "நெல் கிடங்கு (Rice Intake)", work: "Loading TN Civil Supplies Trucks...", type: "FINISHED_GOOD", weight: 100, action: "Loading" },

  "மருந்து சேமிப்பு (Medicine Storage)": { x: [20, 30], y: [10, 15], labelPos: { x: 25, z: 12.5 }, next: "Ready", work: "Loading Critical Medical Stocks...", type: "WIP", weight: 20, action: "Loading", isCritical: true },

  "Charging Bay": { x: [20, 30], y: [42, 49], labelPos: { x: 25, z: 45.5 }, work: "Rapid Charging...", type: "EMPTY", weight: 0, action: "Charging" },

  "Ready": { x: [22, 28], y: [22, 28], labelPos: { x: 21, z: 21 }, work: "Standby", type: "EMPTY", weight: 0, action: "Idle" }

};



// --- 📅 DAILY SUPPLY SCHEDULE ---
const DAILY_SCHEDULE = [
  { id: "S1", time: "06:00 AM", task: "Rice Procurement", zone: "நெல் கிடங்கு (Rice Intake)", status: "Pending", priority: 8 },
  { id: "S2", time: "08:00 AM", task: "Mill Processing", zone: "Grading Mill A", status: "Pending", priority: 6 },
  { id: "S3", time: "10:30 AM", task: "FSSAI Inspection", zone: "Quality Lab", status: "Pending", priority: 7 },
  { id: "S4", time: "01:00 PM", task: "PDS Dispatch", zone: "PDS Dispatch", status: "Pending", priority: 9 },
  { id: "S5", time: "03:00 PM", task: "Reserve Restock", zone: "Reserve Godown", status: "Pending", priority: 4 }
];

// --- 🧠 5️⃣ PREDICTIVE ANTI-DEADLOCK AGENT ---

/** 💰 SSI AUCTIONEER & ROI ENGINE */
function calculateROI(bot, task) {
  // 1. Identification & Distance
  // Estimate distance to zone center (Manhattan)
  const zone = ZONES[task.name];
  if (!zone) {
    console.error(`❌ ROI ERROR: Zone not found for task "${task.name}"`);
    return -9999;
  }
  const destX = (zone.x[0] + zone.x[1]) / 2;
  const destY = (zone.y[0] + zone.y[1]) / 2;
  const distance = Math.abs(bot.x - destX) + Math.abs(bot.y - destY);

  // 2. Mechanical Wear Penalty
  // Penalty grows with Vibration Index & Stress
  const wearPenalty = (bot.stress * 1.5) + (bot.vibrationIndex * 20);

  // 3. Preventive Intercept (Critical Temp Override)
  // If temp > 75 (Critical), bid -Infinity for work, +Infinity for Charging/Maintenance.
  if (bot.motorTemp > 75) {
    if (task.name === 'Charging Bay') return Infinity;
    return -Infinity;
  }

  // 4. ROI Formula (Simplified per User Request)
  // ROI = (Priority * 10) - (Distance + Wear Penalty)
  // SIEMS UPDATE: If Solar > 800, Energy is free -> 50% discount on "Cost" (Distance + Wear)
  let cost = distance + wearPenalty;
  if (solarIrradiance > 800) cost *= 0.5;

  // 🏛️ STATE EMERGENCY MISSIONS: Public Need Multiplier
  let publicNeedMultiplier = 1.0;
  if (task.name.includes("TNMSC") || task.name.includes("Medical") || task.isCritical) {
    publicNeedMultiplier = 3.5; // Critical life-saving supplies
  } else if (task.name.includes("PDS") || task.name.includes("shortage")) {
    publicNeedMultiplier = 2.2; // Essential commodity stability
  }

  return ((task.priority * 10) * publicNeedMultiplier) - cost;
}

setInterval(() => {
  // 📢 THE AUCTION (Every 5 Seconds)
  if (taskQueue.length === 0) return;

  // ⚡ DYNAMIC CONSTRAINTS: Peak Demand Dispatch (Clear queue if Solar > 800)
  const maxAssignments = solarIrradiance > 800 ? taskQueue.length : 1;
  let assignmentsMade = 0;

  while (assignmentsMade < maxAssignments && taskQueue.length > 0) {
    const idleRobots = robots.filter(r => r.task === 'Ready');
    if (idleRobots.length === 0) break;

    taskQueue.sort((a, b) => b.priority - a.priority);
    const task = taskQueue[0];
    let bestBot = null;
    let highestROI = -Infinity;

    idleRobots.forEach(bot => {
      const roi = calculateROI(bot, task);
      if (roi > highestROI) {
        highestROI = roi;
        bestBot = bot;
      }
    });

    if (bestBot && highestROI > -999) {
      totalFleetROI += highestROI * 0.5;
      console.log(`🔨 Auction Won! Task: ${task.name} -> AGV-${bestBot.id} (ROI: ${highestROI.toFixed(2)})`);
      assignBotTask(bestBot, task.name);
      taskQueue.shift();
      assignmentsMade++;
    } else {
      break; // No suitable bot for top task
    }
  }

}, 5000);

/** 🧠 HYBRID A* WITH DUBINS APPROACH & VDA 5050 OUTPUT */

/** 🧠 HYBRID A* WITH DUBINS APPROACH & VDA 5050 OUTPUT */
function findSmartPath(startX, startY, targetX, targetY, robotId) {
  // VDA 5050 Node Factory with Safe Zone logic
  const createVDANode = (x, y, seq) => {
    // 🛡️ SAFE ZONE DETECTION: High-traffic government hubs
    const isSafeZone = (
      (x >= ZONES["Distribution Hub"].x[0] && x <= ZONES["Distribution Hub"].x[1] && y >= ZONES["Distribution Hub"].y[0] && y <= ZONES["Distribution Hub"].y[1]) ||
      (x >= ZONES["PDS Dispatch"].x[0] && x <= ZONES["PDS Dispatch"].x[1] && y >= ZONES["PDS Dispatch"].y[0] && y <= ZONES["PDS Dispatch"].y[1])
    );

    return {
      nodeId: `n-${x}-${y}`,
      sequenceId: seq,
      released: true,
      nodePosition: { x, y, mapId: "factory_v1" },
      actions: isSafeZone ? [{
        actionId: `safe-${Date.now()}`,
        actionType: "SAFE_ZONE",
        actionDescription: "Manual labor interaction zone — Speed limit active",
        blockingType: "SOFT"
      }] : []
    };
  };

  // 1️⃣ DUBINS-LIKE FINAL APPROACH (3-Unit Radius)
  // If close, attempt a smooth LSL/RSR style join (Manhattan L-shape is the grid equivalent)
  const dist = Math.abs(startX - targetX) + Math.abs(startY - targetY);
  if (dist <= 3) {
    // Try simple L-shape (Direct Drive) to avoid complex searching
    const approaches = [
      [{ x: targetX, y: startY }, { x: targetX, y: targetY }], // Horizontal first
      [{ x: startX, y: targetY }, { x: targetX, y: targetY }]  // Vertical first
    ];

    for (let currentApproach of approaches) {
      // Check if this L-shape is valid
      let valid = true;
      let corner = currentApproach[0];
      let end = currentApproach[1];

      // 🔍 PATH SEGMENT SCANNING (Collision Detection)
      // Segment 1: Start -> Corner
      let x1 = startX, y1 = startY, x2 = corner.x, y2 = corner.y;
      let dx = Math.sign(x2 - x1), dy = Math.sign(y2 - y1);

      // Scan Segment 1
      let cx = x1, cy = y1;
      while (cx !== x2 || cy !== y2) {
        cx += dx; cy += dy; // Move one step
        const v = staticMap[cx][cy];
        if (v === 4 || v === 6 || v === 7 || v === 8 || v === 9) { valid = false; break; } // Wall or Obstacle Hit
        if (robots.some(r => r.x === cx && r.y === cy)) { valid = false; break; } // Robot Hit
      }

      // Segment 2: Corner -> End (Only if Seg 1 was valid)
      if (valid) {
        x1 = corner.x; y1 = corner.y; x2 = end.x; y2 = end.y;
        dx = Math.sign(x2 - x1); dy = Math.sign(y2 - y1);
        cx = x1; cy = y1;
        while (cx !== x2 || cy !== y2) {
          cx += dx; cy += dy;
          const v = staticMap[cx][cy];
          if (v === 4 || v === 6 || v === 7 || v === 8 || v === 9) { valid = false; break; }
          if (robots.some(r => r.x === cx && r.y === cy)) { valid = false; break; }
        }
      }

      if (valid) {
        // Generate VDA Nodes for this simple curve
        return [
          createVDANode(currentApproach[0].x, currentApproach[0].y, 0),
          createVDANode(currentApproach[1].x, currentApproach[1].y, 1)
        ].filter(n => !(n.nodePosition.x === startX && n.nodePosition.y === startY));
      }
    }
  }

  // 2️⃣ HYBRID A* (Grid + Turn Penalties)
  let openList = [{ x: startX, y: startY, g: 0, f: 0, path: [], lastDx: 0, lastDy: 0 }];
  let closedSet = new Set();

  while (openList.length > 0) {
    openList.sort((a, b) => a.f - b.f);
    let current = openList.shift();

    if (current.x === targetX && current.y === targetY) {
      // Convert to VDA 5050
      return current.path.map((p, i) => createVDANode(p.x, p.y, i));
    }

    let key = `${current.x},${current.y}`;
    if (closedSet.has(key)) continue;
    closedSet.add(key);

    [[0, 1], [0, -1], [1, 0], [-1, 0]].forEach(([dx, dy]) => {
      let nx = current.x + dx, ny = current.y + dy;

      const val = staticMap[nx][ny];
      if (nx >= 0 && nx < ROWS && ny >= 0 && ny < COLS && val !== 4 && val !== 6 && val !== 7 && val !== 8 && val !== 9) {
        const blockingBot = robots.find(r => r.id !== robotId && r.x === nx && r.y === ny);

        let trafficCost = 1;
        if (blockingBot) {
          trafficCost = (blockingBot.status.includes("MAINTENANCE") || blockingBot.status.includes("YIELDING")) ? 255 : 50;
        }

        // 🏎️ Min Turning Radius Logic: Penalize sharp 90/180 turns
        // If we are changing direction, add penalty cost (approx 1.2m radius equivalent effort)
        let turnPenalty = 0;
        if (current.lastDx !== 0 || current.lastDy !== 0) {
          if (current.lastDx !== dx || current.lastDy !== dy) turnPenalty = 2; // Curve cost
        }

        let h = Math.abs(nx - targetX) + Math.abs(ny - targetY);
        let g = current.g + trafficCost + turnPenalty;

        openList.push({
          x: nx, y: ny,
          g, f: g + h,
          path: [...current.path, { x: nx, y: ny }],
          lastDx: dx, lastDy: dy
        });
      }
    });
  }
  return null;
}



function assignBotTask(bot, taskName) {

  const zone = ZONES[taskName] || ZONES["Ready"];

  const currentInZone = robots.filter(r => r.task === taskName).length;

  if (currentInZone >= (ZONE_CAPACITY[taskName] || 99)) {

    bot.status = "ZONE CAPACITY REACHED: QUEUING";

    return;

  }

  if (bot.task !== "Ready" && taskName === "Ready") {

    taskHistory.push({ id: bot.id, completedTask: bot.task, timestamp: Date.now() });

    if (taskHistory.length > 15) taskHistory.shift();

  }

  bot.task = taskName;

  bot.targetX = Math.floor(Math.random() * (zone.x[1] - zone.x[0]) + zone.x[0]);

  bot.targetY = Math.floor(Math.random() * (zone.y[1] - zone.y[0]) + zone.y[0]);

  bot.status = `Routing to ${taskName}`;
  bot.taskType = zone.type || "EMPTY";
  bot.payloadWeight = zone.weight || 0;
  bot.taskState = "In Transit";

  bot.workTimer = 0; bot.waitCount = 0;

}



io.on("connection", (socket) => {

  socket.on("toggleAutopilot", () => { autopilotActive = !autopilotActive; io.emit("autopilotStatus", autopilotActive); });

  socket.on("assignTask", ({ robotId, taskName }) => {

    const bot = robots.find(r => r.id === robotId);

    if (bot) { bot.paused = false; bot.stress = 0; assignBotTask(bot, taskName); }

  });

  // --- 🏛️ STATE LOGISTICS SUPERVISOR — CHAT HANDLER ---

  socket.on("chatQuery", (query) => {
    const text = query.toLowerCase();
    let response = null;

    // ─── 1. GOVERNMENT COMMODITY QUERIES (PRIORITY) ───
    // These are checked FIRST so essential commodity queries are never swallowed by generic handlers.

    if (text.includes("complete supply chain") || text.includes("full report")) {
      // Comprehensive supply chain status
      const zoneStatus = Object.keys(ZONES).filter(z => z !== "Ready").map(z => {
        const count = robots.filter(r => r.task === z).length;
        return `${z}: ${count} units`;
      }).join(" | ");
      const avgBattery = Math.round(robots.reduce((a, b) => a + b.battery, 0) / robots.length);
      const avgHealth = Math.round(robots.reduce((a, b) => a + b.health, 0) / robots.length);
      const activeCount = robots.filter(r => r.task !== "Ready" && r.task !== "Charging Bay").length;
      response = `📊 TN CIVIL SUPPLIES — FULL STATUS REPORT\n` +
        `Fleet: ${robots.length} AGVs (${activeCount} active) | Avg Battery: ${avgBattery}% | Avg Health: ${avgHealth}%\n` +
        `Zones: ${zoneStatus}\n` +
        `Green TN: Energy Harvested ${totalEnergyHarvested.toFixed(1)} Wh | Carbon Offset ${(totalEnergyHarvested * 0.0005).toFixed(3)} kg\n` +
        `Public Service ROI: ₹${totalFleetROI.toFixed(2)} | Solar: ${Math.round(solarIrradiance)} W/m²`;
    }
    else if (text.includes("rice") || text.includes("stock") || text.includes("ration")) {
      const riceIntake = robots.filter(r => r.task === "Rice Intake").length;
      const reserve = robots.filter(r => r.task === "Reserve Godown").length;
      const totalCommodity = riceIntake + reserve;
      response = `🌾 RICE & COMMODITY STOCK REPORT\n` +
        `Rice Intake Zone: ${riceIntake} supply vehicles active.\n` +
        `Reserve Godown: ${reserve} vehicles stacking reserve stocks.\n` +
        `Total movement: ${totalCommodity} vehicles handling raw commodities.\n` +
        `Status: ${totalCommodity > 0 ? 'Procurement IN PROGRESS' : 'IDLE — Awaiting next batch'}. FSSAI norms compliant.`;
    }
    else if (text.includes("sugar") || text.includes("kerosene") || text.includes("pulse")) {
      const millA = robots.filter(r => r.task === "Grading Mill A").length;
      const millB = robots.filter(r => r.task === "Grading Mill B").length;
      response = `🏭 SUGAR / PULSES PROCESSING REPORT\n` +
        `Grading Mill A: ${millA} vehicles (Rice milling)\n` +
        `Grading Mill B: ${millB} vehicles (Sugar & Pulses processing)\n` +
        `Total processing capacity: ${millA + millB} active loads.\n` +
        `Civil Supplies allocation norms: COMPLIANT.`;
    }
    else if (text.includes("pds") || text.includes("dispatch") || text.includes("fair price")) {
      const pdsDispatch = robots.filter(r => r.task === "PDS Dispatch").length;
      const distHub = robots.filter(r => r.task === "Distribution Hub").length;
      const packaging = robots.filter(r => r.task === "PDS Packaging").length;
      response = `📦 PDS DISPATCH & DISTRIBUTION REPORT\n` +
        `PDS Packaging: ${packaging} vehicles sealing ration packets.\n` +
        `PDS Dispatch: ${pdsDispatch} vehicles staged for Fair Price Shop delivery.\n` +
        `Distribution Hub: ${distHub} vehicles loading TN Civil Supplies trucks.\n` +
        `State quota compliance: ON TRACK. Ration card beneficiary dispatch active.`;
    }
    else if (text.includes("quality") || text.includes("fssai") || text.includes("inspection") || text.includes("compliance")) {
      const qlCount = robots.filter(r => r.task === "Quality Lab").length;
      response = `🔬 QUALITY LAB — FSSAI COMPLIANCE REPORT\n` +
        `Active inspections: ${qlCount} batches under FSSAI quality check.\n` +
        `Adulteration screening: ACTIVE. No rejections flagged.\n` +
        `Food Safety Standards Authority of India norms: COMPLIANT.\n` +
        `Next scheduled audit: Per Civil Supplies Dept. calendar.`;
    }
    else if (text.includes("carbon") || text.includes("green") || text.includes("offset") || text.includes("environment")) {
      response = `🌿 GREEN TAMIL NADU MISSION — SUSTAINABILITY REPORT\n` +
        `Solar Irradiance: ${Math.round(solarIrradiance)} W/m² (${solarIrradiance > 800 ? 'PEAK — Max KERS Recovery' : solarIrradiance > 400 ? 'MODERATE' : 'LOW — Night Mode'})\n` +
        `Total Energy Harvested: ${totalEnergyHarvested.toFixed(2)} Wh\n` +
        `State Carbon Offset: ${(totalEnergyHarvested * 0.0005).toFixed(4)} kg CO₂ avoided\n` +
        `KERS Status: Active on ${robots.filter(r => r.kersActive).length} vehicles\n` +
        `Public Service ROI from green logistics: ₹${totalFleetROI.toFixed(2)}`;
    }
    else if (text.includes("public service") || text.includes("roi")) {
      response = `🏛️ PUBLIC SERVICE ROI DASHBOARD\n` +
        `Cumulative ROI: ₹${totalFleetROI.toFixed(2)}\n` +
        `Energy savings from KERS + Solar: ${totalEnergyHarvested.toFixed(2)} Wh\n` +
        `Fleet efficiency: ${totalTimeTicks > 0 ? ((totalEfficiencyTicks / totalTimeTicks) * 100).toFixed(1) : 0}%\n` +
        `Impact: Every ₹ saved reduces burden on state logistics budget for essential commodity supply.`;
    }

    // ─── 2. FLEET & OPERATIONAL QUERIES ───
    else if (text.includes("status") || text.includes("health") || text.includes("torque")) {
      const urgent = robots.filter(r => r.health < 60);
      if (urgent.length > 0) {
        response = `⚠️ Warning: AGV-${urgent[0].id} reports ${Math.round(urgent[0].health)}% health integrity. Vibration index critical. Recommend service intercept.`;
      } else {
        const avgStress = Math.round(robots.reduce((a, b) => a + b.stress, 0) / robots.length);
        const maxTorque = Math.max(...robots.map(r => r.torqueRipple || 0)).toFixed(2);
        response = `✅ Fleet health nominal. Avg strain: ${avgStress}. Max Torque Ripple: ${maxTorque} (ISO Compliant). All vehicles serviceable.`;
      }
    }
    else if (text.includes("highest torque")) {
      const highest = robots.reduce((max, b) => b.torqueRipple > max.torqueRipple ? b : max, robots[0]);
      response = `AGV-${highest.id} has highest torque ripple (${highest.torqueRipple.toFixed(2)}). Monitor for potential bearing wear.`;
    }
    else if (text.includes("lowest battery") || text.includes("battery")) {
      const lowest = robots.reduce((min, b) => b.battery < min.battery ? b : min, robots[0]);
      response = `🔋 Fleet Avg Battery: ${Math.round(robots.reduce((a, b) => a + b.battery, 0) / robots.length)}%. AGV-${lowest.id} is lowest at ${Math.round(lowest.battery)}%. Predictive Charging active.`;
    }
    else if (text.includes("deadlock") || text.includes("stuck")) {
      const stuck = robots.filter(r => r.status.includes("DEADLOCK")).length;
      response = stuck > 0 ? `🚨 Alert: ${stuck} units in deadlock state. Auto-resolution active.` : "✅ Traffic flow smooth. No deadlocks detected.";
    }
    else if (text.includes("force resolution") || text.includes("resolve deadlocks")) {
      robots.forEach(r => { if (r.status.includes("DEADLOCK")) { r.waitCount = 0; r.x = r.targetX; r.y = r.targetY; } });
      response = "⚡ Forcing global deadlock resolution... Teleporting stuck units to targets.";
    }
    else if (text.includes("emergency stop") || text.includes("halt")) {
      robots.forEach(r => r.paused = true);
      response = "🚨 GLOBAL E-STOP ENGAGED. All Civil Supply vehicles halted. Resume with 'Resume operations'.";
    }
    else if (text.includes("resume") || text.includes("start")) {
      robots.forEach(r => r.paused = false);
      response = "✅ Resuming Civil Supplies fleet operations. All vehicles active.";
    }
    else if (text.includes("repair") || text.includes("fix")) {
      const id = text.match(/\d+/);
      if (id) {
        const bot = robots.find(r => r.id === parseInt(id[0]));
        if (bot) {
          bot.stress = 0;
          response = `🛠️ Autonomous Repair command sent to AGV-${bot.id}. Stress reset to 0.`;
        }
      }
      if (!response) response = "Please specify a vehicle ID (e.g., 'repair AGV 3').";
    }
    else if (Object.keys(ZONES).some(z => text.includes(z.toLowerCase()))) {
      const zoneName = Object.keys(ZONES).find(z => text.includes(z.toLowerCase()));
      const count = robots.filter(r => r.task === zoneName || r.status.includes(zoneName)).length;
      let detail = "";
      if (count > 0) {
        const types = robots.filter(r => r.task === zoneName).map(r => r.taskType).filter(t => t !== "EMPTY" && t).map(t => t.replace("_", " ")).join(", ");
        if (types) detail = ` Incoming goods: [${types}].`;
      }
      response = `📍 Zone Analysis: ${zoneName} has ${count} active units.${detail}`;
    }
    else if (text.includes("heaviest") || text.includes("heavy")) {
      const heaviest = robots.reduce((max, r) => (r.payloadWeight || 0) > (max.payloadWeight || 0) ? r : max, robots[0]);
      response = `AGV-${heaviest.id} carrying heaviest commodity load: ${heaviest.payloadWeight || 0}kg (${heaviest.taskType || 'None'}).`;
    }
    else if (text.includes("moving to") || text.includes("carrying")) {
      const zoneName = Object.keys(ZONES).find(z => text.includes(z.toLowerCase()));
      if (zoneName) {
        const bots = robots.filter(r => r.task === zoneName && r.taskType && r.taskType !== "EMPTY");
        if (bots.length > 0) {
          response = `In transit to ${zoneName}: ${bots.length} units carrying [${bots[0].taskType.replace("_", " ")}].`;
        } else {
          response = `No goods currently moving to ${zoneName}.`;
        }
      } else {
        response = "For transit data, specify a zone (e.g., 'moving to PDS Dispatch').";
      }
    }
    else if (text.includes("emergency") || text.includes("medical") || text.includes("tnmsc")) {
      const medicalBots = robots.filter(r => r.task.includes("Medical") || (r.status && r.status.includes("Medical")));
      const criticalPDS = taskQueue.filter(t => t.name.includes("PDS Shortage")).length;
      response = `🚑 STATE EMERGENCY MISSION STATUS\n` +
        `TNMSC Medical Supplies: ${medicalBots.length} AGVs currently dispatching life-saving stocks.\n` +
        `Critical PDS Shortages: ${criticalPDS} high-priority missions in queue.\n` +
        `Auction Multiplier: ACTIVE (3.5x for Medical, 2.2x for PDS Shortage).\n` +
        `Status: Emergency protocols engaged. Public Need priority overriding standard transfers.`;
    }
    else if (text.includes("safe zone") || text.includes("labor") || text.includes("safety")) {
      response = `🛡️ VDA 5050 SAFETY REPORT\n` +
        `Active Safe Zones: Distribution Hub, PDS Dispatch.\n` +
        `Protocol: Speed limited to 30% (0.3m/s) for manual labor interaction.\n` +
        `VDA Actions: SAFE_ZONE markers injected into all paths through high-traffic government hubs.`;
    }
    else if (text.includes("infrastructure") || text.includes("health report") || text.includes("maintenance report")) {
      const avgHealth = Math.round(robots.reduce((a, b) => a + b.health, 0) / robots.length);
      const thermalAlerts = robots.filter(r => r.motorTemp > 70).length;
      response = `📋 STATE INFRASTRUCTURE HEALTH REPORT (Weekly Est.)\n` +
        `Avg Fleet Health: ${avgHealth}%\n` +
        `Critical Thermal Alerts: ${thermalAlerts} active.\n` +
        `Prevented Equipment Failures: ${totalPreventedFailures} units.\n` +
        `Estimated Money Saved: ₹${totalMaintenanceSavings.toLocaleString('en-IN')}\n` +
        `Predictive AI Impact: ${totalPreventedFailures > 0 ? 'High — Preventing system-wide logistics stagnation.' : 'Optimal — Maintenance loop nominal.'}`;
    }
    else if (text.includes("peak demand") || text.includes("dispatch rate")) {
      const isPeak = solarIrradiance > 800;
      response = `⚡ DYNAMIC DISPATCH STATUS\n` +
        `Solar Irradiance: ${Math.round(solarIrradiance)} W/m².\n` +
        `Mode: ${isPeak ? 'PEAK DEMAND — Accelerated Dispatch Active' : 'STANDARD — Optimal Energy Mode'}.\n` +
        `Behavior: ${isPeak ? 'Auction engine clearing all queued missions to assist warehouse throughput.' : 'Standard 5s auction interval active.'}`;
    }
    else if (text.includes("online")) {
      response = `🏛️ TN Sovereign Logistics Twin Online. Tracking ${robots.length} Civil Supply AGVs across ${Object.keys(ZONES).length - 1} warehouse zones. Emergency Missions & Safe Zones: ACTIVE.`;
    }
    else if (text.includes("spec") || text.includes("capacity")) {
      response = "Eco-Build AGV Specs: Coconut-Fiber Composite chassis (32kg). Max commodity load: 120kg. KERS efficiency: 18-23%. EV battery cycle limit: 1200. VDA 5050 compliant.";
    }
    else if (text.includes("error") || text.includes("code")) {
      response = "VDA 5050 Error Codes: E01=Path Blocked, E04=Emergency Stop, E09=Low Battery. No critical errors active in Civil Supplies fleet.";
    }

    // ─── 3. DEFAULT RESPONSE ───
    if (!response) {
      response = "🏛️ State Logistics Supervisor online. I can report on: rice stocks, sugar/pulse processing, PDS dispatch, quality lab (FSSAI), carbon offset (Green TN Mission), fleet health, or public service ROI. What would you like to know?";
    }

    socket.emit("chatResponse", response);
  });

  // 🚨 PROACTIVE TORQUE MONITOR (Runs every 10s via client query usually, but simulated here via loop check)
  // We'll hook this into the main loop to push alerts if needed.

  socket.on("togglePause", (id) => {

    const bot = robots.find(r => r.id === id);

    if (bot) bot.paused = !bot.paused;

  });

});



// --- ⚙️ ORCHESTRATOR LOOP ---

setInterval(() => {

  const chargingNow = robots.filter(r => r.task === "Charging Bay").length;



  // ☀️ SIMULATE SOLAR IRRADIANCE (10 Minute Oscillation)
  // 10 mins = 600 seconds. Tick Rate = 300ms. 2000 ticks approx.
  solarClock++;
  solarIrradiance = 500 + 500 * Math.sin(solarClock * 0.003); // Oscillates 0 to 1000

  // Solar Energy Accrual (Approx 0.3s tick)
  // Power (W) * Time (h). 0.3s = 0.000083h. Assume 5 AGVs * 1m2 panel.
  // Increment global counter
  totalEnergyHarvested += (solarIrradiance * 5 * 0.000083);

  robots.forEach(bot => {

    if (bot.paused) return;

    // ☀️ SIEMS: ACTIVE STATUS
    bot.solarActive = solarIrradiance > 800;

    let isEfficient = false;

    // ⚡ ECO-KERS RECOVERY ENGINE — PHYSICS TUNING ⚡
    // Chassis: Coconut-Fiber / HDPE | Mass: 32kg
    const v1 = bot.prevVelocity || 0;
    const v2 = bot.velocity || 0;
    const loadMass = bot.payloadWeight || 0;
    const totalMass = BOT_MASS + loadMass;
    const tickTime = TICK_RATE / 1000; // 0.3s

    // FRUGAL TELEMETRY MAPPING (ESP32-CAM & Ultrasonic)
    // Low-cost sensors provide sparse but sufficient data
    bot.ultrasonicDist = Math.max(20, Math.min(300, (bot.ultrasonicDist || 150) + (Math.random() * 20 - 10)));
    bot.esp32CamStatus = bot.motorTemp > 65 ? 'THERMAL_THROTTLE_CAM' : (Math.random() > 0.98 ? 'REFRESHING' : 'ONLINE');

    if (v2 < v1 && bot.task !== 'Ready' && bot.velocity > 0.1) {
      // KERS Efficiency: 23% for heavy commodity loads (100kg+ rice bags) — Eco-Build Fine-Tuned
      const kersEfficiency = loadMass >= 100 ? 0.23 : loadMass >= 30 ? 0.21 : 0.18;

      // Friction Loss: F_f = μ * m * g | W_f = F_f * d
      // Reflecting HDPE on concrete friction
      const frictionLoss = ECO_FRICTION * totalMass * 9.81 * (v2 * tickTime);

      const kersEnergy = Math.max(0,
        (0.5 * totalMass * (Math.pow(v1, 2) - Math.pow(v2, 2)) * kersEfficiency) - frictionLoss
      );

      if (kersEnergy > 0) {
        // EV Battery Longevity: BMS prevents charge if SOC >= 88%
        const currentSOC = bot.battery / 100;
        if (currentSOC < EV_OPTIMAL_SOC_MAX) {
          bot.battery = Math.min(88, bot.battery + (kersEnergy * 0.05));
        }
        totalEnergyHarvested += kersEnergy * 0.001;
        bot.kersActive = true;
        isEfficient = true;
      }
    } else {
      bot.kersActive = false;
    }
    bot.prevVelocity = bot.velocity;

    // TRACK EFFICIENCY
    totalTimeTicks++;
    if (bot.solarActive) isEfficient = true;
    if (isEfficient) totalEfficiencyTicks++;

    // 🔋 SOFTWARE-DEFINED POWERBANK (15% Reserve)
    const isUrgent = bot.priority > 0.7;
    const reserveActive = isUrgent && bot.battery < 25 && bot.battery > 10;

    if (reserveActive) {
      bot.status = "⚠️ POWERBANK RESERVE ACTIVE";
    }

    // 🌡️ THERMAL MANAGEMENT & EV BATTERY LONGEVITY (BMS)
    // Thermal ceiling: 70°C for repurposed EV cells | STRICT CUTOFF: 75°C
    if (bot.velocity > 0.8) bot.motorTemp += 0.4;
    else bot.motorTemp = Math.max(22, bot.motorTemp - 0.25);

    let speedLimit = 1.0;
    if (bot.motorTemp >= 75) {
      speedLimit = 0; // EMERGENCY STOP
      bot.status = "🛑 CRITICAL: THERMAL CUTOFF (75°C)";
      bot.velocity = 0;
    } else if (bot.motorTemp > 70) {
      speedLimit = 0.5;
      bot.status = "EV BMS: THERMAL SAFE MODE";
    }

    // ♻️ REPURPOSED EV BATTERY HEALTH ALGORITHM
    // Priority: Longevity over performance (Refined for repurposed cells)
    const currentSOC = bot.battery / 100;
    // Aggressive penalties for deep discharge to protect repurposed cells
    const deepDischargePenalty = currentSOC < EV_OPTIMAL_SOC_MIN ? 35 : (currentSOC < 0.25 ? 15 : 0);
    const overchargePenalty = currentSOC > EV_OPTIMAL_SOC_MAX ? 15 : 0;
    const thermalPenalty = Math.max(0, bot.motorTemp - 60) * 4; // More aggressive heat penalty
    const optimalSOCBonus = (currentSOC >= 0.40 && currentSOC <= 0.70) ? 10 : 0; // Narrower optimal range for longevity

    bot.health = Math.max(0, Math.min(100,
      100 - (bot.stress * 1.5) - thermalPenalty - deepDischargePenalty - overchargePenalty + optimalSOCBonus
    ));
    bot.evBatteryStress = deepDischargePenalty > 0 ? 'DEEP DISCHARGE RISK' : (overchargePenalty > 0 ? 'OVERCHARGE STRESS' : (optimalSOCBonus > 0 ? 'OPTIMAL SOC' : 'MONITOR'));

    // 🤖 AUTOPILOT AGENT

    // 🤖 AUTOPILOT AGENT
    // Instead of assigning directly, push to Auction Queue
    if (autopilotActive && taskQueue.length < 3) {
      const isEmergency = Math.random() > 0.8;
      const isPDSShortage = !isEmergency && Math.random() > 0.7;

      if (isEmergency) {
        taskQueue.push({
          name: "மருந்து சேமிப்பு (Medicine Storage)",
          priority: 9,
          id: Date.now() + Math.random(),
          type: "WIP",
          weight: 20,
          isCritical: true
        });
      } else if (isPDSShortage) {
        taskQueue.push({
          name: "PDS Dispatch", // Fixed: Must match a key in ZONES
          displayName: "PDS Shortage — Priority Restock", // Added for UI if needed
          priority: 8,
          id: Date.now() + Math.random(),
          type: "FINISHED_GOOD",
          weight: 100
        });
      } else {
        taskQueue.push({
          name: "நெல் கிடங்கு (Rice Intake)",
          priority: 5,
          id: Date.now() + Math.random(),
          type: "EMPTY",
          weight: 0
        });
      }
    }



    // 🔟 AUTONOMOUS SERVICE AGENT (Prevents maintenance downtime)
    // Intercept if Health drops below 40% (User specified Autonomous Intercept)
    if (bot.health < 40 && bot.task !== 'Charging Bay') {
      // Intercept bot for maintenance IMMEDIATELY
      if (bot.task === 'Ready' || !bot.status.includes("SERVICE INTERCEPT")) {
        assignBotTask(bot, "Charging Bay"); // Charging zone serves as a Repair Bay.
        bot.status = "SERVICE INTERCEPT: REPAIRING";

        // 🏛️ SOVEREIGN HEALTH ALERT: Trigger State Maintenance Ticket
        totalPreventedFailures++;
        totalMaintenanceSavings += 15000; // Est ₹15,000 saved per prevented motor/battery failure
        io.emit("chatResponse", `🎫 STATE MAINTENANCE TICKET [AGV-${bot.id}]: Health score dropped to ${Math.round(bot.health)}%. Auto-intercepting for predictive repair. Failure prevented — Est Savings: ₹15,000.`);
      }
    }



    // 🔋 NIGHT MODE PREDICTIVE CHARGING
    // If Solar < 200 (Night), increase reserve to 35%
    const baseThreshold = solarIrradiance < 200 ? 35 : 25;

    const shouldCharge = !reserveActive && (bot.battery < baseThreshold || (bot.battery < 65 && chargingNow < MAX_CHARGING_SLOTS && bot.task === 'Ready'));

    if (shouldCharge && bot.task !== 'Charging Bay') assignBotTask(bot, "Charging Bay");



    if (bot.x === bot.targetX && bot.y === bot.targetY) {

      bot.velocity = 0;

      if (bot.task === "Charging Bay") {

        bot.battery = Math.min(100, bot.battery + 2.5);
        bot.stress = Math.max(0, bot.stress - 5);
        bot.status = "RECOVERY & CHARGING";
        bot.taskState = "Charging";

        if (bot.battery > 95 && bot.stress === 0) assignBotTask(bot, "Ready");

      } else if (bot.task !== "Ready") {

        if (bot.workTimer < 15) {
          bot.status = ZONES[bot.task].work;
          bot.taskState = ZONES[bot.task].action || "Working";
          bot.workTimer++;
        }
        else {
          // Update Schedule Status
          const scheduleItem = DAILY_SCHEDULE.find(s => s.zone === bot.task && s.status === "Pending");
          if (scheduleItem) {
            scheduleItem.status = "Completed";
          }
          assignBotTask(bot, ZONES[bot.task].next);
        }

      }

    } else {

      let path = findSmartPath(bot.x, bot.y, bot.targetX, bot.targetY, bot.id);

      if (path && path.length > 0) {
        // VDA 5050 Node Unpacking
        const nextNode = path[0];
        const next = nextNode.nodePosition; // Extract {x,y} from VDA node

        const obstacleBot = robots.find(r => r.id !== bot.id && r.x === next.x && r.y === next.y);

        if (!obstacleBot) {
          // 📈 S-CURVE VELOCITY PROFILE (Jerk-Limited)
          const remainingDist = path.length;
          let targetSpeed = 1.0;
          let accelRate = 0.1;

          // 🛡️ SAFE ZONE SPEED LIMIT (VDA 5050 ACTION)
          const nodeHasSafeAction = nextNode.actions?.some(a => a.actionType === 'SAFE_ZONE');
          if (nodeHasSafeAction) {
            targetSpeed = 0.3; // Limit speed to 30% for labor safety
            bot.status = "⚠️ SAFE ZONE: CAUTION";
          } else {
            bot.status = "SMOOTH FLOW [VDA-ACTIVE]";
          }

          let brakingDist = 5.0;

          // 🏗️ LOAD PHYSICS
          if ((bot.payloadWeight || 0) > 80) { // Heavy Load (Finished Goods)
            accelRate *= 0.7; // -30% Acceleration
            brakingDist = 8.0; // Slower deceleration phase
          }

          // Apply S-Curve with Thermal Throttling
          if (remainingDist > brakingDist) {
            const variableAccel = accelRate * (1.2 - (bot.velocity / targetSpeed));
            bot.velocity = Math.min(bot.velocity + variableAccel, targetSpeed * speedLimit);
          } else {
            const approachPct = remainingDist / brakingDist;
            // Eased deceleration
            const easeSpeed = (Math.sin(approachPct * Math.PI / 2)) * targetSpeed * speedLimit;
            bot.velocity = Math.max(0.1, easeSpeed);
          }

          bot.x = next.x; bot.y = next.y;
          bot.battery -= (0.05 + (bot.velocity * 0.08));
          bot.status = "SMOOTH FLOW [VDA-ACTIVE]";
          bot.waitCount = 0;
          heatmap[bot.x][bot.y]++;

        } else {
          // 🚦 PROACTIVE DEADLOCK RESOLVER
          bot.velocity = 0;
          bot.waitCount++;
          bot.stress += 0.4;
          bot.status = "TRAFFIC DELAY";

          if (bot.waitCount > 1) {
            if (bot.priority < obstacleBot.priority) {
              bot.status = "DEADLOCK: YIELDING";
              const sides = [[0, 1], [0, -1], [1, 0], [-1, 0]];
              for (const [sx, sy] of sides) {
                const tx = bot.x + sx, ty = bot.y + sy;
                if (tx >= 0 && tx < ROWS && ty >= 0 && ty < COLS && staticMap[tx][ty] === 0) {
                  if (!robots.some(r => r.x === tx && r.y === ty)) {
                    bot.x = tx; bot.y = ty; bot.waitCount = 0; break;
                  }
                }
              }
            } else { bot.status = "DEADLOCK: RESOLVING"; }
          }
        }
      }

    }

  });



  io.emit("update", {
    // 📦 VDA 5050 v2.1.1 COMPLIANCE HEADER
    header: {
      timestamp: new Date().toISOString(),
      version: "2.1.1",
      manufacturer: "OptiFlow"
    },
    // PAYLOAD
    solarIrradiance,
    mesMetrics: {
      energyHarvested: totalEnergyHarvested.toFixed(2),
      carbonOffset: (totalEnergyHarvested * 0.0005).toFixed(4),
      fleetROI: totalFleetROI.toFixed(2),
      fleetEfficiency: totalTimeTicks > 0 ? ((totalEfficiencyTicks / totalTimeTicks) * 100).toFixed(1) : 0,
      preventedFailures: totalPreventedFailures,
      maintenanceSavings: totalMaintenanceSavings
    },
    grid: staticMap, robots, taskHistory, autopilotActive, taskQueue, zones: ZONES, schedule: DAILY_SCHEDULE,

    fleetStats: {

      avgBattery: Math.round(robots.reduce((a, b) => a + b.battery, 0) / robots.length),

      activeTasks: robots.filter(r => r.task !== 'Ready').length,

      totalCongestion: Math.round(robots.reduce((a, b) => a + b.stress, 0))

    }

  });

}, TICK_RATE);



const PORT = process.env.PORT || 3001;
server.listen(PORT, () => { console.log(`✅ TN SOVEREIGN LOGISTICS TWIN V9.0 — CIVIL SUPPLIES READY on port ${PORT}`); });