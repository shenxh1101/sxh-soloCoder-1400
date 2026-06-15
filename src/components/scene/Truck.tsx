import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { Truck as TruckType } from '../../types';
import { ContainerModel } from './ContainerModel';
import { useSimulationStore } from '../../store/useSimulationStore';

interface TruckProps {
  truck: TruckType;
}

export const Truck = ({ truck }: TruckProps) => {
  const groupRef = useRef<THREE.Group>(null);
  const wheelRefs = useRef<THREE.Mesh[]>([]);
  const lastPosition = useRef({ x: truck.position.x, z: truck.position.z });

  const activeContainers = useSimulationStore(s => s.activeContainers);
  const container = activeContainers.find(c => c.id === truck.containerId);

  const statusColors: Record<TruckType['status'], string> = {
    IDLE: '#3b82f6',
    LOADING: '#f59e0b',
    MOVING_TO_CRANE: '#22c55e',
    MOVING_TO_YARD: '#8b5cf6',
    UNLOADING: '#ec4899',
    RETURNING: '#6b7280',
  };

  const statusColor = statusColors[truck.status];

  useFrame((_, delta) => {
    if (groupRef.current) {
      groupRef.current.position.set(truck.position.x, 0.5, truck.position.z);
      groupRef.current.rotation.y = truck.rotation;
    }

    const dx = truck.position.x - lastPosition.current.x;
    const dz = truck.position.z - lastPosition.current.z;
    const distance = Math.sqrt(dx * dx + dz * dz);

    if (distance > 0.001) {
      const rotationAmount = distance / 0.5;
      wheelRefs.current.forEach(wheel => {
        if (wheel) wheel.rotation.x += rotationAmount;
      });
    }

    lastPosition.current = { x: truck.position.x, z: truck.position.z };
  });

  const addWheelRef = (index: number) => (el: THREE.Mesh | null) => {
    if (el) wheelRefs.current[index] = el;
  };

  return (
    <group ref={groupRef} position={[truck.position.x, 0.5, truck.position.z]}>
      <mesh position={[-1.5, 0.8, 0]} castShadow>
        <boxGeometry args={[2, 1.2, 2]} />
        <meshStandardMaterial color="#1e3a5f" metalness={0.5} roughness={0.5} />
      </mesh>

      <mesh position={[-2, 1.2, 0]} castShadow>
        <boxGeometry args={[1, 0.6, 2]} />
        <meshStandardMaterial color="#1e3a5f" metalness={0.5} roughness={0.5} />
      </mesh>

      <mesh position={[-1.5, 1.4, 0.9]}>
        <boxGeometry args={[1.2, 0.6, 0.1]} />
        <meshStandardMaterial color="#60a5fa" transparent opacity={0.3} />
      </mesh>

      <mesh position={[1.5, 0.5, 0]} castShadow>
        <boxGeometry args={[4, 0.4, 2.2]} />
        <meshStandardMaterial color="#4b5563" metalness={0.6} roughness={0.4} />
      </mesh>

      <mesh position={[1.5, 0.15, 0]}>
        <boxGeometry args={[4.2, 0.1, 2.4]} />
        <meshStandardMaterial color={statusColor} emissive={statusColor} emissiveIntensity={0.2} />
      </mesh>

      <mesh ref={addWheelRef(0)} position={[-2.5, -0.2, 1]} rotation={[0, 0, Math.PI / 2]} castShadow>
        <cylinderGeometry args={[0.4, 0.4, 0.3, 16]} />
        <meshStandardMaterial color="#1f2937" metalness={0.3} roughness={0.7} />
      </mesh>
      <mesh ref={addWheelRef(1)} position={[-2.5, -0.2, -1]} rotation={[0, 0, Math.PI / 2]} castShadow>
        <cylinderGeometry args={[0.4, 0.4, 0.3, 16]} />
        <meshStandardMaterial color="#1f2937" metalness={0.3} roughness={0.7} />
      </mesh>
      <mesh ref={addWheelRef(2)} position={[3, -0.2, 1]} rotation={[0, 0, Math.PI / 2]} castShadow>
        <cylinderGeometry args={[0.4, 0.4, 0.3, 16]} />
        <meshStandardMaterial color="#1f2937" metalness={0.3} roughness={0.7} />
      </mesh>
      <mesh ref={addWheelRef(3)} position={[3, -0.2, -1]} rotation={[0, 0, Math.PI / 2]} castShadow>
        <cylinderGeometry args={[0.4, 0.4, 0.3, 16]} />
        <meshStandardMaterial color="#1f2937" metalness={0.3} roughness={0.7} />
      </mesh>
      <mesh ref={addWheelRef(4)} position={[0.5, -0.2, 1]} rotation={[0, 0, Math.PI / 2]} castShadow>
        <cylinderGeometry args={[0.4, 0.4, 0.3, 16]} />
        <meshStandardMaterial color="#1f2937" metalness={0.3} roughness={0.7} />
      </mesh>
      <mesh ref={addWheelRef(5)} position={[0.5, -0.2, -1]} rotation={[0, 0, Math.PI / 2]} castShadow>
        <cylinderGeometry args={[0.4, 0.4, 0.3, 16]} />
        <meshStandardMaterial color="#1f2937" metalness={0.3} roughness={0.7} />
      </mesh>

      {container && (
        <ContainerModel 
          container={container} 
          position={[1.5, 2.2, 0]}
          isHighlighted={truck.status === 'MOVING_TO_YARD' || truck.status === 'UNLOADING'}
        />
      )}

      <pointLight position={[-2.5, 1, 1]} intensity={0.5} distance={5} color="#ffff00" />
      <pointLight position={[-2.5, 1, -1]} intensity={0.5} distance={5} color="#ffff00" />
      <pointLight position={[3.5, 0.5, 0]} intensity={0.3} distance={3} color="#ff0000" />
    </group>
  );
};
