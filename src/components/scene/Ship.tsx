import { useMemo } from 'react';
import { Container as ContainerType, SCENE_CONSTANTS } from '../../types';
import { ContainerModel } from './ContainerModel';

interface ShipProps {
  containers: ContainerType[];
  shipName: string;
}

export const Ship = ({ containers, shipName }: ShipProps) => {
  const shipPosition = SCENE_CONSTANTS.SHIP_POSITION;
  
  const visibleContainers = useMemo(() => {
    return containers.filter(c => c.status === 'ON_SHIP');
  }, [containers]);

  return (
    <group position={[shipPosition.x, 0, shipPosition.z]}>
      <mesh position={[0, 1, 0]} castShadow>
        <boxGeometry args={[40, 3, 10]} />
        <meshStandardMaterial color="#8b4513" metalness={0.3} roughness={0.7} />
      </mesh>

      <mesh position={[0, 3.5, -3]} castShadow>
        <boxGeometry args={[8, 6, 4]} />
        <meshStandardMaterial color="#1e3a5f" metalness={0.5} roughness={0.5} />
      </mesh>

      <mesh position={[0, 7, -3]} castShadow>
        <boxGeometry args={[6, 2, 3]} />
        <meshStandardMaterial color="#2563eb" metalness={0.4} roughness={0.6} />
      </mesh>

      <mesh position={[0, 2.5, 3]}>
        <boxGeometry args={[38, 0.1, 6]} />
        <meshStandardMaterial color="#4a3728" />
      </mesh>

      {visibleContainers.map((container, index) => {
        const x = container.shipPosition.x;
        const z = container.shipPosition.z - shipPosition.z;
        const tier = Math.floor(index / 10);
        const y = 3.5 + tier * SCENE_CONSTANTS.CONTAINER_HEIGHT + SCENE_CONSTANTS.CONTAINER_HEIGHT / 2;
        return (
          <ContainerModel 
            key={container.id} 
            container={container} 
            position={[x, y, z]}
            isHighlighted={false}
          />
        );
      })}

      <mesh position={[-18, 2, 0]} rotation={[0, Math.PI / 2, 0]} castShadow>
        <torusGeometry args={[1.5, 0.3, 8, 16, Math.PI]} />
        <meshStandardMaterial color="#1a1a1a" metalness={0.8} roughness={0.2} />
      </mesh>
      <mesh position={[18, 2, 0]} rotation={[0, Math.PI / 2, 0]} castShadow>
        <torusGeometry args={[1.5, 0.3, 8, 16, Math.PI]} />
        <meshStandardMaterial color="#1a1a1a" metalness={0.8} roughness={0.2} />
      </mesh>

      <mesh position={[-18, 3.5, 0]} castShadow>
        <boxGeometry args={[0.5, 1.5, 2]} />
        <meshStandardMaterial color="#1a1a1a" metalness={0.8} roughness={0.2} />
      </mesh>
      <mesh position={[18, 3.5, 0]} castShadow>
        <boxGeometry args={[0.5, 1.5, 2]} />
        <meshStandardMaterial color="#1a1a1a" metalness={0.8} roughness={0.2} />
      </mesh>

      <pointLight position={[-15, 4, 3]} intensity={0.8} distance={8} color="#ffff00" />
      <pointLight position={[15, 4, 3]} intensity={0.8} distance={8} color="#ffff00" />
      <pointLight position={[-15, 4, -3]} intensity={0.8} distance={8} color="#ff0000" />
      <pointLight position={[15, 4, -3]} intensity={0.8} distance={8} color="#ff0000" />
    </group>
  );
};
