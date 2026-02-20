import React, { useRef, useEffect } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, Text, RoundedBox, Grid, ContactShadows } from '@react-three/drei';
import * as THREE from 'three';

/** 🧱 ULTRA-THIN NEON ARCHITECTURE
 * Refined 0.05-thickness dividers to maintain a "neat" and professional layout.
 */
const WallPanel = ({ position, args, color = "#475569" }) => (
  <mesh position={position} castShadow receiveShadow>
    <boxGeometry args={args} />
    <meshStandardMaterial color={color} metalness={0.5} roughness={0.7} />
  </mesh>
);

const DoorFrame = ({ position, rotation }) => (
  <group position={position} rotation={rotation}>
    {/* Side Posts */}
    <mesh position={[-1, 1.5, 0]} castShadow><boxGeometry args={[0.2, 3, 0.2]} /><meshStandardMaterial color="#334155" /></mesh>
    <mesh position={[1, 1.5, 0]} castShadow><boxGeometry args={[0.2, 3, 0.2]} /><meshStandardMaterial color="#334155" /></mesh>
    {/* Top Header */}
    <mesh position={[0, 3.1, 0]} castShadow><boxGeometry args={[2.4, 0.2, 0.3]} /><meshStandardMaterial color="#1e293b" /></mesh>
    {/* Warning Stripe */}
    <mesh position={[0, 3, 0]}><boxGeometry args={[2.2, 0.05, 0.22]} /><meshStandardMaterial color="#eab308" emissive="#eab308" emissiveIntensity={0.5} /></mesh>
  </group>
);




/** 📦 REALISTIC INDUSTRIAL ASSETS
 * Replaces generic blocks with detailed Steel Racks and Heavy Pallets.
 */
const RealisticRack = ({ position }) => (
  <group position={position}>
    {/* Structural Pillars */}
    {[-0.4, 0.4].map(x => [-0.4, 0.4].map(z => (
      <mesh key={`${x}-${z}`} position={[x, 1, z]} castShadow>
        <boxGeometry args={[0.05, 2, 0.05]} />
        <meshStandardMaterial color="#334155" metalness={0.8} />
      </mesh>
    )))}
    {/* Shelving Levels & Cargo */}
    {[0.4, 1.2, 1.8].map((y, i) => (
      <group key={i} position={[0, y, 0]}>
        <mesh receiveShadow><boxGeometry args={[0.9, 0.05, 0.9]} /><meshStandardMaterial color="#475569" /></mesh>
        <mesh position={[0.2, 0.2, 0]} castShadow><boxGeometry args={[0.4, 0.35, 0.6]} /><meshStandardMaterial color="#1e40af" /></mesh>
      </group>
    ))}
  </group>
);

const ConveyorBelt = ({ position }) => (
  <group position={position}>
    <mesh position={[0, 0.2, 0]} receiveShadow><boxGeometry args={[0.8, 0.4, 0.9]} /><meshStandardMaterial color="#334155" /></mesh>
    <mesh position={[0, 0.41, 0]}><planeGeometry args={[0.6, 0.8]} rotation={[-Math.PI / 2, 0, 0]} /><meshStandardMaterial color="#0f172a" /></mesh>
  </group>
);

const RobotArm = ({ position }) => (
  <group position={position}>
    <mesh position={[0, 0.5, 0]} castShadow><cylinderGeometry args={[0.1, 0.2, 1]} /><meshStandardMaterial color="#f59e0b" /></mesh>
    <mesh position={[0.2, 1, 0]} rotation={[0, 0, -0.5]} castShadow><boxGeometry args={[0.1, 0.8, 0.1]} /><meshStandardMaterial color="#f59e0b" /></mesh>
    <mesh position={[0, 0.05, 0]}><cylinderGeometry args={[0.3, 0.3, 0.1]} /><meshStandardMaterial color="#1e293b" /></mesh>
  </group>
);

const ShippingCrate = ({ position }) => (
  <group position={position}>
    <mesh position={[0, 0.3, 0]} castShadow>
      <boxGeometry args={[0.6, 0.6, 0.6]} />
      <meshStandardMaterial color="#a16207" roughness={0.8} />
    </mesh>
  </group>
);

const ChargingPort = ({ position }) => (
  <group position={position}>
    <mesh position={[0, 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]}>
      <ringGeometry args={[0.3, 0.4, 32]} />
      <meshBasicMaterial color="#22c55e" />
    </mesh>
    <mesh position={[0, 0.5, -0.4]} castShadow><boxGeometry args={[0.2, 1, 0.2]} /><meshStandardMaterial color="#1e293b" /></mesh>
    <mesh position={[0, 0.8, -0.38]}><planeGeometry args={[0.15, 0.1]} /><meshBasicMaterial color="#4ade80" /></mesh>
  </group>
);

