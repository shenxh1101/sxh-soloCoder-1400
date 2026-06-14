import { YardGrid, YardSlot, Container, SCENE_CONSTANTS } from '../types';
import { getSlotPosition, getSlotId } from './mockData';

export const createEmptyYardGrid = (): YardGrid => {
  const grid: YardGrid = [];
  for (let bay = 0; bay < SCENE_CONSTANTS.YARD_BAYS; bay++) {
    grid[bay] = [];
    for (let row = 0; row < SCENE_CONSTANTS.YARD_ROWS; row++) {
      grid[bay][row] = [];
      for (let tier = 0; tier < SCENE_CONSTANTS.YARD_TIERS; tier++) {
        grid[bay][row][tier] = {
          id: getSlotId(bay, row, tier),
          bay,
          row,
          tier,
          containerId: null,
          height: 0,
          weight: 0,
          isHigh: false,
        };
      }
    }
  }
  return grid;
};

export const getSlotWorldPosition = (bay: number, row: number, tier: number): { x: number; y: number; z: number } => {
  const x = SCENE_CONSTANTS.YARD_ORIGIN_X + bay * SCENE_CONSTANTS.SLOT_WIDTH;
  const z = SCENE_CONSTANTS.YARD_ORIGIN_Z + row * SCENE_CONSTANTS.SLOT_DEPTH;
  const y = tier * SCENE_CONSTANTS.CONTAINER_HEIGHT + SCENE_CONSTANTS.CONTAINER_HEIGHT / 2;
  return { x, y, z };
};

export const validatePlacement = (
  targetSlotId: string,
  container: Container,
  yardGrid: YardGrid,
  allContainers: Container[]
): { valid: boolean; message?: string } => {
  const { bay, row, tier } = getSlotPosition(targetSlotId);
  
  if (bay < 0 || bay >= SCENE_CONSTANTS.YARD_BAYS || 
      row < 0 || row >= SCENE_CONSTANTS.YARD_ROWS || 
      tier < 0 || tier >= SCENE_CONSTANTS.YARD_TIERS) {
    return { valid: false, message: "堆场位置超出范围" };
  }

  const targetSlot = yardGrid[bay][row][tier];
  
  if (targetSlot.containerId) {
    return { valid: false, message: "目标位置已被占用" };
  }

  if (tier > 0) {
    const belowSlot = yardGrid[bay][row][tier - 1];
    if (!belowSlot.containerId) {
      return { valid: false, message: "必须先放置底层集装箱" };
    }

    const belowContainer = allContainers.find(c => c.id === belowSlot.containerId);
    if (belowContainer) {
      const isBelowHigh = belowContainer.size === '40ft' || belowContainer.isHigh;
      const isCurrentHigh = container.size === '40ft' || container.isHigh;
      
      if (!isBelowHigh && isCurrentHigh) {
        return { valid: false, message: "违规：高箱不能压在矮箱上面" };
      }

      if (belowSlot.weight < container.weight) {
        return { valid: false, message: `违规：重量(${container.weight}吨)不能大于下方箱子(${belowSlot.weight}吨)` };
      }
    }
  }

  if (container.size === '40ft') {
    if (bay >= SCENE_CONSTANTS.YARD_BAYS - 1) {
      return { valid: false, message: "40尺箱不能放在最后一列" };
    }
    const adjacentSlot = yardGrid[bay + 1][row][tier];
    if (adjacentSlot.containerId) {
      return { valid: false, message: "40尺箱需要占用两列空间，相邻位置已被占用" };
    }
  }

  return { valid: true };
};

export const findAvailableTier = (
  bay: number,
  row: number,
  yardGrid: YardGrid
): number => {
  for (let tier = 0; tier < SCENE_CONSTANTS.YARD_TIERS; tier++) {
    if (!yardGrid[bay][row][tier].containerId) {
      return tier;
    }
  }
  return -1;
};

export const getStoredContainers = (yardGrid: YardGrid): { slot: YardSlot; containerId: string }[] => {
  const result: { slot: YardSlot; containerId: string }[] = [];
  for (let bay = 0; bay < SCENE_CONSTANTS.YARD_BAYS; bay++) {
    for (let row = 0; row < SCENE_CONSTANTS.YARD_ROWS; row++) {
      for (let tier = 0; tier < SCENE_CONSTANTS.YARD_TIERS; tier++) {
        const slot = yardGrid[bay][row][tier];
        if (slot.containerId) {
          result.push({ slot, containerId: slot.containerId });
        }
      }
    }
  }
  return result;
};
