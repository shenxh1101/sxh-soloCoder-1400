import { useCallback } from 'react';
import * as TWEEN from '@tweenjs/tween.js';
import { useSimulationStore } from '../store/useSimulationStore';
import { dispatchTruck, calculateDistance } from '../utils/truckDispatcher';
import { SCENE_CONSTANTS } from '../types';

export const useTruckAnimation = () => {
  const {
    trucks,
    dispatchStrategy,
    roundRobinCounter,
    updateTruck,
    incrementRoundRobin,
    incrementTruckMetric,
  } = useSimulationStore();

  const animateTruckTo = useCallback((
    truckId: string,
    target: { x: number; z: number },
    onComplete?: () => void
  ) => {
    const truck = trucks.find(t => t.id === truckId);
    if (!truck) return;

    const distance = calculateDistance(truck.position, target);
    const duration = Math.max(800, distance * 150);
    const angle = Math.atan2(target.z - truck.position.z, target.x - truck.position.x);

    new TWEEN.Tween({ ...truck.position })
      .to({ x: target.x, z: target.z }, duration)
      .easing(TWEEN.Easing.Quadratic.InOut)
      .onUpdate((val) => {
        updateTruck(truckId, { 
          position: { x: val.x, z: val.z },
          rotation: angle,
        });
      })
      .onComplete(() => {
        if (onComplete) onComplete();
      })
      .start();
  }, [trucks, updateTruck]);

  const dispatchAndSendToCrane = useCallback((
    containerId: string,
    { onComplete }: { onComplete?: () => void } = {}
  ) => {
    const dropTarget = SCENE_CONSTANTS.CRANE_TRANSFER_POSITION;
    const nextCounter = roundRobinCounter;
    const truck = dispatchTruck(trucks, SCENE_CONSTANTS.TRUCK_PARK_POSITION, dropTarget, dispatchStrategy, nextCounter);
    
    if (!truck) return null;

    if (dispatchStrategy === 'ROUND_ROBIN') {
      incrementRoundRobin();
    }

    updateTruck(truck.id, {
      status: 'MOVING_TO_CRANE',
      containerId,
      targetPosition: SCENE_CONSTANTS.CRANE_TRANSFER_POSITION,
    });

    animateTruckTo(truck.id, SCENE_CONSTANTS.CRANE_TRANSFER_POSITION, () => {
      updateTruck(truck.id, {
        status: 'LOADING',
        position: { ...SCENE_CONSTANTS.CRANE_TRANSFER_POSITION },
      });
      if (onComplete) onComplete();
    });

    return truck;
  }, [trucks, dispatchStrategy, roundRobinCounter, updateTruck, animateTruckTo, incrementRoundRobin]);

  const sendToYard = useCallback((
    truckId: string,
    containerId: string,
    targetSlotId: string,
    { onComplete }: { onComplete?: () => void } = {}
  ) => {
    const match = targetSlotId.match(/([A-F])(\d+)-(\d+)/);
    if (!match) return;
    
    const bay = match[1].charCodeAt(0) - 65;
    const row = parseInt(match[2]) - 1;
    
    const slotX = SCENE_CONSTANTS.YARD_ORIGIN_X + bay * SCENE_CONSTANTS.SLOT_WIDTH;
    const slotZ = SCENE_CONSTANTS.YARD_ORIGIN_Z + row * SCENE_CONSTANTS.SLOT_DEPTH;
    const dropPosition = { x: slotX + 3, z: slotZ };

    updateTruck(truckId, {
      status: 'MOVING_TO_YARD',
      containerId,
      targetPosition: dropPosition,
    });

    animateTruckTo(truckId, dropPosition, () => {
      updateTruck(truckId, {
        status: 'UNLOADING',
      });
      if (onComplete) onComplete();
    });
  }, [updateTruck, animateTruckTo]);

  const returnToPark = useCallback((
    truckId: string,
    { onComplete }: { onComplete?: () => void } = {}
  ) => {
    const truck = trucks.find(t => t.id === truckId);
    if (!truck) return;

    const parkOffset = truck.id === 'TRK-001' ? -4 : truck.id === 'TRK-003' ? 4 : 0;
    const parkPosition = { x: SCENE_CONSTANTS.TRUCK_PARK_POSITION.x, z: SCENE_CONSTANTS.TRUCK_PARK_POSITION.z + parkOffset };

    const dist = calculateDistance(truck.position, parkPosition);
    incrementTruckMetric(truckId, 'emptyDistance', dist);
    incrementTruckMetric(truckId, 'totalDistance', dist);

    updateTruck(truckId, {
      status: 'RETURNING',
      containerId: null,
      targetPosition: parkPosition,
    });

    animateTruckTo(truckId, parkPosition, () => {
      updateTruck(truckId, {
        status: 'IDLE',
        position: parkPosition,
        targetPosition: null,
      });
      if (onComplete) onComplete();
    });
  }, [trucks, updateTruck, animateTruckTo, incrementTruckMetric]);

  return {
    animateTruckTo,
    dispatchAndSendToCrane,
    sendToYard,
    returnToPark,
  };
};
