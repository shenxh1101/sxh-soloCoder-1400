import { create } from 'zustand';
import { 
  SimulationState, 
  SimulationActions, 
  Crane, 
  Container,
  SCENE_CONSTANTS 
} from '../types';
import { mockJobOrders, getSlotPosition } from '../utils/mockData';
import { createEmptyYardGrid, validatePlacement } from '../utils/yardUtils';
import { createInitialTrucks, calculateTruckUtilization } from '../utils/truckDispatcher';
import { exportJobRecordToJSON, generateJobRecordId } from '../utils/exportUtils';

const createInitialCrane = (): Crane => ({
  id: 'CRANE-001',
  positionX: SCENE_CONSTANTS.CRANE_RAIL_X,
  trolleyPosition: 0.5,
  hoistHeight: 0.8,
  spreaderAttached: false,
  status: 'IDLE',
  currentContainerId: null,
  containersCompleted: 0,
  totalWorkTime: 0,
});

export const useSimulationStore = create<SimulationState & SimulationActions>((set, get) => ({
  isPlaying: false,
  isPaused: false,
  currentTime: 0,
  playbackSpeed: 1,
  mode: 'EDIT',
  selectedJobOrderId: null,
  jobOrders: mockJobOrders,
  currentJobRecord: null,
  yardGrid: createEmptyYardGrid(),
  trucks: createInitialTrucks(),
  crane: createInitialCrane(),
  activeContainers: [],
  violationMessage: null,
  currentContainerIndex: 0,
  replayLogIndex: 0,

  setMode: (mode) => set({ mode }),

  selectJobOrder: (id) => {
    const jobOrder = get().jobOrders.find(j => j.id === id);
    if (jobOrder) {
      const containers = jobOrder.containers.map(c => ({ ...c, status: 'ON_SHIP' as const }));
      set({ 
        selectedJobOrderId: id, 
        activeContainers: containers,
        currentContainerIndex: 0,
      });
    }
  },

  startSimulation: () => {
    const { selectedJobOrderId, activeContainers } = get();
    if (!selectedJobOrderId || activeContainers.length === 0) return;

    const now = Date.now();
    set({
      isPlaying: true,
      isPaused: false,
      mode: 'PLAYING',
      currentTime: 0,
      currentContainerIndex: 0,
      crane: createInitialCrane(),
      trucks: createInitialTrucks(),
      yardGrid: createEmptyYardGrid(),
      currentJobRecord: {
        id: generateJobRecordId(),
        jobOrderId: selectedJobOrderId,
        startTime: now,
        totalContainers: activeContainers.length,
        completedContainers: 0,
        containerTimes: {},
        craneEfficiency: 0,
        truckUtilizations: {},
        logs: [],
      },
      activeContainers: activeContainers.map(c => ({ ...c, status: 'ON_SHIP' as const })),
    });
  },

  pauseSimulation: () => set({ isPaused: true }),
  
  resumeSimulation: () => set({ isPaused: false }),

  resetSimulation: () => set({
    isPlaying: false,
    isPaused: false,
    mode: 'EDIT',
    currentTime: 0,
    currentContainerIndex: 0,
    replayLogIndex: 0,
    crane: createInitialCrane(),
    trucks: createInitialTrucks(),
    yardGrid: createEmptyYardGrid(),
    currentJobRecord: null,
    violationMessage: null,
    activeContainers: get().selectedJobOrderId 
      ? (get().jobOrders.find(j => j.id === get().selectedJobOrderId)?.containers.map(c => ({ ...c, status: 'ON_SHIP' as const })) || [])
      : [],
  }),

  setPlaybackSpeed: (speed) => set({ playbackSpeed: speed }),

  updateTime: (delta) => {
    const { currentTime, playbackSpeed, isPaused } = get();
    if (isPaused) return;
    set({ currentTime: currentTime + delta * playbackSpeed });
    
    const { trucks } = get();
    const updatedTrucks = trucks.map(truck => ({
      ...truck,
      totalIdleTime: truck.status === 'IDLE' ? truck.totalIdleTime + delta * playbackSpeed : truck.totalIdleTime,
      totalOperationTime: truck.status !== 'IDLE' ? truck.totalOperationTime + delta * playbackSpeed : truck.totalOperationTime,
    }));
    set({ trucks: updatedTrucks });
  },

  updateCrane: (updates) => set(state => ({
    crane: { ...state.crane, ...updates },
  })),

  updateTruck: (truckId, updates) => set(state => ({
    trucks: state.trucks.map(t => t.id === truckId ? { ...t, ...updates } : t),
  })),

  updateContainer: (containerId, updates) => set(state => ({
    activeContainers: state.activeContainers.map(c => 
      c.id === containerId ? { ...c, ...updates } : c
    ),
  })),

  addOperationLog: (log) => {
    const { currentJobRecord, currentTime } = get();
    if (!currentJobRecord) return;
    
    const timestamp = Date.now();
    const newLog = { ...log, timestamp };
    const containerId = log.containerId;
    
    if (containerId && !currentJobRecord.containerTimes[containerId]) {
      currentJobRecord.containerTimes[containerId] = 0;
    }
    
    set(state => ({
      currentJobRecord: {
        ...state.currentJobRecord!,
        logs: [...state.currentJobRecord!.logs, newLog],
        containerTimes: containerId 
          ? { 
              ...state.currentJobRecord!.containerTimes,
              [containerId]: (state.currentJobRecord!.containerTimes[containerId] || 0) + currentTime 
            }
          : state.currentJobRecord!.containerTimes,
      },
    }));
  },

  updateJobRecord: (updates) => set(state => ({
    currentJobRecord: state.currentJobRecord 
      ? { ...state.currentJobRecord, ...updates } 
      : null,
  })),

  placeContainerInYard: (containerId, slotId) => {
    const state = get();
    const container = state.activeContainers.find(c => c.id === containerId);
    if (!container) return false;

    const validation = validatePlacement(slotId, container, state.yardGrid, state.activeContainers);
    if (!validation.valid) {
      set({ violationMessage: validation.message || '违规操作' });
      return false;
    }

    const { bay, row, tier } = getSlotPosition(slotId);
    
    const newYardGrid = [...state.yardGrid];
    newYardGrid[bay] = [...newYardGrid[bay]];
    newYardGrid[bay][row] = [...newYardGrid[bay][row]];
    newYardGrid[bay][row][tier] = {
      ...newYardGrid[bay][row][tier],
      containerId,
      height: container.size === '40ft' ? 2 : 1,
      weight: container.weight,
      isHigh: container.size === '40ft' || container.isHigh,
    };

    if (container.size === '40ft') {
      newYardGrid[bay + 1] = [...newYardGrid[bay + 1]];
      newYardGrid[bay + 1][row] = [...newYardGrid[bay + 1][row]];
      newYardGrid[bay + 1][row][tier] = {
        ...newYardGrid[bay + 1][row][tier],
        containerId,
        height: 2,
        weight: container.weight,
        isHigh: true,
      };
    }

    const updatedContainers = state.activeContainers.map(c =>
      c.id === containerId ? { ...c, status: 'STORED' as const } : c
    );

    const newCompleted = (state.currentJobRecord?.completedContainers || 0) + 1;
    const totalTime = (state.currentJobRecord ? Date.now() - state.currentJobRecord.startTime : 0) / 3600000;
    const craneEfficiency = totalTime > 0 ? newCompleted / totalTime : 0;

    const truckUtilizations: Record<string, number> = {};
    const totalSimulationTime = state.currentTime;
    state.trucks.forEach(truck => {
      truckUtilizations[truck.id] = calculateTruckUtilization(truck, totalSimulationTime);
    });

    set({
      yardGrid: newYardGrid,
      activeContainers: updatedContainers,
      currentJobRecord: state.currentJobRecord ? {
        ...state.currentJobRecord,
        completedContainers: newCompleted,
        craneEfficiency,
        truckUtilizations,
        endTime: newCompleted === state.currentJobRecord.totalContainers ? Date.now() : undefined,
      } : null,
      crane: {
        ...state.crane,
        containersCompleted: newCompleted,
      },
    });

    return true;
  },

  setViolationMessage: (message) => set({ violationMessage: message }),

  incrementContainerIndex: () => set(state => ({
    currentContainerIndex: state.currentContainerIndex + 1,
  })),

  incrementReplayLogIndex: () => set(state => ({
    replayLogIndex: state.replayLogIndex + 1,
  })),

  resetReplayLogIndex: () => set({ replayLogIndex: 0 }),

  exportJobRecord: () => {
    const { currentJobRecord } = get();
    if (!currentJobRecord) return '';
    return exportJobRecordToJSON(currentJobRecord);
  },

  loadReplayData: (data) => {
    const parsed = JSON.parse(data);
    set({
      mode: 'REPLAY',
      currentJobRecord: parsed,
      isPlaying: true,
      isPaused: false,
      currentTime: 0,
      replayLogIndex: 0,
    });
  },
}));
