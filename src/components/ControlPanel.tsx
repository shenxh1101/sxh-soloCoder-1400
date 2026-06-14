import { Play, Pause, RotateCcw, Download, Upload, FastForward, SkipBack } from 'lucide-react';
import { useSimulationStore } from '../store/useSimulationStore';
import { downloadJSON } from '../utils/exportUtils';

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
  } = useSimulationStore();

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
        loadReplayData(content);
      } catch (err) {
        console.error('Failed to load replay data:', err);
        alert('无法解析回放文件');
      }
    };
    reader.readAsText(file);
  };

  const canStart = selectedJobOrderId && !isPlaying;

  return (
    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 w-auto bg-slate-900/90 backdrop-blur-md rounded-xl shadow-2xl border border-slate-700/50 overflow-hidden">
      <div className="p-4 flex items-center gap-4">
        <div className="flex items-center gap-2 bg-slate-800/50 rounded-lg p-1">
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

          {isPlaying && (
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

        {mode === 'REPLAY' && (
          <div className="flex items-center gap-2 bg-purple-500/20 px-3 py-1.5 rounded-lg border border-purple-500/30">
            <SkipBack className="w-4 h-4 text-purple-400" />
            <span className="text-sm text-purple-400 font-medium">回放模式</span>
          </div>
        )}
      </div>

      {!selectedJobOrderId && !isPlaying && (
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
