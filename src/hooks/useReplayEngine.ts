import { useCallback, useRef, useEffect } from 'react';
import { useSimulationStore } from '../store/useSimulationStore';
import { OperationLog, ReplaySnapshot } from '../types';

export const useReplayEngine = () => {
  const {
    mode,
    isPlaying,
    isPaused,
    currentTime,
    playbackSpeed,
    currentJobRecord,
    replayLogIndex,
    setReplayLogIndex,
    applyReplaySnapshot,
    setPlaybackSpeed,
    pauseSimulation,
    resumeSimulation,
  } = useSimulationStore();

  const animationFrameRef = useRef<number | null>(null);
  const lastFrameTime = useRef<number>(0);

  const getLogs = useCallback((): OperationLog[] => {
    return currentJobRecord?.logs || [];
  }, [currentJobRecord]);

  const getTotalSteps = useCallback((): number => {
    return getLogs().length;
  }, [getLogs]);

  const getProgress = useCallback((): number => {
    const total = getTotalSteps();
    if (total === 0) return 0;
    return (replayLogIndex / total) * 100;
  }, [replayLogIndex, getTotalSteps]);

  const seekToStep = useCallback((stepIndex: number) => {
    const logs = getLogs();
    if (stepIndex < 0 || stepIndex >= logs.length) return;

    let snapshot: ReplaySnapshot | undefined;
    let targetIndex = stepIndex;

    for (let i = stepIndex; i >= 0; i--) {
      if (logs[i].snapshot) {
        snapshot = logs[i].snapshot;
        targetIndex = i;
        break;
      }
    }

    if (snapshot) {
      applyReplaySnapshot(snapshot);
      
      for (let i = (targetIndex + 1); i <= stepIndex; i++) {
        const log = logs[i];
        if (log.snapshot) {
          applyReplaySnapshot(log.snapshot);
        }
      }
    }

    setReplayLogIndex(stepIndex);
  }, [getLogs, applyReplaySnapshot, setReplayLogIndex]);

  const stepForward = useCallback(() => {
    const logs = getLogs();
    if (replayLogIndex >= logs.length - 1) return;
    
    const nextIndex = replayLogIndex + 1;
    const log = logs[nextIndex];
    
    if (log.snapshot) {
      applyReplaySnapshot(log.snapshot);
    }
    
    setReplayLogIndex(nextIndex);
  }, [replayLogIndex, getLogs, applyReplaySnapshot, setReplayLogIndex]);

  const stepBackward = useCallback(() => {
    if (replayLogIndex <= 0) return;
    
    const targetIndex = replayLogIndex - 1;
    seekToStep(targetIndex);
  }, [replayLogIndex, seekToStep]);

  const startReplay = useCallback(() => {
    if (!currentJobRecord || currentJobRecord.logs.length === 0) return;
    setReplayLogIndex(0);
    
    const firstLog = currentJobRecord.logs[0];
    if (firstLog.snapshot) {
      applyReplaySnapshot(firstLog.snapshot);
    }
    
    resumeSimulation();
  }, [currentJobRecord, setReplayLogIndex, applyReplaySnapshot, resumeSimulation]);

  const togglePause = useCallback(() => {
    if (isPaused) {
      resumeSimulation();
    } else {
      pauseSimulation();
    }
  }, [isPaused, pauseSimulation, resumeSimulation]);

  const playReplay = useCallback(() => {
    const logs = getLogs();
    if (logs.length === 0) return;

    if (replayLogIndex === 0) {
      const firstLog = logs[0];
      if (firstLog.snapshot) {
        applyReplaySnapshot(firstLog.snapshot);
      }
    }

    resumeSimulation();
    lastFrameTime.current = performance.now();

    const tick = (now: number) => {
      if (mode !== 'REPLAY' || !isPlaying || isPaused) return;

      const delta = (now - lastFrameTime.current) / 1000;
      lastFrameTime.current = now;

      const currentIndex = useSimulationStore.getState().replayLogIndex;
      if (currentIndex >= logs.length - 1) {
        pauseSimulation();
        return;
      }

      const stepsPerSecond = playbackSpeed * 2;
      const stepsToAdvance = delta * stepsPerSecond;

      if (stepsToAdvance >= 1) {
        const advanceCount = Math.floor(stepsToAdvance);
        for (let i = 0; i < advanceCount; i++) {
          const ci = useSimulationStore.getState().replayLogIndex;
          if (ci >= logs.length - 1) {
            pauseSimulation();
            return;
          }
          const nextLog = logs[ci + 1];
          if (nextLog.snapshot) {
            applyReplaySnapshot(nextLog.snapshot);
          }
          setReplayLogIndex(ci + 1);
        }
      }

      animationFrameRef.current = requestAnimationFrame(tick);
    };

    animationFrameRef.current = requestAnimationFrame(tick);
  }, [mode, isPlaying, isPaused, playbackSpeed, getLogs, applyReplaySnapshot, setReplayLogIndex, pauseSimulation, resumeSimulation]);

  const stopReplay = useCallback(() => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    pauseSimulation();
  }, [pauseSimulation]);

  useEffect(() => {
    if (mode === 'REPLAY' && isPlaying && !isPaused) {
      if (!animationFrameRef.current) {
        playReplay();
      }
    } else {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
    }
  }, [mode, isPlaying, isPaused, playReplay]);

  useEffect(() => {
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, []);

  const getCurrentLog = useCallback((): OperationLog | null => {
    const logs = getLogs();
    return logs[replayLogIndex] || null;
  }, [getLogs, replayLogIndex]);

  return {
    startReplay,
    playReplay,
    stopReplay,
    togglePause,
    stepForward,
    stepBackward,
    seekToStep,
    getCurrentLog,
    getProgress,
    getTotalSteps,
  };
};
