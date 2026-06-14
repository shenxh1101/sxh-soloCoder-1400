import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { Container as ContainerType, SCENE_CONSTANTS } from '../../types';

interface ContainerProps {
  container: ContainerType;
  position: [number, number, number];
  isHighlighted?: boolean;
}

export const ContainerModel = ({ container, position, isHighlighted = false }: ContainerProps) => {
  const meshRef = useRef<THREE.Mesh>(null);
  const frameRef = useRef(0);

  const dimensions = useMemo(() => {
    const width = container.size === '40ft' ? 6 : 3;
    const height = container.isHigh ? 3 : SCENE_CONSTANTS.CONTAINER_HEIGHT;
    const depth = 2.5;
    return [width, height, depth] as [number, number, number];
  }, [container.size, container.isHigh]);

  useFrame(() => {
    if (isHighlighted && meshRef.current) {
      frameRef.current += 0.05;
      const scale = 1 + Math.sin(frameRef.current) * 0.02;
      meshRef.current.scale.setScalar(scale);
    }
  });

  return (
    <group position={position}>
      <mesh ref={meshRef} castShadow receiveShadow>
        <boxGeometry args={dimensions} />
        <meshStandardMaterial 
          color={container.color}
          metalness={0.3}
          roughness={0.7}
          emissive={isHighlighted ? container.color : '#000000'}
          emissiveIntensity={isHighlighted ? 0.3 : 0}
        />
      </mesh>
      
      <mesh position={[0, dimensions[1] / 2 + 0.01, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[dimensions[0] * 0.8, dimensions[2] * 0.8]} />
        <meshStandardMaterial color="#2d2d2d" metalness={0.1} roughness={0.9} />
      </mesh>

      <mesh position={[dimensions[0] / 2 - 0.1, dimensions[1] / 2 - 0.3, dimensions[2] / 2 - 0.1]}>
        <boxGeometry args={[0.2, 0.2, 0.2]} />
        <meshStandardMaterial color="#1a1a1a" metalness={0.8} roughness={0.2} />
      </mesh>
      <mesh position={[-dimensions[0] / 2 + 0.1, dimensions[1] / 2 - 0.3, dimensions[2] / 2 - 0.1]}>
        <boxGeometry args={[0.2, 0.2, 0.2]} />
        <meshStandardMaterial color="#1a1a1a" metalness={0.8} roughness={0.2} />
      </mesh>
      <mesh position={[dimensions[0] / 2 - 0.1, -dimensions[1] / 2 + 0.3, dimensions[2] / 2 - 0.1]}>
        <boxGeometry args={[0.2, 0.2, 0.2]} />
        <meshStandardMaterial color="#1a1a1a" metalness={0.8} roughness={0.2} />
      </mesh>
      <mesh position={[-dimensions[0] / 2 + 0.1, -dimensions[1] / 2 + 0.3, dimensions[2] / 2 - 0.1]}>
        <boxGeometry args={[0.2, 0.2, 0.2]} />
        <meshStandardMaterial color="#1a1a1a" metalness={0.8} roughness={0.2} />
      </mesh>
    </group>
  );
};