/** 📦 PAYLOAD ASSETS */
const RawMaterialPayload = () => (
  <group>
    <mesh castShadow position={[0, 0.15, 0]}><boxGeometry args={[0.5, 0.3, 0.5]} /><meshStandardMaterial color="#64748b" metalness={0.9} roughness={0.3} /></mesh>
    <mesh position={[0, 0.35, 0]}><cylinderGeometry args={[0.15, 0.15, 0.1]} /><meshStandardMaterial color="#475569" metalness={0.9} /></mesh>
  </group>
);

const WipPayload = () => (
  <group rotation={[0, 0, Math.PI / 2]} position={[0, 0.25, 0]}>
    <mesh castShadow><cylinderGeometry args={[0.08, 0.08, 0.6]} /><meshStandardMaterial color="#94a3b8" metalness={0.8} /></mesh>
    <mesh position={[0, 0.25, 0]}><boxGeometry args={[0.25, 0.05, 0.25]} /><meshStandardMaterial color="#f59e0b" /></mesh>
    <mesh position={[0, -0.25, 0]}><boxGeometry args={[0.25, 0.05, 0.25]} /><meshStandardMaterial color="#f59e0b" /></mesh>
  </group>
);

const FinishedGoodPayload = () => (
  <group position={[0, 0.25, 0]}>
    <mesh castShadow>
      <boxGeometry args={[0.6, 0.5, 0.6]} />
      <meshStandardMaterial color="#a16207" roughness={0.8} />
    </mesh>
    {/* Straps */}
    <mesh position={[0, 0, 0]}><boxGeometry args={[0.62, 0.1, 0.62]} /><meshStandardMaterial color="black" transparent opacity={0.3} /></mesh>
  </group>
);

/** 🤖 MOTION-AWARE AGV 
 * Features smooth LERP movement and Autonomous Deadlock Solver LEDs.
 */
