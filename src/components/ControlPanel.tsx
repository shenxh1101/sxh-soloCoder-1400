import { Play, Pause, RotateCcw, Download, Upload, FastForward, SkipBack, SkipForward, ChevronLeft, ChevronRight, Edit3 } from 'lucide-react';
import { useSimulationStore } from '../store/useSimulationStore';
import { downloadJSON, parseReplayData } from '../utils/exportUtils';
import { useReplayEngine } from '../hooks/useReplayEngine';

export const ControlPanel = () => {
  const {
    isPlaying,
    isPaused,
    mode,
    playbackSpeed,
    selectedJobOrderId,
    currentJobRecord,
    startSimulation,
    pauseSimulation,
    resumeSimulation,
    resetSimulation,
    setPlaybackSpeed,
    exportJobRecord,
    loadReplayData,
    enterPlanMode,
  } = useSimulationStore();

  const replay = useReplayEngine();

  const handleExport = () => {
    if (!currentJobRecord) return;
    const json = exportJobRecord();
    const filename = `作业记录_${currentJobRecord.id}_${new Date().toISOString().slice(0, 10)}.json`;
    downloadJSON(json, filename);
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const content = event.target?.result as string;
        const parsed = parseReplayData(content);
        if (parsed) {
          loadReplayData(content);
        } else {
          alert('无法解析回放文件');
        }
      } catch (err) {
        console.error('Failed to load replay data:', err);
        alert('无法解析回放文件');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const canStart = selectedJobOrderId && !isPlaying && mode === 'EDIT';
  const canPlan = selectedJobOrderId && !isPlaying && mode === 'EDIT';
  const isReplayMode = mode === 'REPLAY';

  const replayProgress = replay.getProgress();
  const replayTotalSteps = replay.getTotalSteps();
  const replayCurrentStep = useSimulationStore.getState().replayLogIndex;

  return (
    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 w-auto bg-slate-900/90 backdrop-blur-md rounded-xl shadow-2xl border border-slate-700/50 overflow-hidden">
      <div className="p-4 flex items-center gap-4">
        {isReplayMode ? (
          <>
            <div className="flex items-center gap-2 bg-purple-500/20 px-3 py-1.5 rounded-lg border border-purple-500/30">
              <SkipBack className="w-4 h-4 text-purple-400" />
              <span className="text-sm text-purple-400 font-medium">回放模式</span>
            </div>

            <div className="h-8 w-px bg-slate-700" />

            <div className="flex items-center gap-2">
              <button
                onClick={replay.stepBackward}
                disabled={replayCurrentStep <= 0}
                className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-white disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                title="单步后退"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>

              <button
                onClick={isPaused ? replay.playReplay : replay.stopReplay}
                className="flex items-center gap-2 px-4 py-2 rounded-lg font-medium bg-green-600 hover:bg-green-500 text-white transition-all"
              >
                {isPaused ? <Play className="w-5 h-5" /> : <Pause className="w-5 h-5" />}
                {isPaused ? '播放' : '暂停'}
              </button>

              <button
                onClick={replay.stepForward}
                disabled={replayCurrentStep >= replayTotalSteps - 1}
                className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-white disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                title="单步前进"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>

            <div className="w-64">
              <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
                <span>步骤 {replayCurrentStep + 1}/{replayTotalSteps}</span>
                <span>{Math.round(replayProgress)}%</span>
              </div>
              <input
                type="range"
                min={0}
                max={Math.max(replayTotalSteps - 1, 0)}
                value={replayCurrentStep}
                onChange={(e) => replay.seekToStep(Number(e.target.value))}
                className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-purple-500"
              />
            </div>

            <div className="flex items-center gap-2">
              <FastForward className="w-4 h-4 text-slate-400" />
              <select
                value={playbackSpeed}
                onChange={(e) => setPlaybackSpeed(Number(e.target.value))}
                className="bg-slate-800 text-white px-3 py-1.5 rounded-lg border border-slate-600/50 focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm"
              >
                <option value={0.5}>0.5x</option>
                <option value={1}>1x</option>
                <option value={2}>2x</option>
                <option value={3}>3x</option>
                <option value={5}>5x</option>
              </select>
            </div>

            <button
              onClick={resetSimulation}
              className="flex items-center gap-2 px-4 py-2 rounded-lg font-medium bg-red-600 hover:bg-red-500 text-white transition-all"
            >
              <RotateCcw className="w-5 h-5" />
              退出回放
            </button>
          </>
        ) : (
          <>
            <div className="flex items-center gap-2 bg-slate-800/50 rounded-lg p-1">
              <button
                onClick={() => canPlan && enterPlanMode()}
                disabled={!canPlan}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${
                  canPlan
                    ? 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-500/20'
                    : 'bg-slate-700/50 text-slate-500 cursor-not-allowed'
                }`}
              >
                <Edit3 className="w-5 h-5" />
                编排
              </button>

              <button
                onClick={() => canStart && startSimulation()}
                disabled={!canStart}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${
                  canStart
                    ? 'bg-green-600 hover:bg-green-500 text-white shadow-lg shadow-green-500/20'
                    : 'bg-slate-700/50 text-slate-500 cursor-not-allowed'
                }`}
              >
                <Play className="w-5 h-5" />
                开始作业
              </button>

              {isPlaying && mode === 'PLAYING' && (
                <>
                  <button
                    onClick={isPaused ? resumeSimulation : pauseSimulation}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg font-medium bg-yellow-600 hover:bg-yellow-500 text-white transition-all"
                  >
                    {isPaused ? <Play className="w-5 h-5" /> : <Pause className="w-5 h-5" />}
                    {isPaused ? '继续' : '暂停'}
                  </button>

                  <button
                    onClick={resetSimulation}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg font-medium bg-red-600 hover:bg-red-500 text-white transition-all"
                  >
                    <RotateCcw className="w-5 h-5" />
                    重置
                  </button>
                </>
              )}
            </div>

            <div className="h-8 w-px bg-slate-700" />

            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <FastForward className="w-4 h-4 text-slate-400" />
                <span className="text-sm text-slate-400">速度:</span>
                <select
                  value={playbackSpeed}
                  onChange={(e) => setPlaybackSpeed(Number(e.target.value))}
                  className="bg-slate-800 text-white px-3 py-1.5 rounded-lg border border-slate-600/50 focus:outline-none focus:ring-2 focus:ring-orange-500 text-sm"
                >
                  <option value={0.5}>0.5x</option>
                  <option value={1}>1x</option>
                  <option value={2}>2x</option>
                  <option value={3}>3x</option>
                  <option value={5}>5x</option>
                </select>
              </div>
            </div>

            <div className="h-8 w-px bg-slate-700" />

            <div className="flex items-center gap-2">
              <label className="flex items-center gap-2 px-4 py-2 rounded-lg font-medium bg-blue-600 hover:bg-blue-500 text-white transition-all cursor-pointer">
                <Upload className="w-5 h-5" />
                导入回放
                <input
                  type="file"
                  accept=".json"
                  onChange={handleImport}
                  className="hidden"
                />
              </label>

              <button
                onClick={handleExport}
                disabled={!currentJobRecord}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${
                  currentJobRecord
                    ? 'bg-purple-600 hover:bg-purple-500 text-white'
                    : 'bg-slate-700/50 text-slate-500 cursor-not-allowed'
                }`}
              >
                <Download className="w-5 h-5" />
                导出记录
              </button>
            </div>
          </>
        )}
      </div>

      {!isReplayMode && !selectedJobOrderId && !isPlaying && (
        <div className="px-4 pb-3">
          <div className="text-sm text-yellow-400/80 bg-yellow-500/10 px-3 py-2 rounded-lg border border-yellow-500/20 flex items-center gap-2">
            <span className="text-yellow-500">⚠</span>
            请先在左侧面板选择一个卸船作业单
          </div>
        </div>
      )}
    </div>
  );
};
