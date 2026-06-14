import { useEffect, useRef } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, Sky, Stars } from '@react-three/drei';
import { EffectComposer, Bloom, Vignette } from '@react-three/postprocessing';
import * as THREE from 'three';
import * as TWEEN from '@tweenjs/tween.js';
import { Crane } from './Crane';
import { Yard } from './Yard';
import { Ship } from './Ship';
import { Sea } from './Sea';
import { Truck } from './Truck';
import { useSimulationStore } from '../../store/useSimulationStore';
import { useOperationController } from '../../hooks/useOperationController';

const AnimationUpdater = () => {
  useFrame((_, delta) => {
    TWEEN.update();
    const { isPlaying, isPaused, mode, updateTime } = useSimulationStore.getState();
    if (isPlaying && !isPaused && mode === 'PLAYING') {
      updateTime(delta);
    }
  });
  return null;
};

const SceneContent = () => {
  const { crane, trucks, yardGrid, activeContainers, selectedJobOrderId, jobOrders } = useSimulationStore();
  const { processNextContainer } = useOperationController();

  const selectedJobOrder = jobOrders.find(j => j.id === selectedJobOrderId);
  const shipName = selectedJobOrder?.shipName || '待命中';

  useEffect(() => {
    const interval = setInterval(() => {
      processNextContainer();
    }, 1000);
    return () => clearInterval(interval);
  }, [processNextContainer]);

  return (
    <>
      <Sky 
        distance={450000} 
        sunPosition={[100, 20, 100]} 
        inclination={0.5} 
        azimuth={0.25} 
      />
      <Stars radius={100} depth={50} count={5000} factor={4} saturation={0} fade speed={1} />

      <ambientLight intensity={0.4} />
      <hemisphereLight args={['#87ceeb', '#362d1f', 0.6]} />
      <directionalLight
        position={[50, 50, 25]}
        intensity={1.2}
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
        shadow-camera-far={200}
        shadow-camera-left={-50}
        shadow-camera-right={50}
        shadow-camera-top={50}
        shadow-camera-bottom={-50}
      />
      <directionalLight position={[-30, 20, -30]} intensity={0.3} color="#ff6b35" />

      <Sea />
      <Yard yardGrid={yardGrid} />
      <Ship containers={activeContainers} shipName={shipName} />
      <Crane crane={crane} />
      {trucks.map(truck => (
        <Truck key={truck.id} truck={truck} />
      ))}

      <EffectComposer>
        <Bloom luminanceThreshold={0.2} luminanceSmoothing={0.9} height={300} intensity={0.5} />
        <Vignette offset={0.5} darkness={0.5} />
      </EffectComposer>

      <AnimationUpdater />
    </>
  );
};

export const PortScene = () => {
  return (
    <Canvas
      shadows
      camera={{ position: [30, 30, 30], fov: 60, near: 0.1, far: 1000 }}
      gl={{ antialias: true, toneMapping: THREE.ACESFilmicToneMapping }}
      style={{ background: 'linear-gradient(to bottom, #1a1a2e 0%, #16213e 50%, #0f3460 100%)' }}
    >
      <fog attach="fog" args={['#0f172a', 50, 150]} />
      <SceneContent />
      <OrbitControls
        enableDamping
        dampingFactor={0.05}
        minDistance={15}
        maxDistance={80}
        maxPolarAngle={Math.PI / 2 - 0.1}
        target={[0, 5, 0]}
      />
    </Canvas>
  );
};
