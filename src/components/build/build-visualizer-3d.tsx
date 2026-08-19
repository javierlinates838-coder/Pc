"use client";

import { Suspense, useMemo, useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Edges, Grid, OrbitControls } from "@react-three/drei";
import type { PointLight } from "three";
import type { VisualizerSceneData } from "@/lib/build/visualizer-scene";

interface BuildVisualizer3DProps {
  scene: VisualizerSceneData;
  rgbEnabled: boolean;
  rgbHue: number;
}

function SolidBox({
  position,
  size,
  color = "#ff4d9d",
  opacity = 0.85,
  emissive = 0.15,
  metalness = 0.4,
}: {
  position: [number, number, number];
  size: [number, number, number];
  color?: string;
  opacity?: number;
  emissive?: number;
  metalness?: number;
}) {
  return (
    <mesh position={position}>
      <boxGeometry args={size} />
      <meshStandardMaterial
        color={color}
        transparent={opacity < 1}
        opacity={opacity}
        metalness={metalness}
        roughness={0.35}
        emissive={color}
        emissiveIntensity={emissive}
      />
      <Edges color={color} threshold={15} />
    </mesh>
  );
}

function RgbGlow({ enabled, hue }: { enabled: boolean; hue: number }) {
  const ref = useRef<PointLight>(null);
  useFrame(({ clock }) => {
    if (!ref.current || !enabled) return;
    const t = clock.getElapsedTime();
    const intensity = 0.6 + Math.sin(t * 2) * 0.25;
    ref.current.intensity = intensity;
    const h = (hue + t * 0.1) % 1;
    ref.current.color.setHSL(h, 0.85, 0.55);
  });
  if (!enabled) return null;
  return (
    <pointLight ref={ref} position={[0, 0.8, 0.6]} intensity={0.8} distance={4} />
  );
}

function FanSlot({
  position,
  rgb,
}: {
  position: [number, number, number];
  rgb: boolean;
}) {
  return (
    <group position={position}>
      <mesh rotation={[0, 0, 0]}>
        <cylinderGeometry args={[0.12, 0.12, 0.04, 16]} />
        <meshStandardMaterial
          color={rgb ? "#ff4d9d" : "#2a2038"}
          emissive={rgb ? "#ff4d9d" : "#1a1020"}
          emissiveIntensity={rgb ? 0.5 : 0.05}
          metalness={0.6}
        />
      </mesh>
    </group>
  );
}

function CaseScene({ scene, rgbEnabled, rgbHue }: BuildVisualizer3DProps) {
  const { hasParts, gpuScale, gpuSlotHeight, coolerScale, coolerIsAio, fanCount, labels } =
    scene;

  const gpuWidth = 0.55 * gpuScale;
  const gpuHeight = 0.18 * gpuSlotHeight;
  const gpuDepth = 0.28 * gpuScale;

  const fanPositions: [number, number, number][] = [
    [-0.5, 0.35, 0.52],
    [-0.15, 0.35, 0.52],
    [0.2, 0.35, 0.52],
    [0.45, 0.35, 0.52],
  ];

  return (
    <>
      <color attach="background" args={["#08040c"]} />
      <fog attach="fog" args={["#08040c", 6, 14]} />
      <ambientLight intensity={0.35} />
      <directionalLight position={[5, 8, 5]} intensity={1.1} color="#ffd4e8" />
      <directionalLight position={[-4, 3, -3]} intensity={0.35} color="#a855f7" />
      <RgbGlow enabled={rgbEnabled && scene.hasRgb} hue={rgbHue} />

      <Grid
        position={[0, -0.05, 0]}
        infiniteGrid
        cellSize={0.25}
        cellThickness={0.4}
        sectionSize={1}
        sectionThickness={0.8}
        fadeDistance={12}
        cellColor="#2a1838"
        sectionColor="#ff4d9d"
      />

      {/* Case chassis */}
      <SolidBox
        position={[0, 0.65, 0]}
        size={[2.5, 2.35, 1.15]}
        color="#1a1028"
        opacity={0.35}
        emissive={0.02}
        metalness={0.2}
      />

      {/* Glass side panel */}
      <mesh position={[0, 0.65, 0.58]} rotation={[0, 0, 0]}>
        <boxGeometry args={[2.48, 2.3, 0.02]} />
        <meshPhysicalMaterial
          color="#ff9ecf"
          transparent
          opacity={0.12}
          metalness={0.1}
          roughness={0.05}
          transmission={0.6}
          thickness={0.1}
        />
      </mesh>

      {hasParts && (
        <SolidBox
          position={[-0.12, 0.58, -0.02]}
          size={[0.95, 0.7, 0.05]}
          color="#c084fc"
          emissive={0.12}
        />
      )}

      {labels.some((l) => l.id === "gpu") && (
        <SolidBox
          position={[0.32, 0.52, 0.22]}
          size={[gpuWidth, gpuHeight, gpuDepth]}
          color="#ff4d9d"
          emissive={rgbEnabled && scene.hasRgb ? 0.35 : 0.2}
        />
      )}

      {labels.some((l) => l.id === "psu") && (
        <SolidBox
          position={[0.78, 0.18, 0]}
          size={[0.38, 0.28, 0.52]}
          color="#7c3aed"
          emissive={0.1}
        />
      )}

      {labels.some((l) => l.id === "cooler") && (
        <>
          {coolerIsAio ? (
            <SolidBox
              position={[-0.08, 0.78, -0.35]}
              size={[0.9, 0.55, 0.06]}
              color="#f472b6"
              emissive={0.25}
            />
          ) : null}
          <SolidBox
            position={[-0.08, 0.72, 0]}
            size={[0.32 * coolerScale, 0.32 * coolerScale, 0.32 * coolerScale]}
            color="#f472b6"
            emissive={rgbEnabled && scene.hasRgb ? 0.3 : 0.15}
          />
        </>
      )}

      {labels.some((l) => l.id === "ram") && (
        <SolidBox
          position={[0.05, 0.62, 0.08]}
          size={[0.35, 0.22, 0.06]}
          color="#e879f9"
          emissive={rgbEnabled && scene.hasRgb ? 0.4 : 0.12}
        />
      )}

      {fanCount > 0 &&
        fanPositions.slice(0, Math.min(fanCount, 4)).map((pos, i) => (
          <FanSlot key={i} position={pos} rgb={rgbEnabled && scene.hasRgb} />
        ))}

      <OrbitControls
        enablePan={false}
        minDistance={2.8}
        maxDistance={6.5}
        maxPolarAngle={Math.PI / 1.75}
        minPolarAngle={0.25}
        autoRotate={hasParts}
        autoRotateSpeed={0.35}
      />
    </>
  );
}

export function BuildVisualizer3D({ scene, rgbEnabled, rgbHue }: BuildVisualizer3DProps) {
  const stableScene = useMemo(() => scene, [scene]);

  return (
    <Canvas
      camera={{ position: [2.6, 2.1, 3.4], fov: 38 }}
      className="h-full w-full"
      gl={{ antialias: true, alpha: false }}
      dpr={[1, 2]}
    >
      <Suspense fallback={null}>
        <CaseScene scene={stableScene} rgbEnabled={rgbEnabled} rgbHue={rgbHue} />
      </Suspense>
    </Canvas>
  );
}
