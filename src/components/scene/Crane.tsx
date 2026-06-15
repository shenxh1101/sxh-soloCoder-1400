import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { Crane as CraneType, SCENE_CONSTANTS } from '../../types';
import { ContainerModel } from './ContainerModel';
import { useSimulationStore } from '../../store/useSimulationStore';

interface CraneProps {
  crane: CraneType;
}

export const Crane = ({ crane }: CraneProps) => {
  const groupRef = useRef<THREE.Group>(null);
  const trolleyRef = useRef<THREE.Group>(null);
  const hoistRef = useRef<THREE.Group>(null);
  const spreaderRef = useRef<THREE.Group>(null);

  const activeContainers = useSimulationStore(s => s.activeContainers);
  const currentContainer = activeContainers.find(c => c.id === crane.currentContainerId);

  const gantryHeight = 20;
  const gantryWidth = 12;
  const beamLength = 30;

  const trolleyMinX = -beamLength / 2 + 2;
  const trolleyMaxX = beamLength / 2 - 2;
  const trolleyX = trolleyMinX + crane.trolleyPosition * (trolleyMaxX - trolleyMinX);

  const hoistMinY = 2;
  const hoistMaxY = gantryHeight - 4;
  const hoistY = hoistMinY + (1 - crane.hoistHeight) * (hoistMaxY - hoistMinY);

  useFrame(() => {
    if (groupRef.current) {
      groupRef.current.position.x = crane.positionX;
    }
    if (trolleyRef.current) {
      trolleyRef.current.position.x = trolleyX;
    }
    if (hoistRef.current) {
      hoistRef.current.position.y = hoistY;
    }
  });

  return (
    <group ref={groupRef} position={[crane.positionX, 0, 0]}>
      <mesh position={[-gantryWidth / 2, gantryHeight / 2, 0]} castShadow>
        <boxGeometry args={[1, gantryHeight, 2]} />
        <meshStandardMaterial color="#4a5568" metalness={0.7} roughness={0.3} />
      </mesh>
      <mesh position={[gantryWidth / 2, gantryHeight / 2, 0]} castShadow>
        <boxGeometry args={[1, gantryHeight, 2]} />
        <meshStandardMaterial color="#4a5568" metalness={0.7} roughness={0.3} />
      </mesh>

      <mesh position={[0, gantryHeight, 0]} castShadow>
        <boxGeometry args={[beamLength, 1.5, 2]} />
        <meshStandardMaterial color="#ff7a00" metalness={0.6} roughness={0.4} />
      </mesh>

      <mesh position={[-beamLength / 2 - 1, gantryHeight + 1, 0]} castShadow>
        <boxGeometry args={[3, 2, 2]} />
        <meshStandardMaterial color="#2d3748" metalness={0.5} roughness={0.5} />
      </mesh>

      <group ref={trolleyRef} position={[trolleyX, gantryHeight - 1, 0]}>
        <mesh castShadow>
          <boxGeometry args={[3, 1.5, 2.5]} />
          <meshStandardMaterial color="#2d3748" metalness={0.6} roughness={0.4} />
        </mesh>

        <pointLight position={[0, 0, 0]} intensity={1} distance={15} color="#ffaa00" />

        <group ref={hoistRef} position={[0, hoistY - gantryHeight + 1, 0]}>
          <mesh position={[0, 0, 0]}>
            <cylinderGeometry args={[0.05, 0.05, gantryHeight - hoistY - 2, 8]} />
            <meshStandardMaterial color="#718096" metalness={0.8} roughness={0.2} />
          </mesh>
          <mesh position={[0.5, 0, 0]}>
            <cylinderGeometry args={[0.05, 0.05, gantryHeight - hoistY - 2, 8]} />
            <meshStandardMaterial color="#718096" metalness={0.8} roughness={0.2} />
          </mesh>
          <mesh position={[-0.5, 0, 0]}>
            <cylinderGeometry args={[0.05, 0.05, gantryHeight - hoistY - 2, 8]} />
            <meshStandardMaterial color="#718096" metalness={0.8} roughness={0.2} />
          </mesh>

          <group ref={spreaderRef} position={[0, -(gantryHeight - hoistY - 2) / 2 - 0.5, 0]}>
            <mesh castShadow>
              <boxGeometry args={[4, 0.5, 1.5]} />
              <meshStandardMaterial 
                color={crane.spreaderAttached ? '#22c55e' : '#ef4444'} 
                metalness={0.7} 
                roughness={0.3} 
              />
            </mesh>

            {crane.spreaderAttached && currentContainer && (
              <ContainerModel 
                container={currentContainer} 
                position={[0, -2, 0]}
                isHighlighted={true}
              />
            )}
          </group>
        </group>
      </group>

      <mesh position={[-gantryWidth / 2, 0.5, -4]} castShadow>
        <boxGeometry args={[2, 1, 2]} />
        <meshStandardMaterial color="#1a202c" metalness={0.8} roughness={0.2} />
      </mesh>
      <mesh position={[gantryWidth / 2, 0.5, -4]} castShadow>
        <boxGeometry args={[2, 1, 2]} />
        <meshStandardMaterial color="#1a202c" metalness={0.8} roughness={0.2} />
      </mesh>
      <mesh position={[-gantryWidth / 2, 0.5, 4]} castShadow>
        <boxGeometry args={[2, 1, 2]} />
        <meshStandardMaterial color="#1a202c" metalness={0.8} roughness={0.2} />
      </mesh>
      <mesh position={[gantryWidth / 2, 0.5, 4]} castShadow>
        <boxGeometry args={[2, 1, 2]} />
        <meshStandardMaterial color="#1a202c" metalness={0.8} roughness={0.2} />
      </mesh>
    </group>
  );
};
