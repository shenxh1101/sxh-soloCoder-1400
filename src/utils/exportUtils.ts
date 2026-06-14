import { JobRecord, OperationLog, TruckMetrics, DispatchStrategy } from '../types';

const emptyMetrics = (): TruckMetrics => ({ tripCount: 0, emptyDistance: 0, loadedDistance: 0, totalDistance: 0 });

export const exportJobRecordToJSON = (record: JobRecord): string => {
  const exportData = {
    id: record.id,
    jobOrderId: record.jobOrderId,
    startTime: new Date(record.startTime).toISOString(),
    endTime: record.endTime ? new Date(record.endTime).toISOString() : null,
    totalContainers: record.totalContainers,
    completedContainers: record.completedContainers,
    containerTimes: record.containerTimes,
    craneEfficiency: record.craneEfficiency,
    truckUtilizations: record.truckUtilizations,
    truckMetrics: record.truckMetrics,
    dispatchStrategy: record.dispatchStrategy || 'NEAREST',
    averageTimePerContainer: record.endTime 
      ? (record.endTime - record.startTime) / record.completedContainers / 1000 
      : 0,
    logs: record.logs.map(log => ({
      type: log.type,
      containerId: log.containerId,
      truckId: log.truckId,
      details: log.details,
      duration: log.duration,
      timestamp: new Date(log.timestamp).toISOString(),
    })),
    snapshots: record.logs.map((log, i) => ({
      logIndex: i,
      snapshot: log.snapshot || null,
    })),
  };
  return JSON.stringify(exportData, null, 2);
};

export const downloadJSON = (data: string, filename: string): void => {
  const blob = new Blob([data], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

export const parseReplayData = (jsonString: string): JobRecord | null => {
  try {
    const data = JSON.parse(jsonString);
    
    const snapshotMap = new Map<number, any>();
    if (data.snapshots) {
      for (const s of data.snapshots) {
        if (s.snapshot) snapshotMap.set(s.logIndex, s.snapshot);
      }
    }

    const logs: OperationLog[] = (data.logs || []).map((log: any, i: number) => ({
      ...log,
      timestamp: new Date(log.timestamp).getTime(),
      snapshot: snapshotMap.get(i) || undefined,
    }));

    return {
      ...data,
      startTime: new Date(data.startTime).getTime(),
      endTime: data.endTime ? new Date(data.endTime).getTime() : undefined,
      dispatchStrategy: (data.dispatchStrategy || 'NEAREST') as DispatchStrategy,
      truckMetrics: data.truckMetrics || {
        'TRK-001': emptyMetrics(),
        'TRK-002': emptyMetrics(),
        'TRK-003': emptyMetrics(),
      },
      logs,
    };
  } catch (e) {
    console.error('Failed to parse replay data:', e);
    return null;
  }
};

export const formatTime = (seconds: number): string => {
  if (seconds < 0) seconds = 0;
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
};

export const generateJobRecordId = (): string => {
  return `REC-${Date.now()}`;
};
