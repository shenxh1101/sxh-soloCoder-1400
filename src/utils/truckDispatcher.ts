import { Truck, SCENE_CONSTANTS } from '../types';

export const calculateDistance = (
  p1: { x: number; z: number },
  p2: { x: number; z: number }
): number => {
  return Math.sqrt(Math.pow(p2.x - p1.x, 2) + Math.pow(p2.z - p1.z, 2));
};

export const dispatchTruck = (
  trucks: Truck[],
  pickPosition: { x: number; z: number },
  dropPosition: { x: number; z: number }
): Truck | null => {
  const idleTrucks = trucks.filter(t => t.status === 'IDLE');
  
  if (idleTrucks.length === 0) {
    return null;
  }

  let bestTruck: Truck | null = null;
  let minCost = Infinity;

  for (const truck of idleTrucks) {
    const deadheadDistance = calculateDistance(truck.position, pickPosition);
    const loadedDistance = calculateDistance(pickPosition, dropPosition);
    const totalCost = deadheadDistance * 1.5 + loadedDistance;
    
    if (totalCost < minCost) {
      minCost = totalCost;
      bestTruck = truck;
    }
  }

  return bestTruck;
};

export const createInitialTrucks = (): Truck[] => {
  return [
    {
      id: 'TRK-001',
      status: 'IDLE',
      containerId: null,
      position: { x: SCENE_CONSTANTS.TRUCK_PARK_POSITION.x, z: SCENE_CONSTANTS.TRUCK_PARK_POSITION.z - 4 },
      targetPosition: null,
      rotation: Math.PI,
      totalOperationTime: 0,
      totalIdleTime: 0,
    },
    {
      id: 'TRK-002',
      status: 'IDLE',
      containerId: null,
      position: { x: SCENE_CONSTANTS.TRUCK_PARK_POSITION.x, z: SCENE_CONSTANTS.TRUCK_PARK_POSITION.z },
      targetPosition: null,
      rotation: Math.PI,
      totalOperationTime: 0,
      totalIdleTime: 0,
    },
    {
      id: 'TRK-003',
      status: 'IDLE',
      containerId: null,
      position: { x: SCENE_CONSTANTS.TRUCK_PARK_POSITION.x, z: SCENE_CONSTANTS.TRUCK_PARK_POSITION.z + 4 },
      targetPosition: null,
      rotation: Math.PI,
      totalOperationTime: 0,
      totalIdleTime: 0,
    },
  ];
};

export const calculateTruckUtilization = (truck: Truck, totalTime: number): number => {
  if (totalTime === 0) return 0;
  return (truck.totalOperationTime / totalTime) * 100;
};
