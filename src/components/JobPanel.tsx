import { Package, Ship, ChevronDown, CheckCircle2, Clock, AlertTriangle } from 'lucide-react';
import { useSimulationStore } from '../store/useSimulationStore';
import { Container } from '../types';
import { formatTime } from '../utils/exportUtils';

export const JobPanel = () => {
  const { 
    jobOrders, 
    selectedJobOrderId, 
    selectJobOrder, 
    activeContainers, 
    currentJobRecord,
    isPlaying,
    currentContainerIndex,
  } = useSimulationStore();

  const selectedJobOrder = jobOrders.find(j => j.id === selectedJobOrderId);

  const getContainerStatusColor = (container: Container) => {
    switch (container.status) {
      case 'STORED': return 'bg-green-500';
      case 'ON_CRANE': return 'bg-yellow-500';
      case 'ON_TRUCK': return 'bg-blue-500';
      case 'ON_SHIP': return 'bg-gray-500';
      default: return 'bg-gray-400';
    }
  };

  const getContainerStatusText = (container: Container) => {
    switch (container.status) {
      case 'STORED': return '已堆存';
      case 'ON_CRANE': return '岸桥吊运中';
      case 'ON_TRUCK': return '集卡运输中';
      case 'ON_SHIP': return '待卸船';
      default: return '待处理';
    }
  };

  return (
    <div className="absolute top-4 left-4 w-80 bg-slate-900/90 backdrop-blur-md rounded-xl shadow-2xl border border-slate-700/50 overflow-hidden">
      <div className="p-4 bg-gradient-to-r from-orange-600 to-orange-500">
        <div className="flex items-center gap-3">
          <Ship className="w-6 h-6 text-white" />
          <h2 className="text-lg font-bold text-white" style={{ fontFamily: "'Oswald', sans-serif" }}>
            卸船作业单管理
          </h2>
        </div>
      </div>

      <div className="p-4 space-y-4">
        <div className="relative">
          <label className="block text-sm font-medium text-slate-300 mb-2">
            选择作业单
          </label>
          <div className="relative">
            <select
              value={selectedJobOrderId || ''}
              onChange={(e) => selectJobOrder(e.target.value || null)}
              disabled={isPlaying}
              className="w-full bg-slate-800/80 text-white px-4 py-3 pr-10 rounded-lg border border-slate-600/50 focus:outline-none focus:ring-2 focus:ring-orange-500 disabled:opacity-50 disabled:cursor-not-allowed appearance-none"
            >
              <option value="">-- 请选择作业单 --</option>
              {jobOrders.map(job => (
                <option key={job.id} value={job.id}>
                  {job.id} - {job.shipName}
                </option>
              ))}
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 pointer-events-none" />
          </div>
        </div>

        {selectedJobOrder && (
          <div className="bg-slate-800/50 rounded-lg p-3 border border-slate-700/50">
            <div className="flex items-center gap-2 mb-3">
              <Package className="w-5 h-5 text-orange-400" />
              <span className="font-semibold text-white">{selectedJobOrder.shipName}</span>
            </div>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div className="text-slate-400">作业单编号:</div>
              <div className="text-white font-mono">{selectedJobOrder.id}</div>
              <div className="text-slate-400">集装箱数:</div>
              <div className="text-white font-mono">{selectedJobOrder.containers.length} 箱</div>
              <div className="text-slate-400">创建时间:</div>
              <div className="text-white font-mono text-xs">
                {selectedJobOrder.createdAt.toLocaleDateString()}
              </div>
            </div>
          </div>
        )}

        {activeContainers.length > 0 && (
          <div className="space-y-2">
            <h3 className="text-sm font-semibold text-slate-300 flex items-center gap-2">
              <Package className="w-4 h-4" />
              集装箱列表 ({activeContainers.filter(c => c.status === 'STORED').length}/{activeContainers.length})
            </h3>
            <div className="max-h-64 overflow-y-auto space-y-2 pr-1">
              {activeContainers.map((container, index) => {
                const isCurrent = isPlaying && index === currentContainerIndex;
                const time = currentJobRecord?.containerTimes[container.id];
                return (
                  <div
                    key={container.id}
                    className={`p-3 rounded-lg border transition-all ${
                      isCurrent 
                        ? 'bg-orange-500/20 border-orange-500/50 shadow-lg shadow-orange-500/10' 
                        : container.status === 'STORED'
                        ? 'bg-green-500/10 border-green-500/30'
                        : 'bg-slate-800/50 border-slate-700/50'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${getContainerStatusColor(container)}`} />
                        <span className="text-xs font-mono text-slate-300">{container.id.slice(-6)}</span>
                        {isCurrent && (
                          <span className="px-2 py-0.5 bg-orange-500 text-white text-xs rounded-full animate-pulse">
                            作业中
                          </span>
                        )}
                        {container.status === 'STORED' && (
                          <CheckCircle2 className="w-4 h-4 text-green-500" />
                        )}
                      </div>
                      <span className={`px-2 py-0.5 rounded text-xs font-bold ${
                        container.size === '40ft' ? 'bg-orange-500/20 text-orange-400' : 'bg-blue-500/20 text-blue-400'
                      }`}>
                        {container.size}
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-1 text-xs">
                      <div className="text-slate-400">重量: {container.weight}吨</div>
                      <div className="text-slate-400">目标: {container.targetSlot}</div>
                      <div className="text-slate-400">类型: {container.isHigh ? '高箱' : '标准'}</div>
                      <div className="text-slate-400">{getContainerStatusText(container)}</div>
                    </div>
                    {time !== undefined && (
                      <div className="mt-2 flex items-center gap-1 text-xs text-slate-400">
                        <Clock className="w-3 h-3" />
                        耗时: {formatTime(time)}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
