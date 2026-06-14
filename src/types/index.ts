export type ContainerSize = '20ft' | '40ft';
export type ContainerStatus = 'PENDING' | 'ON_SHIP' | 'ON_CRANE' | 'ON_TRUCK' | 'STORED';

export interface Container {
  id: string;
  size: ContainerSize;
  weight: number;
  isHigh: boolean;
  color: string;
  targetSlot: string;
  status: ContainerStatus;
  shipPosition: { x: number; z: number };
  worldPosition?: { x: number; y: number; z: number };
}

export interface YardSlot {
  id: string;
  bay: number;
  row: number;
  tier: number;
  containerId: string | null;
  height: number;
  weight: number;
  isHigh: boolean;
}

export type YardGrid = YardSlot[][][];

export type TruckStatus = 'IDLE' | 'LOADING' | 'MOVING_TO_CRANE' | 'MOVING_TO_YARD' | 'UNLOADING' | 'RETURNING';

export interface Truck {
  id: string;
  status: TruckStatus;
  containerId: string | null;
  position: { x: number; z: number };
  targetPosition: { x: number; z: number } | null;
  rotation: number;
  totalOperationTime: number;
  totalIdleTime: number;
}

export type CraneStatus = 'IDLE' | 'MOVING_TO_SHIP' | 'PICKING' | 'MOVING_WITH_LOAD' | 'PLACING_ON_TRUCK' | 'MOVING_FROM_TRUCK' | 'PLACING_IN_YARD';

export interface Crane {
  id: string;
  positionX: number;
  trolleyPosition: number;
  hoistHeight: number;
  spreaderAttached: boolean;
  status: CraneStatus;
  currentContainerId: string | null;
  containersCompleted: number;
  totalWorkTime: number;
}

export interface JobOrder {
  id: string;
  shipName: string;
  containers: Container[];
  createdAt: Date;
}

export type OperationType = 
  | 'CRANE_MOVE_TO_SHIP' 
  | 'CRANE_PICK' 
  | 'CRANE_MOVE_WITH_LOAD' 
  | 'CRANE_PLACE_ON_TRUCK' 
  | 'TRUCK_MOVE_TO_CRANE' 
  | 'TRUCK_LOAD' 
  | 'TRUCK_MOVE_TO_YARD' 
  | 'TRUCK_UNLOAD' 
  | 'CRANE_MOVE_FROM_TRUCK' 
  | 'CRANE_PLACE_IN_YARD' 
  | 'VIOLATION_WARNING' 
  | 'JOB_COMPLETE';

export interface OperationLog {
  timestamp: number;
  type: OperationType;
  containerId?: string;
  truckId?: string;
  details: string;
  duration: number;
}

export interface JobRecord {
  id: string;
  jobOrderId: string;
  startTime: number;
  endTime?: number;
  totalContainers: number;
  completedContainers: number;
  containerTimes: Record<string, number>;
  craneEfficiency: number;
  truckUtilizations: Record<string, number>;
  logs: OperationLog[];
}

export type SimulationMode = 'EDIT' | 'PLAYING' | 'REPLAY';

export interface SimulationState {
  isPlaying: boolean;
  isPaused: boolean;
  currentTime: number;
  playbackSpeed: number;
  mode: SimulationMode;
  selectedJobOrderId: string | null;
  jobOrders: JobOrder[];
  currentJobRecord: JobRecord | null;
  yardGrid: YardGrid;
  trucks: Truck[];
  crane: Crane;
  activeContainers: Container[];
  violationMessage: string | null;
  currentContainerIndex: number;
  replayLogIndex: number;
}

export interface SimulationActions {
  setMode: (mode: SimulationMode) => void;
  selectJobOrder: (id: string | null) => void;
  startSimulation: () => void;
  pauseSimulation: () => void;
  resumeSimulation: () => void;
  resetSimulation: () => void;
  setPlaybackSpeed: (speed: number) => void;
  updateTime: (delta: number) => void;
  updateCrane: (crane: Partial<Crane>) => void;
  updateTruck: (truckId: string, updates: Partial<Truck>) => void;
  updateContainer: (containerId: string, updates: Partial<Container>) => void;
  addOperationLog: (log: Omit<OperationLog, 'timestamp'>) => void;
  updateJobRecord: (updates: Partial<JobRecord>) => void;
  placeContainerInYard: (containerId: string, slotId: string) => boolean;
  setViolationMessage: (message: string | null) => void;
  incrementContainerIndex: () => void;
  incrementReplayLogIndex: () => void;
  resetReplayLogIndex: () => void;
  exportJobRecord: () => string;
  loadReplayData: (data: string) => void;
}

export interface CraneAnimationState {
  targetX: number | null;
  targetTrolley: number | null;
  targetHoist: number | null;
  onComplete?: () => void;
}

export interface TruckAnimationState {
  truckId: string;
  from: { x: number; z: number };
  to: { x: number; z: number };
  duration: number;
  onComplete?: () => void;
}

export const SCENE_CONSTANTS = {
  YARD_BAYS: 6,
  YARD_ROWS: 4,
  YARD_TIERS: 4,
  YARD_ORIGIN_X: -15,
  YARD_ORIGIN_Z: -10,
  SLOT_WIDTH: 3.2,
  SLOT_DEPTH: 6.2,
  CONTAINER_HEIGHT: 2.6,
  CRANE_RAIL_X: -20,
  CRANE_MIN_X: -25,
  CRANE_MAX_X: 25,
  SHIP_POSITION: { x: 0, z: -25 },
  TRUCK_PARK_POSITION: { x: 20, z: 0 },
  CRANE_TRANSFER_POSITION: { x: -18, z: 0 },
} as const;
