import { create } from 'zustand';
import { 
  SimulationState, 
  SimulationActions, 
  Crane, 
  Container,
  TruckMetrics,
  DispatchStrategy,
  SCENE_CONSTANTS 
} from '../types';
import { mockJobOrders, getSlotPosition } from '../utils/mockData';
import { createEmptyYardGrid, validatePlacement, validatePlacementForPlan } from '../utils/yardUtils';
import { createInitialTrucks, calculateTruckUtilization } from '../utils/truckDispatcher';
import { exportJobRecordToJSON, generateJobRecordId } from '../utils/exportUtils';

const emptyMetrics = (): TruckMetrics => ({ tripCount: 0, emptyDistance: 0, loadedDistance: 0, totalDistance: 0 });

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
  containerStartTimes: {},
  editingContainerId: null,
  validationPreview: null,
  dispatchStrategy: 'NEAREST',
  roundRobinCounter: 0,
  replayStats: null,

  setMode: (mode) => set({ mode }),

  selectJobOrder: (id) => {
    const jobOrder = get().jobOrders.find(j => j.id === id);
    if (jobOrder) {
      const containers = jobOrder.containers.map(c => ({ ...c, status: 'ON_SHIP' as const }));
      set({ 
        selectedJobOrderId: id, 
        activeContainers: containers,
        currentContainerIndex: 0,
        containerStartTimes: {},
        replayStats: null,
      });
    }
  },

  startSimulation: () => {
    const { selectedJobOrderId, activeContainers, dispatchStrategy } = get();
    if (!selectedJobOrderId || activeContainers.length === 0) return;

    for (const c of activeContainers) {
      const r = validatePlacementForPlan(c.targetSlot, c, activeContainers);
      if (!r.valid) {
        set({ violationMessage: `编排校验失败：集装箱${c.id.slice(-6)} ${r.message}` });
        return;
      }
    }

    const now = Date.now();
    const initialStartTimes: Record<string, number> = {};
    activeContainers.forEach(c => { initialStartTimes[c.id] = 0; });

    set({
      isPlaying: true,
      isPaused: false,
      mode: 'PLAYING',
      currentTime: 0,
      currentContainerIndex: 0,
      crane: createInitialCrane(),
      trucks: createInitialTrucks(),
      yardGrid: createEmptyYardGrid(),
      containerStartTimes: initialStartTimes,
      roundRobinCounter: 0,
      replayStats: null,
      currentJobRecord: {
        id: generateJobRecordId(),
        jobOrderId: selectedJobOrderId,
        startTime: now,
        totalContainers: activeContainers.length,
        completedContainers: 0,
        containerTimes: {},
        craneEfficiency: 0,
        truckUtilizations: {},
        truckMetrics: {
          'TRK-001': emptyMetrics(),
          'TRK-002': emptyMetrics(),
          'TRK-003': emptyMetrics(),
        },
        dispatchStrategy,
        logs: [],
      },
      activeContainers: activeContainers.map(c => ({ ...c, status: 'ON_SHIP' as const })),
    });
  },

  pauseSimulation: () => set({ isPaused: true }),
  
  resumeSimulation: () => set({ isPaused: false }),

  resetSimulation: () => {
    const selId = get().selectedJobOrderId;
    const jobOrder = selId ? get().jobOrders.find(j => j.id === selId) : undefined;
    set({
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
      containerStartTimes: {},
      editingContainerId: null,
      validationPreview: null,
      roundRobinCounter: 0,
      replayStats: null,
      activeContainers: jobOrder 
        ? jobOrder.containers.map(c => ({ ...c, status: 'ON_SHIP' as const }))
        : [],
    });
  },

  setPlaybackSpeed: (speed) => set({ playbackSpeed: speed }),

  updateTime: (delta) => {
    const { currentTime, playbackSpeed, isPaused, mode } = get();
    if (isPaused || mode === 'REPLAY') return;
    const newTime = currentTime + delta * playbackSpeed;
    set({ currentTime: newTime });
    
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
    const state = get();
    if (!state.currentJobRecord) return;
    
    const snapshot: import('../types').ReplaySnapshot = {
      crane: { ...state.crane },
      trucks: state.trucks.map(t => ({ ...t })),
      containers: state.activeContainers.map(c => ({ ...c })),
      yardGrid: state.yardGrid.map(bay => bay.map(row => row.map(slot => ({ ...slot })))),
      currentTime: state.currentTime,
      currentContainerIndex: state.currentContainerIndex,
      completedContainers: state.currentJobRecord.completedContainers,
      containerTimes: { ...state.currentJobRecord.containerTimes },
      truckUtilizations: { ...state.currentJobRecord.truckUtilizations },
      craneEfficiency: state.currentJobRecord.craneEfficiency,
    };

    const newLog = { 
      ...log, 
      timestamp: Date.now(),
      snapshot,
    };
    
    set(state => ({
      currentJobRecord: {
        ...state.currentJobRecord!,
        logs: [...state.currentJobRecord!.logs, newLog],
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
    const elapsedTime = state.currentTime / 3600;
    const craneEfficiency = elapsedTime > 0 ? newCompleted / elapsedTime : 0;

    const truckUtilizations: Record<string, number> = {};
    state.trucks.forEach(truck => {
      truckUtilizations[truck.id] = calculateTruckUtilization(truck, state.currentTime);
    });

    const newTruckMetrics: Record<string, TruckMetrics> = {};
    state.trucks.forEach(truck => {
      newTruckMetrics[truck.id] = { ...truck.metrics };
    });

    set({
      yardGrid: newYardGrid,
      activeContainers: updatedContainers,
      currentJobRecord: state.currentJobRecord ? {
        ...state.currentJobRecord,
        completedContainers: newCompleted,
        craneEfficiency,
        truckUtilizations,
        truckMetrics: newTruckMetrics,
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

  setReplayLogIndex: (index: number) => set({ replayLogIndex: index }),

  exportJobRecord: () => {
    const { currentJobRecord, trucks } = get();
    if (!currentJobRecord) return '';
    const tm: Record<string, TruckMetrics> = {};
    trucks.forEach(t => { tm[t.id] = { ...t.metrics }; });
    return exportJobRecordToJSON({ ...currentJobRecord, truckMetrics: tm });
  },

  loadReplayData: (data) => {
    const parsed = JSON.parse(data);
    const truckMetrics: Record<string, TruckMetrics> = parsed.truckMetrics || {
      'TRK-001': emptyMetrics(),
      'TRK-002': emptyMetrics(),
      'TRK-003': emptyMetrics(),
    };
    const strategy = (parsed.dispatchStrategy || 'NEAREST') as DispatchStrategy;

    set({
      mode: 'REPLAY',
      isPlaying: true,
      isPaused: true,
      currentTime: 0,
      replayLogIndex: 0,
      dispatchStrategy: strategy,
      replayStats: null,
      currentJobRecord: {
        ...parsed,
        dispatchStrategy: strategy,
        truckMetrics,
      },
      yardGrid: createEmptyYardGrid(),
      trucks: createInitialTrucks(),
      crane: createInitialCrane(),
      activeContainers: [],
    });
  },

  enterPlanMode: () => {
    const { selectedJobOrderId, jobOrders } = get();
    if (!selectedJobOrderId) return;
    const jobOrder = jobOrders.find(j => j.id === selectedJobOrderId);
    if (!jobOrder) return;
    
    set({
      mode: 'PLAN',
      activeContainers: jobOrder.containers.map(c => ({ ...c, status: 'ON_SHIP' as const })),
      editingContainerId: null,
      validationPreview: null,
    });
  },

  exitPlanMode: () => {
    set({
      mode: 'EDIT',
      editingContainerId: null,
      validationPreview: null,
    });
  },

  setContainerTargetSlot: (containerId, slotId) => {
    const state = get();
    const container = state.activeContainers.find(c => c.id === containerId);
    if (!container) return { valid: false, message: '集装箱不存在' };

    const modifiedContainer = { ...container, targetSlot: slotId };
    const validation = validatePlacementForPlan(slotId, modifiedContainer, state.activeContainers);
    
    if (validation.valid) {
      set({
        activeContainers: state.activeContainers.map(c =>
          c.id === containerId ? { ...c, targetSlot: slotId } : c
        ),
        validationPreview: { valid: true },
      });
    } else {
      set({ validationPreview: { valid: false, message: validation.message } });
    }

    return validation;
  },

  setEditingContainer: (containerId) => set({ editingContainerId: containerId }),

  setValidationPreview: (preview) => set({ validationPreview: preview }),

  applyReplaySnapshot: (snapshot) => {
    set({
      crane: snapshot.crane,
      trucks: snapshot.trucks,
      activeContainers: snapshot.containers,
      yardGrid: snapshot.yardGrid,
      currentTime: snapshot.currentTime,
      currentContainerIndex: snapshot.currentContainerIndex,
      replayStats: {
        completedContainers: snapshot.completedContainers,
        containerTimes: snapshot.containerTimes,
        truckUtilizations: snapshot.truckUtilizations,
        craneEfficiency: snapshot.craneEfficiency,
      },
    });
  },

  incrementTruckMetric: (truckId, field, delta) => {
    set(state => ({
      trucks: state.trucks.map(t => 
        t.id === truckId 
          ? { ...t, metrics: { ...t.metrics, [field]: t.metrics[field] + delta } }
          : t
      ),
    }));
  },

  recordContainerStartTime: (containerId) => {
    const { currentTime } = get();
    set(state => ({
      containerStartTimes: {
        ...state.containerStartTimes,
        [containerId]: currentTime,
      },
    }));
  },

  finalizeContainerTime: (containerId) => {
    const { currentTime, containerStartTimes, currentJobRecord } = get();
    const startTime = containerStartTimes[containerId];
    if (startTime === undefined || !currentJobRecord) return;

    const elapsed = currentTime - startTime;
    set(state => ({
      currentJobRecord: {
        ...state.currentJobRecord!,
        containerTimes: {
          ...state.currentJobRecord!.containerTimes,
          [containerId]: elapsed,
        },
      },
    }));
  },

  setDispatchStrategy: (strategy) => set({ dispatchStrategy: strategy }),

  incrementRoundRobin: () => {
    let next = 0;
    set(state => {
      next = state.roundRobinCounter + 1;
      return { roundRobinCounter: next };
    });
    return next;
  },
}));
