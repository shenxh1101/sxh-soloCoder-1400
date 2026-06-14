import { Activity, Gauge, TrendingUp, Clock, Container } from 'lucide-react';
import { useSimulationStore } from '../store/useSimulationStore';
import { formatTime } from '../utils/exportUtils';

export const MonitorPanel = () => {
  const { 
    currentJobRecord, 
    activeContainers, 
    crane, 
    trucks,
    isPlaying,
    currentTime,
    currentContainerIndex,
  } = useSimulationStore();

  const totalContainers = activeContainers.length;
  const completedContainers = currentJobRecord?.completedContainers || 0;
  const progress = totalContainers > 0 ? (completedContainers / totalContainers) * 100 : 0;
  
  const craneEfficiency = currentJobRecord?.craneEfficiency || 0;
  const totalTime = currentTime;

  const currentContainer = activeContainers[currentContainerIndex];

  const circumference = 2 * Math.PI * 45;
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  return (
    <div className="absolute top-4 right-4 w-80 bg-slate-900/90 backdrop-blur-md rounded-xl shadow-2xl border border-slate-700/50 overflow-hidden">
      <div className="p-4 bg-gradient-to-r from-blue-600 to-blue-500">
        <div className="flex items-center gap-3">
          <Activity className="w-6 h-6 text-white" />
          <h2 className="text-lg font-bold text-white" style={{ fontFamily: "'Oswald', sans-serif" }}>
            实时作业监控
          </h2>
        </div>
      </div>

      <div className="p-4 space-y-4">
        <div className="flex items-center justify-center py-4">
          <div className="relative w-36 h-36">
            <svg className="w-full h-full -rotate-90">
              <circle
                cx="72"
                cy="72"
                r="45"
                stroke="#334155"
                strokeWidth="10"
                fill="none"
              />
              <circle
                cx="72"
                cy="72"
                r="45"
                stroke="url(#progressGradient)"
                strokeWidth="10"
                fill="none"
                strokeLinecap="round"
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                className="transition-all duration-500"
              />
              <defs>
                <linearGradient id="progressGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#f97316" />
                  <stop offset="100%" stopColor="#22c55e" />
                </linearGradient>
              </defs>
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-3xl font-bold text-white">{Math.round(progress)}%</span>
              <span className="text-xs text-slate-400">作业进度</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="bg-slate-800/50 rounded-lg p-3 border border-slate-700/50">
            <div className="flex items-center gap-2 mb-1">
              <Container className="w-4 h-4 text-blue-400" />
              <span className="text-xs text-slate-400">完成数量</span>
            </div>
            <div className="text-2xl font-bold text-white">
              {completedContainers}
              <span className="text-sm text-slate-400 font-normal">/{totalContainers}</span>
            </div>
          </div>

          <div className="bg-slate-800/50 rounded-lg p-3 border border-slate-700/50">
            <div className="flex items-center gap-2 mb-1">
              <Clock className="w-4 h-4 text-green-400" />
              <span className="text-xs text-slate-400">已用时间</span>
            </div>
            <div className="text-2xl font-bold text-white font-mono">
              {formatTime(totalTime)}
            </div>
          </div>

          <div className="bg-slate-800/50 rounded-lg p-3 border border-slate-700/50">
            <div className="flex items-center gap-2 mb-1">
              <Gauge className="w-4 h-4 text-orange-400" />
              <span className="text-xs text-slate-400">岸桥效率</span>
            </div>
            <div className="text-2xl font-bold text-white">
              {craneEfficiency.toFixed(1)}
              <span className="text-sm text-slate-400 font-normal">箱/时</span>
            </div>
          </div>

          <div className="bg-slate-800/50 rounded-lg p-3 border border-slate-700/50">
            <div className="flex items-center gap-2 mb-1">
              <TrendingUp className="w-4 h-4 text-purple-400" />
              <span className="text-xs text-slate-400">平均耗时</span>
            </div>
            <div className="text-2xl font-bold text-white">
              {completedContainers > 0 ? formatTime(totalTime / completedContainers) : '--'}
              <span className="text-sm text-slate-400 font-normal">/箱</span>
            </div>
          </div>
        </div>

        {currentContainer && isPlaying && (
          <div className="bg-orange-500/10 rounded-lg p-3 border border-orange-500/30">
            <h3 className="text-sm font-semibold text-orange-400 mb-2 flex items-center gap-2">
              <div className="w-2 h-2 bg-orange-500 rounded-full animate-pulse" />
              当前作业集装箱
            </h3>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div>
                <span className="text-slate-400">编号:</span>
                <span className="text-white ml-2 font-mono">{currentContainer.id.slice(-6)}</span>
              </div>
              <div>
                <span className="text-slate-400">尺寸:</span>
                <span className="text-white ml-2">{currentContainer.size}</span>
              </div>
              <div>
                <span className="text-slate-400">重量:</span>
                <span className="text-white ml-2">{currentContainer.weight}吨</span>
              </div>
              <div>
                <span className="text-slate-400">目标:</span>
                <span className="text-white ml-2">{currentContainer.targetSlot}</span>
              </div>
            </div>
          </div>
        )}

        <div className="space-y-2">
          <h3 className="text-sm font-semibold text-slate-300">集卡状态</h3>
          <div className="space-y-2">
            {trucks.map(truck => (
              <div key={truck.id} className="flex items-center gap-3 bg-slate-800/30 rounded-lg p-2">
                <div className={`w-3 h-3 rounded-full ${
                  truck.status === 'IDLE' ? 'bg-blue-500' :
                  truck.status === 'MOVING_TO_CRANE' || truck.status === 'MOVING_TO_YARD' ? 'bg-green-500 animate-pulse' :
                  'bg-yellow-500'
                }`} />
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-white font-medium">{truck.id}</span>
                    <span className="text-xs px-2 py-0.5 rounded bg-slate-700/50 text-slate-300">
                      {truck.status === 'IDLE' ? '空闲' :
                       truck.status === 'MOVING_TO_CRANE' ? '前往岸桥' :
                       truck.status === 'MOVING_TO_YARD' ? '运往堆场' :
                       truck.status === 'LOADING' ? '装车中' :
                       truck.status === 'UNLOADING' ? '卸车中' : '返回中'}
                    </span>
                  </div>
                  {currentJobRecord?.truckUtilizations[truck.id] !== undefined && (
                    <div className="mt-1 h-1.5 bg-slate-700 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-gradient-to-r from-blue-500 to-green-500 rounded-full transition-all"
                        style={{ width: `${currentJobRecord.truckUtilizations[truck.id]}%` }}
                      />
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
