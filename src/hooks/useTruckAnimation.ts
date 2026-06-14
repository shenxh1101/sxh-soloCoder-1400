import { useRef, useCallback, useEffect } from 'react';
import * as TWEEN from '@tweenjs/tween.js';
import { useSimulationStore } from '../store/useSimulationStore';
import { SCENE_CONSTANTS, Truck } from '../types';
import { getSlotPosition } from '../utils/mockData';
import { getSlotWorldPosition } from '../utils/yardUtils';
import { dispatchTruck } from '../utils/truckDispatcher';

interface TruckAnimationCallbacks {
  onComplete?: () => void;
}

export const useTruckAnimation = () => {
  const { trucks, updateTruck, updateContainer, addOperationLog } = useSimulationStore();
  const activeTweens = useRef<Map<string, TWEEN.Tween<{ x: number; z: number; rotation: number }>>>(new Map());

  const stopTruckAnimation = useCallback((truckId: string) => {
    const tween = activeTweens.current.get(truckId);
    if (tween) {
      tween.stop();
      activeTweens.current.delete(truckId);
    }
  }, []);

  const animateTruck = useCallback((
    truckId: string,
    from: { x: number; z: number },
    to: { x: number; z: number },
    duration: number,
    callbacks?: TruckAnimationCallbacks
  ) => {
    stopTruckAnimation(truckId);

    const dx = to.x - from.x;
    const dz = to.z - from.z;
    const targetRotation = Math.atan2(dz, dx);

    const startValues = { x: from.x, z: from.z, rotation: targetRotation };

    const tween = new TWEEN.Tween(startValues)
      .to({ x: to.x, z: to.z }, duration)
      .easing(TWEEN.Easing.Linear.None)
      .onUpdate((values) => {
        updateTruck(truckId, {
          position: { x: values.x, z: values.z },
          rotation: values.rotation,
        });
      })
      .onComplete(() => {
        activeTweens.current.delete(truckId);
        callbacks?.onComplete?.();
      });

    activeTweens.current.set(truckId, tween);
    tween.start();
  }, [updateTruck, stopTruckAnimation]);

  const dispatchAndSendToCrane = useCallback((containerId: string, callbacks?: TruckAnimationCallbacks): Truck | null => {
    const transferPos = SCENE_CONSTANTS.CRANE_TRANSFER_POSITION;
    
    const truck = dispatchTruck(trucks, transferPos, transferPos);
    if (!truck) return null;

    updateTruck(truck.id, { 
      status: 'MOVING_TO_CRANE', 
      targetPosition: transferPos,
      containerId,
    });
    updateContainer(containerId, { status: 'ON_TRUCK' });
    addOperationLog({
      type: 'TRUCK_MOVE_TO_CRANE',
      containerId,
      truckId: truck.id,
      details: `集卡 ${truck.id} 前往岸桥下接箱`,
      duration: 0,
    });

    const distance = Math.sqrt(
      Math.pow(transferPos.x - truck.position.x, 2) + 
      Math.pow(transferPos.z - truck.position.z, 2)
    );
    const duration = distance * 300;

    animateTruck(truck.id, truck.position, transferPos, duration, {
      onComplete: () => {
        updateTruck(truck.id, { status: 'LOADING', targetPosition: null });
        addOperationLog({
          type: 'TRUCK_LOAD',
          containerId,
          truckId: truck.id,
          details: `集卡 ${truck.id} 到达岸桥下，等待装箱`,
          duration: duration / 1000,
        });
        callbacks?.onComplete?.();
      },
    });

    return truck;
  }, [trucks, updateTruck, updateContainer, addOperationLog, animateTruck]);

  const sendToYard = useCallback((truckId: string, containerId: string, targetSlotId: string, callbacks?: TruckAnimationCallbacks) => {
    const { bay, row } = getSlotPosition(targetSlotId);
    const slotPos = getSlotWorldPosition(bay, row, 0);
    const yardDropPos = { x: slotPos.x + 3, z: slotPos.z };

    const truck = trucks.find(t => t.id === truckId);
    if (!truck) return;

    updateTruck(truckId, { 
      status: 'MOVING_TO_YARD', 
      targetPosition: yardDropPos,
      containerId,
    });
    updateContainer(containerId, { status: 'ON_TRUCK' });
    addOperationLog({
      type: 'TRUCK_MOVE_TO_YARD',
      containerId,
      truckId,
      details: `集卡 ${truckId} 运输集装箱 ${containerId.slice(-4)} 到堆场 ${targetSlotId}`,
      duration: 0,
    });

    const distance = Math.sqrt(
      Math.pow(yardDropPos.x - truck.position.x, 2) + 
      Math.pow(yardDropPos.z - truck.position.z, 2)
    );
    const duration = distance * 300;

    animateTruck(truckId, truck.position, yardDropPos, duration, {
      onComplete: () => {
        updateTruck(truckId, { status: 'UNLOADING', targetPosition: null });
        addOperationLog({
          type: 'TRUCK_UNLOAD',
          containerId,
          truckId,
          details: `集卡 ${truckId} 到达堆场 ${targetSlotId}，等待卸箱`,
          duration: duration / 1000,
        });
        callbacks?.onComplete?.();
      },
    });
  }, [trucks, updateTruck, updateContainer, addOperationLog, animateTruck]);

  const returnToPark = useCallback((truckId: string, callbacks?: TruckAnimationCallbacks) => {
    const truck = trucks.find(t => t.id === truckId);
    if (!truck) return;

    const parkPos = { x: SCENE_CONSTANTS.TRUCK_PARK_POSITION.x, z: truck.position.z };

    updateTruck(truckId, { 
      status: 'RETURNING', 
      targetPosition: parkPos,
      containerId: null,
    });

    const distance = Math.sqrt(
      Math.pow(parkPos.x - truck.position.x, 2) + 
      Math.pow(parkPos.z - truck.position.z, 2)
    );
    const duration = distance * 300;

    animateTruck(truckId, truck.position, parkPos, duration, {
      onComplete: () => {
        updateTruck(truckId, { status: 'IDLE', targetPosition: null });
        callbacks?.onComplete?.();
      },
    });
  }, [trucks, updateTruck, animateTruck]);

  useEffect(() => {
    return () => {
      activeTweens.current.forEach(tween => tween.stop());
      activeTweens.current.clear();
    };
  }, []);

  return {
    dispatchAndSendToCrane,
    sendToYard,
    returnToPark,
    stopTruckAnimation,
  };
};
