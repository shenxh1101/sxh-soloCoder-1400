import { JobRecord, OperationLog } from '../types';

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
    averageTimePerContainer: record.endTime 
      ? (record.endTime - record.startTime) / record.completedContainers / 1000 
      : 0,
    logs: record.logs.map(log => ({
      ...log,
      timestamp: new Date(log.timestamp).toISOString(),
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
    return {
      ...data,
      startTime: new Date(data.startTime).getTime(),
      endTime: data.endTime ? new Date(data.endTime).getTime() : undefined,
      logs: data.logs.map((log: OperationLog) => ({
        ...log,
        timestamp: new Date(log.timestamp).getTime(),
      })),
    };
  } catch (e) {
    console.error('Failed to parse replay data:', e);
    return null;
  }
};

export const formatTime = (seconds: number): string => {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
};

export const generateJobRecordId = (): string => {
  return `REC-${Date.now()}`;
};
