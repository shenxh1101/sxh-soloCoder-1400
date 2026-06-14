import { useCallback, useRef, useEffect } from 'react';
import { useSimulationStore } from '../store/useSimulationStore';
import { OperationLog } from '../types';

export const useReplayEngine = () => {
  const {
    mode,
    isPlaying,
    isPaused,
    currentTime,
    playbackSpeed,
    currentJobRecord,
    replayLogIndex,
    incrementReplayLogIndex,
    resetReplayLogIndex,
    updateTime,
  } = useSimulationStore();

  const lastLogTime = useRef(0);
  const isReplaying = useRef(false);

  const startReplay = useCallback(() => {
    if (!currentJobRecord || currentJobRecord.logs.length === 0) return;
    
    resetReplayLogIndex();
    lastLogTime.current = 0;
    isReplaying.current = true;
  }, [currentJobRecord, resetReplayLogIndex]);

  const processReplayStep = useCallback(() => {
    if (!currentJobRecord || !isReplaying.current) return;
    if (mode !== 'REPLAY' || !isPlaying || isPaused) return;

    const logs = currentJobRecord.logs;
    if (replayLogIndex >= logs.length) {
      isReplaying.current = false;
      return;
    }

    const currentLog: OperationLog = logs[replayLogIndex];
    const nextLog: OperationLog | undefined = logs[replayLogIndex + 1];

    if (nextLog) {
      const timeDiff = (nextLog.timestamp - currentLog.timestamp) / 1000 / playbackSpeed;
      
      if (currentTime - lastLogTime.current >= timeDiff) {
        lastLogTime.current = currentTime;
        incrementReplayLogIndex();
      }
    } else {
      incrementReplayLogIndex();
      isReplaying.current = false;
    }
  }, [currentJobRecord, mode, isPlaying, isPaused, currentTime, playbackSpeed, replayLogIndex, incrementReplayLogIndex]);

  useEffect(() => {
    if (mode === 'REPLAY' && isPlaying && !isPaused && isReplaying.current) {
      const interval = setInterval(() => {
        processReplayStep();
      }, 100);
      return () => clearInterval(interval);
    }
  }, [mode, isPlaying, isPaused, processReplayStep]);

  const getCurrentLog = useCallback((): OperationLog | null => {
    if (!currentJobRecord) return null;
    return currentJobRecord.logs[replayLogIndex] || null;
  }, [currentJobRecord, replayLogIndex]);

  const getProgress = useCallback((): number => {
    if (!currentJobRecord || currentJobRecord.logs.length === 0) return 0;
    return (replayLogIndex / currentJobRecord.logs.length) * 100;
  }, [currentJobRecord, replayLogIndex]);

  return {
    startReplay,
    processReplayStep,
    getCurrentLog,
    getProgress,
    isReplaying: isReplaying.current,
  };
};
