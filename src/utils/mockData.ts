import { JobOrder, Container } from '../types';

const generateId = () => Math.random().toString(36).substr(2, 9);

const containerColors = {
  '20ft': ['#1E40AF', '#1D4ED8', '#2563EB', '#3B82F6'],
  '40ft': ['#C2410C', '#EA580C', '#F97316', '#FB923C'],
};

const createContainer = (
  index: number,
  size: '20ft' | '40ft',
  weight: number,
  isHigh: boolean,
  targetSlot: string,
  shipX: number,
  shipZ: number
): Container => ({
  id: `CNT-${generateId()}`,
  size,
  weight,
  isHigh,
  color: containerColors[size][index % containerColors[size].length],
  targetSlot,
  status: 'ON_SHIP',
  shipPosition: { x: shipX, z: shipZ },
});

export const mockJobOrders: JobOrder[] = [
  {
    id: 'JOB-001',
    shipName: '中远之星 COSCO STAR',
    createdAt: new Date(),
    containers: [
      createContainer(0, '20ft', 18, false, 'A1-0', -8, -24),
      createContainer(1, '40ft', 28, true, 'B1-0', -4, -24),
      createContainer(2, '20ft', 15, false, 'A2-0', 0, -24),
      createContainer(3, '20ft', 22, false, 'C1-0', 4, -24),
      createContainer(4, '40ft', 30, true, 'D1-0', 8, -24),
      createContainer(5, '20ft', 12, false, 'A3-0', -8, -22),
      createContainer(6, '40ft', 25, true, 'E1-0', -4, -22),
      createContainer(7, '20ft', 20, false, 'B2-0', 0, -22),
      createContainer(8, '20ft', 16, false, 'C2-0', 4, -22),
      createContainer(9, '40ft', 32, true, 'F1-0', 8, -22),
    ],
  },
  {
    id: 'JOB-002',
    shipName: '马士基快线 MAERSK EXPRESS',
    createdAt: new Date(),
    containers: [
      createContainer(0, '40ft', 35, true, 'A1-0', -8, -24),
      createContainer(1, '20ft', 10, false, 'C1-0', -4, -24),
      createContainer(2, '20ft', 14, false, 'D1-0', 0, -24),
      createContainer(3, '40ft', 28, true, 'E1-0', 4, -24),
      createContainer(4, '20ft', 18, false, 'A2-0', 8, -24),
      createContainer(5, '40ft', 22, false, 'B1-0', -8, -22),
      createContainer(6, '20ft', 8, false, 'F1-0', -4, -22),
      createContainer(7, '20ft', 24, false, 'C2-0', 0, -22),
      createContainer(8, '40ft', 30, true, 'D2-0', 4, -22),
      createContainer(9, '20ft', 15, false, 'A3-0', 8, -22),
    ],
  },
];

export const getSlotPosition = (slotId: string): { bay: number; row: number; tier: number } => {
  const match = slotId.match(/([A-F])(\d+)-(\d+)/);
  if (!match) return { bay: 0, row: 0, tier: 0 };
  const bay = match[1].charCodeAt(0) - 65;
  const row = parseInt(match[2]) - 1;
  const tier = parseInt(match[3]);
  return { bay, row, tier };
};

export const getSlotId = (bay: number, row: number, tier: number): string => {
  const bayLetter = String.fromCharCode(65 + bay);
  return `${bayLetter}${row + 1}-${tier}`;
};
