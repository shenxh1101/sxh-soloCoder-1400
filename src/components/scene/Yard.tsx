import { useMemo } from 'react';
import { YardGrid, SCENE_CONSTANTS } from '../../types';
import { getSlotWorldPosition } from '../../utils/yardUtils';
import { ContainerModel } from './ContainerModel';
import { useSimulationStore } from '../../store/useSimulationStore';

interface YardProps {
  yardGrid: YardGrid;
}

export const Yard = ({ yardGrid }: YardProps) => {
  const { activeContainers } = useSimulationStore();

  const storedContainers = useMemo(() => {
    const result: { container: typeof activeContainers[0]; position: [number, number, number]; slotId: string }[] = [];
    
    for (let bay = 0; bay < SCENE_CONSTANTS.YARD_BAYS; bay++) {
      for (let row = 0; row < SCENE_CONSTANTS.YARD_ROWS; row++) {
        for (let tier = 0; tier < SCENE_CONSTANTS.YARD_TIERS; tier++) {
          const slot = yardGrid[bay]?.[row]?.[tier];
          if (slot?.containerId) {
            const container = activeContainers.find(c => c.id === slot.containerId);
            if (container) {
              const pos = getSlotWorldPosition(bay, row, tier);
              result.push({ container, position: [pos.x, pos.y, pos.z], slotId: slot.id });
            }
          }
        }
      }
    }
    return result;
  }, [yardGrid, activeContainers]);

  const slotMarkers = useMemo(() => {
    const markers: JSX.Element[] = [];
    for (let bay = 0; bay < SCENE_CONSTANTS.YARD_BAYS; bay++) {
      for (let row = 0; row < SCENE_CONSTANTS.YARD_ROWS; row++) {
        const pos = getSlotWorldPosition(bay, row, 0);
        const bayLetter = String.fromCharCode(65 + bay);
        markers.push(
          <group key={`marker-${bay}-${row}`} position={[pos.x, 0.02, pos.z]}>
            <mesh rotation={[-Math.PI / 2, 0, 0]}>
              <planeGeometry args={[SCENE_CONSTANTS.SLOT_WIDTH * 0.9, SCENE_CONSTANTS.SLOT_DEPTH * 0.9]} />
              <meshStandardMaterial 
                color="#1e293b" 
                transparent 
                opacity={0.3}
              />
            </mesh>
            <mesh position={[0, 0.01, 0]} rotation={[-Math.PI / 2, 0, Math.PI / 4]}>
              <ringGeometry args={[SCENE_CONSTANTS.SLOT_WIDTH * 0.4, SCENE_CONSTANTS.SLOT_WIDTH * 0.45, 4]} />
              <meshBasicMaterial color="#64748b" transparent opacity={0.5} />
            </mesh>
          </group>
        );
      }
    }
    return markers;
  }, []);

  const yardWidth = SCENE_CONSTANTS.YARD_BAYS * SCENE_CONSTANTS.SLOT_WIDTH;
  const yardDepth = SCENE_CONSTANTS.YARD_ROWS * SCENE_CONSTANTS.SLOT_DEPTH;
  const originX = SCENE_CONSTANTS.YARD_ORIGIN_X + yardWidth / 2 - SCENE_CONSTANTS.SLOT_WIDTH / 2;
  const originZ = SCENE_CONSTANTS.YARD_ORIGIN_Z + yardDepth / 2 - SCENE_CONSTANTS.SLOT_DEPTH / 2;

  return (
    <group>
      <mesh position={[originX, 0.01, originZ]} receiveShadow>
        <boxGeometry args={[yardWidth + 2, 0.02, yardDepth + 2]} />
        <meshStandardMaterial color="#334155" metalness={0.1} roughness={0.9} />
      </mesh>

      {slotMarkers}

      {storedContainers.map(({ container, position, slotId }) => (
        <ContainerModel 
          key={container.id} 
          container={container} 
          position={position}
          isHighlighted={false}
        />
      ))}

      {Array.from({ length: SCENE_CONSTANTS.YARD_BAYS }).map((_, bay) => (
        <group key={`label-bay-${bay}`}>
          <mesh 
            position={[
              SCENE_CONSTANTS.YARD_ORIGIN_X + bay * SCENE_CONSTANTS.SLOT_WIDTH,
              0.1,
              SCENE_CONSTANTS.YARD_ORIGIN_Z - 2
            ]}
          >
            <boxGeometry args={[2.5, 0.2, 0.5]} />
            <meshStandardMaterial color="#0f172a" />
          </mesh>
        </group>
      ))}

      {Array.from({ length: SCENE_CONSTANTS.YARD_ROWS }).map((_, row) => (
        <group key={`label-row-${row}`}>
          <mesh 
            position={[
              SCENE_CONSTANTS.YARD_ORIGIN_X - 3,
              0.1,
              SCENE_CONSTANTS.YARD_ORIGIN_Z + row * SCENE_CONSTANTS.SLOT_DEPTH
            ]}
          >
            <boxGeometry args={[0.5, 0.2, 5]} />
            <meshStandardMaterial color="#0f172a" />
          </mesh>
        </group>
      ))}

      <mesh position={[originX, 0.5, originZ - yardDepth / 2 - 2]} castShadow>
        <boxGeometry args={[yardWidth + 4, 0.5, 0.3]} />
        <meshStandardMaterial color="#1e293b" metalness={0.5} roughness={0.5} />
      </mesh>
      <mesh position={[originX, 0.5, originZ + yardDepth / 2 + 2]} castShadow>
        <boxGeometry args={[yardWidth + 4, 0.5, 0.3]} />
        <meshStandardMaterial color="#1e293b" metalness={0.5} roughness={0.5} />
      </mesh>
      <mesh position={[originX - yardWidth / 2 - 2, 0.5, originZ]} castShadow>
        <boxGeometry args={[0.3, 0.5, yardDepth + 4]} />
        <meshStandardMaterial color="#1e293b" metalness={0.5} roughness={0.5} />
      </mesh>
    </group>
  );
};
