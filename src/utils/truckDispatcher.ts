import { Truck, TruckMetrics, SCENE_CONSTANTS } from '../types';

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
  const emptyMetrics = (): TruckMetrics => ({ tripCount: 0, emptyDistance: 0, loadedDistance: 0, totalDistance: 0 });
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
      metrics: emptyMetrics(),
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
      metrics: emptyMetrics(),
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
      metrics: emptyMetrics(),
    },
  ];
};

export const calculateTruckUtilization = (truck: Truck, totalTime: number): number => {
  if (totalTime === 0) return 0;
  return (truck.totalOperationTime / totalTime) * 100;
};

export const formatDistance = (dist: number): string => {
  return dist.toFixed(1);
};

export const summarizeTruckMetrics = (trucks: Truck[]): { totalTrips: number; totalEmpty: number; totalLoaded: number; avgUtilization: number } => {
  let totalTrips = 0;
  let totalEmpty = 0;
  let totalLoaded = 0;
  let totalOpTime = 0;
  let totalAllTime = 0;

  for (const truck of trucks) {
    totalTrips += truck.metrics.tripCount;
    totalEmpty += truck.metrics.emptyDistance;
    totalLoaded += truck.metrics.loadedDistance;
    totalOpTime += truck.totalOperationTime;
    totalAllTime += truck.totalOperationTime + truck.totalIdleTime;
  }

  return {
    totalTrips,
    totalEmpty,
    totalLoaded,
    avgUtilization: totalAllTime > 0 ? (totalOpTime / totalAllTime) * 100 : 0,
  };
};
