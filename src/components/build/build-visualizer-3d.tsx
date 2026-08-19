"use client";

import { Suspense, useMemo } from "react";
import { Canvas } from "@react-three/fiber";
import { Edges, Html, OrbitControls } from "@react-three/drei";
import type { VisualizerLabel } from "@/lib/build/visualizer-labels";

interface BuildVisualizer3DProps {
  labels: VisualizerLabel[];
  hasParts: boolean;
}

function WireBox({
  position,
  size,
  color = "#ff4d9d",
  opacity = 0.15,
}: {
  position: [number, number, number];
  size: [number, number, number];
  color?: string;
  opacity?: number;
}) {
  return (
    <mesh position={position}>
      <boxGeometry args={size} />
      <meshStandardMaterial
        color="#1a0a24"
        transparent
        opacity={opacity}
        emissive={color}
        emissiveIntensity={0.08}
      />
      <Edges color={color} threshold={12} />
    </mesh>
  );
}

function CaseScene({ labels, hasParts }: BuildVisualizer3DProps) {
  const labelMeshes = useMemo(() => labels, [labels]);

  return (
    <>
      <ambientLight intensity={0.45} />
      <pointLight position={[4, 5, 4]} intensity={1.2} color="#ff6eb4" />
      <pointLight position={[-3, 2, -2]} intensity={0.4} color="#a855f7" />

      {/* Outer case shell */}
      <WireBox position={[0, 0.6, 0]} size={[2.4, 2.2, 1.1]} color="#ff4d9d" opacity={0.08} />

      {/* Motherboard plane */}
      {hasParts && (
        <WireBox position={[-0.15, 0.55, -0.05]} size={[0.9, 0.65, 0.04]} color="#e879f9" />
      )}

      {/* GPU */}
      {labelMeshes.some((l) => l.id === "gpu") && (
        <WireBox position={[0.35, 0.5, 0.25]} size={[0.75, 0.22, 0.35]} color="#ff4d9d" />
      )}

      {/* PSU */}
      {labelMeshes.some((l) => l.id === "psu") && (
        <WireBox position={[0.75, 0.15, 0]} size={[0.35, 0.25, 0.5]} color="#c084fc" />
      )}

      {/* Cooler block */}
      {labelMeshes.some((l) => l.id === "cooler") && (
        <WireBox position={[-0.1, 0.72, 0]} size={[0.35, 0.35, 0.35]} color="#f472b6" />
      )}

      {/* Floating labels */}
      {labelMeshes.map((label) => (
        <Html
          key={label.id}
          position={[
            (label.x - 0.5) * 2.2,
            label.y * 1.8,
            (label.z - 0.5) * 1.2,
          ]}
          center
          distanceFactor={6}
          style={{ pointerEvents: "none" }}
        >
          <div
            className="rounded-md border border-[#ff4d9d]/40 bg-[#120818]/90 px-2 py-1 text-[10px] leading-tight shadow-[0_0_12px_rgba(255,77,157,0.25)] backdrop-blur-sm"
          >
            <p className="font-semibold text-white">{label.text}</p>
            {label.subtext && (
              <p className="text-[9px] text-[#f9a8d4]">{label.subtext}</p>
            )}
          </div>
        </Html>
      ))}

      <OrbitControls
        enablePan={false}
        minDistance={3}
        maxDistance={7}
        maxPolarAngle={Math.PI / 1.8}
        minPolarAngle={0.3}
      />
    </>
  );
}

export function BuildVisualizer3D({ labels, hasParts }: BuildVisualizer3DProps) {
  return (
    <Canvas
      camera={{ position: [2.8, 2.2, 3.2], fov: 42 }}
      className="h-full w-full"
      gl={{ antialias: true, alpha: true }}
    >
      <Suspense fallback={null}>
        <CaseScene labels={labels} hasParts={hasParts} />
      </Suspense>
    </Canvas>
  );
}