const AGV_3D = ({ bot }) => {
  const meshRef = useRef();
  const cargoRef = useRef();

  // Detect deadlock, delay, or maintenance status for visual signaling
  const isMaintenance = bot.status?.includes("SERVICE") || bot.status?.includes("REPAIR");
  const isHighPriority = bot.priority > 0.7 || bot.isCritical || bot.task?.includes("Medical") || bot.task?.includes("PDS") || bot.task?.includes("மருந்து");
  const isConflict = bot.status?.includes("CONFLICT") || bot.status?.includes("DEADLOCK");
  const sovereignGold = "#D4AF37";

  // Cargo type: derive from server bot.type or task name
  let cargoType = bot.type || null;
  if (!cargoType) {
    const t = bot.task;
    if (t?.includes("Rice") || t?.includes("நெல்") || t?.includes("Grading")) cargoType = "RAW";
    else if (t?.includes("Medical") || t?.includes("மருந்து") || t?.includes("Quality")) cargoType = "WIP";
    else if (t?.includes("PDS") || t?.includes("Dispatch") || t?.includes("விநியோக")) cargoType = "FINISHED";
  }

  useFrame(() => {
    if (meshRef.current) {
      /** 9️⃣ MOTION-AWARE LERP */
      meshRef.current.position.x = THREE.MathUtils.lerp(meshRef.current.position.x, bot.x, 0.12);
      meshRef.current.position.z = THREE.MathUtils.lerp(meshRef.current.position.z, bot.y, 0.12);

      // Smooth Rotation LERP
      const targetRotation = Math.atan2(bot.targetX - bot.x, bot.targetY - bot.y);
      meshRef.current.rotation.y = THREE.MathUtils.lerp(meshRef.current.rotation.y, targetRotation, 0.05);

      // 📦 CARGO SCALE ANIMATION
      if (cargoRef.current) {
        const targetScale = cargoType ? 1 : 0;
        // Simple easing for "pop-up" effect
        cargoRef.current.scale.setScalar(THREE.MathUtils.lerp(cargoRef.current.scale.x, targetScale, 0.15));
      }
    }
  });

  return (
    <group ref={meshRef}>
      <RoundedBox args={[0.85, 0.2, 1.1]} radius={0.05} position={[0, 0.15, 0]} castShadow>
        <meshStandardMaterial
          color={bot.health < 40 ? "#ef4444" : (isMaintenance ? "#475569" : bot.color)}
          metalness={0.7}
          roughness={0.2}
          emissive={isHighPriority ? sovereignGold : "black"}
          emissiveIntensity={isHighPriority ? 2.5 : 0}
        />
      </RoundedBox>

      {/* 🌟 SOVEREIGN GOLD MISSION GLOW */}
      {isHighPriority && (
        <pointLight position={[0, 0.5, 0]} intensity={3.5} distance={4} color={sovereignGold} />
      )}

      {/* 📡 FRUGAL SENSOR TOWER (ESP32-CAM + HC-SR04) */}
      <group position={[0, 0.35, -0.35]}>
        {/* Tower Post */}
        <mesh castShadow><boxGeometry args={[0.1, 0.3, 0.1]} /><meshStandardMaterial color="#334155" /></mesh>

        {/* ESP32-CAM (Top) */}
        <mesh position={[0, 0.18, 0.05]} castShadow>
          <boxGeometry args={[0.12, 0.08, 0.04]} />
          <meshStandardMaterial color="#1e293b" />
        </mesh>
        <mesh position={[0, 0.18, 0.08]}>
          <circleGeometry args={[0.02, 16]} />
          <meshBasicMaterial color="#475569" />
        </mesh>

        {/* HC-SR04 Ultrasonic (Front-Facing) */}
        <group position={[0, -0.05, 0.06]}>
          <mesh castShadow><boxGeometry args={[0.15, 0.08, 0.02]} /><meshStandardMaterial color="#3b82f6" /></mesh>
          <mesh position={[-0.04, 0, 0.02]} rotation={[Math.PI / 2, 0, 0]}><cylinderGeometry args={[0.03, 0.03, 0.02]} /><meshStandardMaterial color="#94a3b8" /></mesh>
          <mesh position={[0.04, 0, 0.02]} rotation={[Math.PI / 2, 0, 0]}><cylinderGeometry args={[0.03, 0.03, 0.02]} /><meshStandardMaterial color="#94a3b8" /></mesh>
        </group>
      </group>

      {/* 📦 DYNAMIC PAYLOAD RENDERER */}
      <group ref={cargoRef} position={[0, 0.25, 0]}>
        {cargoType === "RAW" && <RawMaterialPayload />}
        {cargoType === "WIP" && <WipPayload />}
        {cargoType === "FINISHED" && <FinishedGoodPayload />}
      </group>

      {/* 🚦 DEADLOCK STATUS LED */}
      <mesh position={[0, 0.65, -0.35]}>
        <sphereGeometry args={[0.06]} />
        <meshStandardMaterial
          emissive={isMaintenance ? "red" : isConflict ? "orange" : "#22c55e"}
          emissiveIntensity={isConflict || isMaintenance ? 12 : 3}
        />
      </mesh>
      <Text position={[0, 1.1, 0]} fontSize={0.18} color="white" anchorY="bottom">{`AGV-${bot.id}`}</Text>

      {/* 🏷️ FLOATING STATUS ICON */}
      <Text position={[0, 1.4, 0]} fontSize={0.3} anchorY="bottom" outlineWidth={0.02} outlineColor="black">
        {isMaintenance ? "🛠️" : (bot.status.includes("Charging") ? "🔋" : (cargoType ? "📦" : ""))}
      </Text>

      {/* ☀️ SOLAR HARVESTING AURA */}
      {bot.solarActive && (
        <mesh position={[0, 0, 0]}>
          <cylinderGeometry args={[1.2, 1.2, 0.1, 32]} />
          <meshBasicMaterial color="#facc15" transparent opacity={0.3} side={THREE.DoubleSide} />
        </mesh>
      )}

      {/* 🔴 STRESS TRAIL */}
      <mesh position={[0, 0.01, 1]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[0.6, 2]} />
        <meshBasicMaterial color={bot.stress > 20 ? "#ef4444" : "#94a3b8"} transparent opacity={bot.stress > 20 ? 0.3 : 0.0} />
      </mesh>
    </group>
  );
};

/** 🛠️ SCENE WRAPPER
 * Synchronizes elevated Zone Labels and the structural floor grid.
 */
/** 🛠️ SCENE WRAPPER
 * Synchronizes elevated Zone Labels and the structural floor grid.
 */
