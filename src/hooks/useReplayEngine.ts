import { useCallback, useRef, useEffect } from 'react';
import { useSimulationStore } from '../store/useSimulationStore';
import { OperationLog } from '../types';

export const useReplayEngine = () => {
  const {
    mode,
    isPlaying,
    isPaused,
    playbackSpeed,
    currentJobRecord,
    replayLogIndex,
    setReplayLogIndex,
    applyReplaySnapshot,
    setPlaybackSpeed,
    pauseSimulation,
    resumeSimulation,
    setReplayPlaying,
  } = useSimulationStore();

  const animationFrameRef = useRef<number | null>(null);
  const lastFrameTime = useRef<number>(0);
  const stepAccumulator = useRef<number>(0);

  const getLogs = useCallback((): OperationLog[] => {
    return currentJobRecord?.logs || [];
  }, [currentJobRecord]);

  const getTotalSteps = useCallback((): number => {
    return getLogs().length;
  }, [getLogs]);

  const getProgress = useCallback((): number => {
    const total = getTotalSteps();
    if (total === 0) return 0;
    return (replayLogIndex / (total - 1 || 1)) * 100;
  }, [replayLogIndex, getTotalSteps]);

  const goToStep = useCallback((stepIndex: number) => {
    const logs = getLogs();
    if (logs.length === 0) return;
    if (stepIndex < 0) stepIndex = 0;
    if (stepIndex >= logs.length) stepIndex = logs.length - 1;

    let snapshotIdx = -1;
    for (let i = stepIndex; i >= 0; i--) {
      if (logs[i].snapshot) {
        snapshotIdx = i;
        break;
      }
    }

    if (snapshotIdx >= 0) {
      applyReplaySnapshot(logs[snapshotIdx].snapshot!);
      for (let i = snapshotIdx + 1; i <= stepIndex; i++) {
        if (logs[i].snapshot) {
          applyReplaySnapshot(logs[i].snapshot!);
        }
      }
    }

    setReplayLogIndex(stepIndex);
    stepAccumulator.current = 0;
  }, [getLogs, applyReplaySnapshot, setReplayLogIndex]);

  const seekToStep = useCallback((stepIndex: number) => {
    goToStep(stepIndex);
  }, [goToStep]);

  const stepForward = useCallback(() => {
    const logs = getLogs();
    if (logs.length === 0) return;
    if (replayLogIndex >= logs.length - 1) return;
    
    goToStep(replayLogIndex + 1);
  }, [replayLogIndex, getLogs, goToStep]);

  const stepBackward = useCallback(() => {
    if (replayLogIndex <= 0) return;
    goToStep(replayLogIndex - 1);
  }, [replayLogIndex, goToStep]);

  const startReplay = useCallback(() => {
    const logs = getLogs();
    if (logs.length === 0) return;
    goToStep(0);
    resumeSimulation();
  }, [getLogs, goToStep, resumeSimulation]);

  const restartReplay = useCallback(() => {
    goToStep(0);
    resumeSimulation();
  }, [goToStep, resumeSimulation]);

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

    if (replayLogIndex >= logs.length - 1) {
      goToStep(0);
    }

    resumeSimulation();
    stepAccumulator.current = 0;
    lastFrameTime.current = performance.now();

    const tick = (now: number) => {
      if (mode !== 'REPLAY') return;
      if (!useSimulationStore.getState().isPlaying) return;
      if (useSimulationStore.getState().isPaused) {
        animationFrameRef.current = requestAnimationFrame(tick);
        return;
      }

      const delta = (now - lastFrameTime.current) / 1000;
      lastFrameTime.current = now;

      const currentSteps = useSimulationStore.getState().replayLogIndex;
      if (currentSteps >= logs.length - 1) {
        pauseSimulation();
        animationFrameRef.current = requestAnimationFrame(tick);
        return;
      }

      const stepsPerSecond = playbackSpeed * 3;
      stepAccumulator.current += delta * stepsPerSecond;

      if (stepAccumulator.current >= 1) {
        const toAdvance = Math.floor(stepAccumulator.current);
        stepAccumulator.current -= toAdvance;

        let ci = useSimulationStore.getState().replayLogIndex;
        for (let i = 0; i < toAdvance; i++) {
          ci = useSimulationStore.getState().replayLogIndex;
          if (ci >= logs.length - 1) {
            pauseSimulation();
            break;
          }
          goToStep(ci + 1);
        }
      }

      animationFrameRef.current = requestAnimationFrame(tick);
    };

    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }
    animationFrameRef.current = requestAnimationFrame(tick);
  }, [mode, playbackSpeed, replayLogIndex, getLogs, goToStep, pauseSimulation, resumeSimulation]);

  const stopReplay = useCallback(() => {
    pauseSimulation();
  }, [pauseSimulation]);

  useEffect(() => {
    if (mode === 'REPLAY' && isPlaying && !isPaused) {
      playReplay();
    }
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
    };
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
    restartReplay,
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
