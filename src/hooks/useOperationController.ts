import { useCallback, useRef, useEffect } from 'react';
import { useSimulationStore } from '../store/useSimulationStore';
import { useCraneAnimation } from './useCraneAnimation';
import { useTruckAnimation } from './useTruckAnimation';
import { validatePlacement } from '../utils/yardUtils';
import { calculateDistance } from '../utils/truckDispatcher';
import { SCENE_CONSTANTS } from '../types';

export const useOperationController = () => {
  const {
    isPlaying,
    isPaused,
    mode,
    activeContainers,
    currentContainerIndex,
    yardGrid,
    crane,
    trucks,
    incrementContainerIndex,
    placeContainerInYard,
    addOperationLog,
    setViolationMessage,
    currentJobRecord,
    updateJobRecord,
    recordContainerStartTime,
    finalizeContainerTime,
    incrementTruckMetric,
  } = useSimulationStore();

  const {
    moveToShip,
    pickContainer,
    moveToTransferPoint,
    placeOnTruck,
    moveToYard,
    placeInYard,
    pickFromTruck,
    isAnimating: isCraneAnimating,
  } = useCraneAnimation();

  const {
    dispatchAndSendToCrane,
    sendToYard,
    returnToPark,
  } = useTruckAnimation();

  const isProcessing = useRef(false);
  const currentStep = useRef(0);
  const currentTruckId = useRef<string | null>(null);

  const processNextContainer = useCallback(() => {
    if (!isPlaying || isPaused || mode !== 'PLAYING') return;
    if (isProcessing.current || isCraneAnimating) return;
    if (currentContainerIndex >= activeContainers.length) return;

    const container = activeContainers[currentContainerIndex];
    if (!container || container.status === 'STORED') {
      incrementContainerIndex();
      return;
    }

    isProcessing.current = true;
    currentStep.current = 0;

    const validation = validatePlacement(container.targetSlot, container, yardGrid, activeContainers);
    if (!validation.valid) {
      addOperationLog({
        type: 'VIOLATION_WARNING',
        containerId: container.id,
        details: `放置违规: ${validation.message}`,
        duration: 0,
      });
      setViolationMessage(validation.message || '违规操作');
      isProcessing.current = false;
      return;
    }

    recordContainerStartTime(container.id);

    const executeStep = () => {
      if (!isPlaying || isPaused) {
        isProcessing.current = false;
        return;
      }

      switch (currentStep.current) {
        case 0:
          moveToShip(container.id, {
            onComplete: () => {
              currentStep.current = 1;
              executeStep();
            },
          });
          break;

        case 1:
          pickContainer(container.id, {
            onComplete: () => {
              currentStep.current = 2;
              executeStep();
            },
          });
          break;

        case 2:
          moveToTransferPoint(container.id, {
            onComplete: () => {
              currentStep.current = 3;
              executeStep();
            },
          });
          break;

        case 3:
          const truck = dispatchAndSendToCrane(container.id, {
            onComplete: () => {
              currentStep.current = 4;
              executeStep();
            },
          });
          if (truck) {
            currentTruckId.current = truck.id;
            const emptyDist = calculateDistance(truck.position, SCENE_CONSTANTS.CRANE_TRANSFER_POSITION);
            incrementTruckMetric(truck.id, 'emptyDistance', emptyDist);
            incrementTruckMetric(truck.id, 'tripCount', 1);
          } else {
            setTimeout(() => {
              currentStep.current = 3;
              executeStep();
            }, 1000);
          }
          break;

        case 4:
          placeOnTruck(container.id, {
            onComplete: () => {
              currentStep.current = 5;
              executeStep();
            },
          });
          break;

        case 5:
          if (currentTruckId.current) {
            const tid = currentTruckId.current;
            const { bay, row } = (() => {
              const match = container.targetSlot.match(/([A-F])(\d+)-(\d+)/);
              if (!match) return { bay: 0, row: 0 };
              return { bay: match[1].charCodeAt(0) - 65, row: parseInt(match[2]) - 1 };
            })();
            const slotX = SCENE_CONSTANTS.YARD_ORIGIN_X + bay * SCENE_CONSTANTS.SLOT_WIDTH;
            const slotZ = SCENE_CONSTANTS.YARD_ORIGIN_Z + row * SCENE_CONSTANTS.SLOT_DEPTH;
            const dropPos = { x: slotX + 3, z: slotZ };
            
            const trk = trucks.find(t => t.id === tid);
            if (trk) {
              const loadedDist = calculateDistance(trk.position, dropPos);
              incrementTruckMetric(tid, 'loadedDistance', loadedDist);
              incrementTruckMetric(tid, 'totalDistance', calculateDistance(trk.position, dropPos));
            }

            sendToYard(tid, container.id, container.targetSlot, {
              onComplete: () => {
                currentStep.current = 6;
                executeStep();
              },
            });
          }
          break;

        case 6:
          moveToYard(container.id, container.targetSlot, {
            onComplete: () => {
              currentStep.current = 7;
              executeStep();
            },
          });
          break;

        case 7:
          pickFromTruck(container.id, {
            onComplete: () => {
              currentStep.current = 8;
              executeStep();
            },
          });
          break;

        case 8:
          placeInYard(container.id, container.targetSlot, {
            onComplete: () => {
              const success = placeContainerInYard(container.id, container.targetSlot);
              if (success) {
                finalizeContainerTime(container.id);

                if (currentTruckId.current) {
                  returnToPark(currentTruckId.current);
                  currentTruckId.current = null;
                }
                
                incrementContainerIndex();
                
                if (currentContainerIndex + 1 >= activeContainers.length) {
                  addOperationLog({
                    type: 'JOB_COMPLETE',
                    details: `卸船作业完成，共处理 ${activeContainers.length} 个集装箱`,
                    duration: 0,
                  });
                  updateJobRecord({ endTime: Date.now() });
                }
              }
              
              isProcessing.current = false;
            },
          });
          break;
      }
    };

    executeStep();
  }, [
    isPlaying, isPaused, mode, activeContainers, currentContainerIndex, 
    yardGrid, isCraneAnimating, crane, trucks,
    incrementContainerIndex, placeContainerInYard, addOperationLog, 
    setViolationMessage, updateJobRecord,
    recordContainerStartTime, finalizeContainerTime, incrementTruckMetric,
    moveToShip, pickContainer, moveToTransferPoint, placeOnTruck,
    moveToYard, placeInYard, pickFromTruck,
    dispatchAndSendToCrane, sendToYard, returnToPark,
  ]);

  useEffect(() => {
    if (isPlaying && !isPaused && mode === 'PLAYING' && !isProcessing.current) {
      const timer = setTimeout(() => {
        processNextContainer();
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [isPlaying, isPaused, mode, currentContainerIndex, activeContainers.length, processNextContainer]);

  useEffect(() => {
    return () => {
      isProcessing.current = false;
    };
  }, []);

  return {
    processNextContainer,
    isProcessing: isProcessing.current,
  };
};