const Scene = ({ grid, robots, solarIrradiance, gridTheme, zones, onZoneClick, cameraMode, targetBot, zoomRequest, getZoneDisplayName }) => {
  const controlsRef = useRef();
  const { camera } = useThree();

  useEffect(() => {
    if (zoomRequest && controlsRef.current) {
      const offset = new THREE.Vector3().subVectors(camera.position, controlsRef.current.target);
      const currentDist = offset.length();
      const delta = zoomRequest.dir === 'IN' ? -10 : 10;
      const newDist = Math.max(10, Math.min(80, currentDist + delta));

      offset.setLength(newDist);
      camera.position.copy(controlsRef.current.target).add(offset);
      controlsRef.current.update();
    }
  }, [zoomRequest, camera.position]);

  useFrame((state) => {
    if (!controlsRef.current) return;

    // 🎥 AUTO PILOT: Follow Priority/Critical Bot
    if (cameraMode === 'AUTO' && targetBot) {
      const vec = new THREE.Vector3(targetBot.x, 0, targetBot.y);
      controlsRef.current.target.lerp(vec, 0.05);
      camera.position.lerp(vec.clone().add(new THREE.Vector3(15, 20, 15)), 0.05);
      controlsRef.current.update();
    }
    // 🚌 GUIDED TOUR: Warehouse -> Prod -> QC -> ATL
    else if (cameraMode === 'TOUR') {
      const t = state.clock.getElapsedTime() * 0.15; // Animation Speed
      const stops = [
        { at: [8.5, 0, 8.5], cam: [20, 15, 20] }, // Warehouse
        { at: [8.5, 0, 26], cam: [25, 15, 26] }, // Prod A
        { at: [25, 0, 25], cam: [35, 15, 25] }, // QC
        { at: [44, 0, 48], cam: [44, 20, 30] }, // ATL
      ];
      const l = stops.length;
      const idx = Math.floor(t % l);
      const nextIdx = (idx + 1) % l;
      const sub = (t % 1); // Interpolation factor

      const cur = stops[idx];
      const nxt = stops[nextIdx];

      // Smoothly interpolate "Target Goal" between waypoints
      const targetGoal = new THREE.Vector3(...cur.at).lerp(new THREE.Vector3(...nxt.at), sub);
      const camGoal = new THREE.Vector3(...cur.cam).lerp(new THREE.Vector3(...nxt.cam), sub);

      // Softly dampen towards the moving goal
      controlsRef.current.target.lerp(targetGoal, 0.05);
      camera.position.lerp(camGoal, 0.05);
      controlsRef.current.update();
    }
  });

  // 50x50 Center = 25
  return (
    <>
      <OrbitControls
        ref={controlsRef}
        target={[25, 0, 25]}
        makeDefault
        minDistance={10}
        maxDistance={80}
        maxPolarAngle={Math.PI / 2.1}
      />

      {/* 🏗️ ASSET RENDERING LOOP */}
      <group>
        {grid.map((row, x) => row.map((cell, y) => {
          const pos = [x, 0, y];
          if (cell === 4) return <WallPanel key={`w-${x}-${y}`} position={[x, 1.5, y]} args={[1, 3, 1]} />;
          if (cell === 6) return <RealisticRack key={`r-${x}-${y}`} position={pos} />;
          if (cell === 7) return <ConveyorBelt key={`c-${x}-${y}`} position={pos} />;
          if (cell === 8) return <ShippingCrate key={`sc-${x}-${y}`} position={pos} />;
          if (cell === 9) return <RobotArm key={`ra-${x}-${y}`} position={pos} />;
          if (cell === 5) return <ChargingPort key={`cp-${x}-${y}`} position={pos} />;
          return null;
        }))}
      </group>

      {/* 🚪 TRANSIT ARCHWAYS (Matches Server 50x50 Layout) */}
      {[
        // Horizontal Divider Gaps (X=18, X=35) -> Pass thru X -> Rot 90
        { p: [18, 0, 9.5], r: [0, Math.PI / 2, 0] }, { p: [18, 0, 26.5], r: [0, Math.PI / 2, 0] }, { p: [18, 0, 43.5], r: [0, Math.PI / 2, 0] },
        { p: [35, 0, 9.5], r: [0, Math.PI / 2, 0] }, { p: [35, 0, 26.5], r: [0, Math.PI / 2, 0] }, { p: [35, 0, 43.5], r: [0, Math.PI / 2, 0] },
        // Vertical Divider Gaps (Z=18, Z=32) -> Pass thru Z -> Rot 0
        { p: [9.5, 0, 18], r: [0, 0, 0] }, { p: [27.5, 0, 18], r: [0, 0, 0] }, { p: [43.5, 0, 18], r: [0, 0, 0] },
        { p: [9.5, 0, 32], r: [0, 0, 0] }, { p: [27.5, 0, 32], r: [0, 0, 0] }, { p: [43.5, 0, 32], r: [0, 0, 0] }
      ].map((d, i) => <DoorFrame key={i} position={d.p} rotation={d.r} />)}

      {/* 🏷️ SOVEREIGN ZONE SIGNAGE — English labels for Three.js font compatibility */}
      <group>
        {Object.entries(zones).map(([name, data]) => {
          if (!data.labelPos) return null;

          const isMedical = name.includes("Medicine") || name.toLowerCase().includes("medical");
          const isPDS = name.includes("PDS") || name.includes("Dispatch") || name.includes("Distribution");
          const isCharging = name.includes("Charging");
          const isReserve = name.includes("Reserve") || name.includes("Godown");

          const textColor = isMedical ? "#FFD700"
            : isPDS ? "#93c5fd"
              : isCharging ? "#4ade80"
                : isReserve ? "#fbbf24"
                  : "#f1f5f9";

          const pinColor = isMedical ? "#FFD700"
            : isPDS ? "#93c5fd"
              : isCharging ? "#4ade80"
                : "#94a3b8";

          const label = getZoneDisplayName ? getZoneDisplayName(name) : name;

          return (
            <group
              key={name}
              position={[data.labelPos.x, 4.5, data.labelPos.z]}
              onClick={(e) => { e.stopPropagation(); onZoneClick && onZoneClick(name); }}
              onPointerOver={() => document.body.style.cursor = 'pointer'}
              onPointerOut={() => document.body.style.cursor = 'auto'}
            >
              {/* Dark backdrop for readability */}
              <mesh position={[0, 0, -0.08]}>
                <planeGeometry args={[Math.max(label.length * 0.28, 3), 1.6]} />
                <meshBasicMaterial color="#000818" transparent opacity={0.5} />
              </mesh>

              {/* Zone text — English only, no rotation so it's readable */}
              <Text
                fontSize={1.05}
                color={textColor}
                anchorX="center"
                anchorY="middle"
                outlineWidth={0.07}
                outlineColor="#000000"
                letterSpacing={0.02}
              >
                {label}
              </Text>

              {/* Vertical indicator pin */}
              <mesh position={[0, -2.3, 0]}>
                <cylinderGeometry args={[0.03, 0.03, 4.6]} />
                <meshBasicMaterial color={pinColor} transparent opacity={0.45} />
              </mesh>

              {/* Glow orb at base */}
              <mesh position={[0, -4.7, 0]}>
                <sphereGeometry args={[0.22, 12, 12]} />
                <meshBasicMaterial color={pinColor} transparent opacity={0.6} />
              </mesh>
            </group>
          );
        })}
      </group>

      {robots.map(bot => <AGV_3D key={bot.id} bot={{ ...bot, solarIrradiance }} />)}

      <Grid position={[25, -0.01, 25]} args={[50, 50]} sectionColor={gridTheme === 'dark' ? "#334155" : "#cbd5e1"} cellColor={gridTheme === 'dark' ? "#1e293b" : "#f1f5f9"} fadeDistance={80} />
      <ContactShadows position={[25, 0.01, 25]} opacity={0.4} scale={60} blur={2.5} far={4} color="#64748b" />
    </>
  );
};

