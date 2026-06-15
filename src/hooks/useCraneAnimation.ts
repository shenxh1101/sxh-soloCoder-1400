import { useRef, useCallback, useEffect } from 'react';
import * as TWEEN from '@tweenjs/tween.js';
import { useSimulationStore } from '../store/useSimulationStore';
import { SCENE_CONSTANTS } from '../types';
import { getSlotPosition } from '../utils/mockData';
import { getSlotWorldPosition } from '../utils/yardUtils';

interface AnimationCallbacks {
  onComplete?: () => void;
}

export const useCraneAnimation = () => {
  const currentTween = useRef<TWEEN.Tween<{ x: number; trolley: number; hoist: number }> | null>(null);
  const isAnimating = useRef(false);

  const stopCurrentAnimation = useCallback(() => {
    if (currentTween.current) {
      currentTween.current.stop();
      currentTween.current = null;
    }
    isAnimating.current = false;
  }, []);

  const animateTo = useCallback((targetX: number, targetTrolley: number, targetHoist: number, duration: number = 2000, callbacks?: AnimationCallbacks) => {
    stopCurrentAnimation();
    isAnimating.current = true;

    const state = useSimulationStore.getState();
    const crane = state.crane;
    const startValues = {
      x: crane.positionX,
      trolley: crane.trolleyPosition,
      hoist: crane.hoistHeight,
    };

    const tween = new TWEEN.Tween(startValues)
      .to({ x: targetX, trolley: targetTrolley, hoist: targetHoist }, duration)
      .easing(TWEEN.Easing.Cubic.InOut)
      .onUpdate((values) => {
        useSimulationStore.getState().updateCrane({
          positionX: values.x,
          trolleyPosition: values.trolley,
          hoistHeight: values.hoist,
        });
      })
      .onComplete(() => {
        isAnimating.current = false;
        currentTween.current = null;
        callbacks?.onComplete?.();
      });

    currentTween.current = tween;
    tween.start();
  }, [stopCurrentAnimation]);

  const moveToShip = useCallback((containerId: string, callbacks?: AnimationCallbacks) => {
  const { activeContainers, updateCrane, addOperationLog } = useSimulationStore.getState();
  const container = activeContainers.find(c => c.id === containerId);
    if (!container) return;

    updateCrane({ status: 'MOVING_TO_SHIP' });
    addOperationLog({
      type: 'CRANE_MOVE_TO_SHIP',
      containerId,
      details: `岸桥移动到船舶位置抓取集装箱 ${container.id.slice(-4)}`,
      duration: 0,
    });

    const targetX = SCENE_CONSTANTS.CRANE_RAIL_X;
    const targetTrolley = 0.3 + (container.shipPosition.x + 10) / 30;
    const targetHoist = 0.7;

    animateTo(targetX, targetTrolley, targetHoist, 2500, {
      onComplete: () => {
        useSimulationStore.getState().updateCrane({ status: 'PICKING' });
        callbacks?.onComplete?.();
      },
    });
  }, [animateTo]);

  const pickContainer = useCallback((containerId: string, callbacks?: AnimationCallbacks) => {
    const { activeContainers, updateCrane, updateContainer, addOperationLog } = useSimulationStore.getState();
    const container = activeContainers.find(c => c.id === containerId);
    if (!container) return;

    const state = useSimulationStore.getState();
    const startValues = { hoist: state.crane.hoistHeight };
    const targetHoist = 0.2;

    stopCurrentAnimation();
    isAnimating.current = true;

    const lowerTween = new TWEEN.Tween(startValues)
      .to({ hoist: targetHoist }, 1500)
      .easing(TWEEN.Easing.Quadratic.InOut)
      .onUpdate((values) => {
        useSimulationStore.getState().updateCrane({ hoistHeight: values.hoist });
      })
      .onComplete(() => {
        const s = useSimulationStore.getState();
        s.updateCrane({ spreaderAttached: true, currentContainerId: containerId });
        s.updateContainer(containerId, { status: 'ON_CRANE' });
        s.addOperationLog({
          type: 'CRANE_PICK',
          containerId,
          details: `抓取集装箱 ${container.id.slice(-4)} (${container.size}, ${container.weight}吨)`,
          duration: 1.5,
        });

        setTimeout(() => {
          const raiseValues = { hoist: targetHoist };
          const raiseTween = new TWEEN.Tween(raiseValues)
            .to({ hoist: 0.7 }, 1500)
            .easing(TWEEN.Easing.Quadratic.InOut)
            .onUpdate((values) => {
              useSimulationStore.getState().updateCrane({ hoistHeight: values.hoist });
            })
            .onComplete(() => {
              isAnimating.current = false;
              callbacks?.onComplete?.();
            });
          raiseTween.start();
        }, 300);
      });

    currentTween.current = lowerTween as unknown as TWEEN.Tween<{ x: number; trolley: number; hoist: number }>;
    lowerTween.start();
  }, [stopCurrentAnimation]);

  const moveToTransferPoint = useCallback((containerId: string, callbacks?: AnimationCallbacks) => {
    const { updateCrane, addOperationLog } = useSimulationStore.getState();
    updateCrane({ status: 'MOVING_WITH_LOAD' });
    addOperationLog({
      type: 'CRANE_MOVE_WITH_LOAD',
      containerId,
      details: `岸桥吊运集装箱 ${containerId.slice(-4)} 到集卡转运点`,
      duration: 0,
    });

    const targetX = SCENE_CONSTANTS.CRANE_TRANSFER_POSITION.x;
    const targetTrolley = 0.5;
    const targetHoist = 0.6;

    animateTo(targetX, targetTrolley, targetHoist, 3000, {
      onComplete: () => {
        useSimulationStore.getState().updateCrane({ status: 'PLACING_ON_TRUCK' });
        callbacks?.onComplete?.();
      },
    });
  }, [animateTo]);

  const placeOnTruck = useCallback((containerId: string, callbacks?: AnimationCallbacks) => {
    const state = useSimulationStore.getState();
    const startValues = { hoist: state.crane.hoistHeight };
    const targetHoist = 0.35;

    stopCurrentAnimation();
    isAnimating.current = true;

    const lowerTween = new TWEEN.Tween(startValues)
      .to({ hoist: targetHoist }, 1200)
      .easing(TWEEN.Easing.Quadratic.InOut)
      .onUpdate((values) => {
        useSimulationStore.getState().updateCrane({ hoistHeight: values.hoist });
      })
      .onComplete(() => {
        const s = useSimulationStore.getState();
        s.updateCrane({ spreaderAttached: false, currentContainerId: null });
        s.updateContainer(containerId, { status: 'ON_TRUCK' });
        s.addOperationLog({
          type: 'CRANE_PLACE_ON_TRUCK',
          containerId,
          details: `将集装箱 ${containerId.slice(-4)} 放置到集卡上`,
          duration: 1.2,
        });

        setTimeout(() => {
          const raiseValues = { hoist: targetHoist };
          const raiseTween = new TWEEN.Tween(raiseValues)
            .to({ hoist: 0.7 }, 1200)
            .easing(TWEEN.Easing.Quadratic.InOut)
            .onUpdate((values) => {
              useSimulationStore.getState().updateCrane({ hoistHeight: values.hoist });
            })
            .onComplete(() => {
              useSimulationStore.getState().updateCrane({ status: 'IDLE' });
              isAnimating.current = false;
              callbacks?.onComplete?.();
            });
          raiseTween.start();
        }, 300);
      });

    currentTween.current = lowerTween as unknown as TWEEN.Tween<{ x: number; trolley: number; hoist: number }>;
    lowerTween.start();
  }, [stopCurrentAnimation]);

  const moveToYard = useCallback((containerId: string, targetSlotId: string, callbacks?: AnimationCallbacks) => {
    const { bay, row } = getSlotPosition(targetSlotId);
    const { x } = getSlotWorldPosition(bay, row, 0);

    const { updateCrane, addOperationLog } = useSimulationStore.getState();
    updateCrane({ status: 'MOVING_FROM_TRUCK' });
    addOperationLog({
      type: 'CRANE_MOVE_FROM_TRUCK',
      containerId,
      details: `岸桥移动到堆场 ${targetSlotId}`,
      duration: 0,
    });

    const targetX = SCENE_CONSTANTS.CRANE_RAIL_X;
    const targetTrolley = 0.6 + (x + 15) / 40;
    const targetHoist = 0.6;

    animateTo(targetX, targetTrolley, targetHoist, 2500, {
      onComplete: () => {
        useSimulationStore.getState().updateCrane({ status: 'PLACING_IN_YARD' });
        callbacks?.onComplete?.();
      },
    });
  }, [animateTo]);

  const placeInYard = useCallback((containerId: string, targetSlotId: string, callbacks?: AnimationCallbacks) => {
    const { bay, row, tier } = getSlotPosition(targetSlotId);
    const targetHoist = 0.3 + tier * 0.15;

    stopCurrentAnimation();
    isAnimating.current = true;

    const state = useSimulationStore.getState();
    const startValues = { hoist: state.crane.hoistHeight };

    const lowerTween = new TWEEN.Tween(startValues)
      .to({ hoist: targetHoist }, 1500)
      .easing(TWEEN.Easing.Quadratic.InOut)
      .onUpdate((values) => {
        useSimulationStore.getState().updateCrane({ hoistHeight: values.hoist });
      })
      .onComplete(() => {
        const s = useSimulationStore.getState();
        s.updateCrane({ spreaderAttached: false, currentContainerId: null });
        s.addOperationLog({
          type: 'CRANE_PLACE_IN_YARD',
          containerId,
          details: `将集装箱 ${containerId.slice(-4)} 堆放到 ${targetSlotId}`,
          duration: 1.5,
        });

        setTimeout(() => {
          const raiseValues = { hoist: targetHoist };
          const raiseTween = new TWEEN.Tween(raiseValues)
            .to({ hoist: 0.8 }, 1500)
            .easing(TWEEN.Easing.Quadratic.InOut)
            .onUpdate((values) => {
              useSimulationStore.getState().updateCrane({ hoistHeight: values.hoist });
            })
            .onComplete(() => {
              useSimulationStore.getState().updateCrane({ status: 'IDLE' });
              isAnimating.current = false;
              callbacks?.onComplete?.();
            });
          raiseTween.start();
        }, 300);
      });

    currentTween.current = lowerTween as unknown as TWEEN.Tween<{ x: number; trolley: number; hoist: number }>;
    lowerTween.start();
  }, [stopCurrentAnimation]);

  const pickFromTruck = useCallback((containerId: string, callbacks?: AnimationCallbacks) => {
    stopCurrentAnimation();
    isAnimating.current = true;

    const state = useSimulationStore.getState();
    const startValues = { hoist: state.crane.hoistHeight };
    const targetHoist = 0.35;

    const lowerTween = new TWEEN.Tween(startValues)
      .to({ hoist: targetHoist }, 1200)
      .easing(TWEEN.Easing.Quadratic.InOut)
      .onUpdate((values) => {
        useSimulationStore.getState().updateCrane({ hoistHeight: values.hoist });
      })
      .onComplete(() => {
        const s = useSimulationStore.getState();
        s.updateCrane({ spreaderAttached: true, currentContainerId: containerId });
        s.updateContainer(containerId, { status: 'ON_CRANE' });

        setTimeout(() => {
          const raiseValues = { hoist: targetHoist };
          const raiseTween = new TWEEN.Tween(raiseValues)
            .to({ hoist: 0.7 }, 1200)
            .easing(TWEEN.Easing.Quadratic.InOut)
            .onUpdate((values) => {
              useSimulationStore.getState().updateCrane({ hoistHeight: values.hoist });
            })
            .onComplete(() => {
              isAnimating.current = false;
              callbacks?.onComplete?.();
            });
          raiseTween.start();
        }, 300);
      });

    currentTween.current = lowerTween as unknown as TWEEN.Tween<{ x: number; trolley: number; hoist: number }>;
    lowerTween.start();
  }, [stopCurrentAnimation]);

  useEffect(() => {
    return () => {
      stopCurrentAnimation();
    };
  }, [stopCurrentAnimation]);

  return {
    isAnimating,
    animateTo,
    moveToShip,
    pickContainer,
    moveToTransferPoint,
    placeOnTruck,
    moveToYard,
    placeInYard,
    pickFromTruck,
    stopCurrentAnimation,
  };
};