/** 🚀 DIGITAL TWIN CANVAS CONTAINER */
const FactoryMap = ({ grid, robots, solarIrradiance, gridTheme, zones = {}, onZoneClick, cameraMode, targetBot, zoomRequest, getZoneDisplayName }) => (
  <Canvas
    camera={{ position: [50, 50, 50], fov: 35 }}
    shadows
    gl={{ antialias: true }}
    onCreated={({ gl }) => {
      gl.shadowMap.enabled = true;
      gl.shadowMap.type = THREE.PCFSoftShadowMap;
    }}
  >
    {/* 🏭 REALISTIC INDUSTRIAL LIGHTING */}
    {/* 🏭 REALISTIC INDUSTRIAL LIGHTING - Environment removed to prevent fetch errors */}
    <color attach="background" args={[gridTheme === 'dark' ? '#0f172a' : '#FFFFFF']} />
    <ambientLight intensity={0.8} />
    <hemisphereLight intensity={0.6} groundColor={gridTheme === 'dark' ? '#0f172a' : '#ffffff'} />
    <spotLight position={[25, 40, 25]} angle={0.5} penumbra={1} intensity={2} castShadow shadow-mapSize={[2048, 2048]} />
    {grid.length > 0 && <Scene grid={grid} robots={robots} solarIrradiance={solarIrradiance || 0} gridTheme={gridTheme} zones={zones} onZoneClick={onZoneClick} cameraMode={cameraMode} targetBot={targetBot} zoomRequest={zoomRequest} getZoneDisplayName={getZoneDisplayName} />}
  </Canvas>
);

export default FactoryMap;