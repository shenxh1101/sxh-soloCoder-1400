import { AlertTriangle, X } from 'lucide-react';
import { useSimulationStore } from '../store/useSimulationStore';

export const ViolationModal = () => {
  const violationMessage = useSimulationStore(s => s.violationMessage);
  const setViolationMessage = useSimulationStore(s => s.setViolationMessage);
  const pauseSimulation = useSimulationStore(s => s.pauseSimulation);

  if (!violationMessage) return null;

  const handleClose = () => {
    setViolationMessage(null);
    pauseSimulation();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div 
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={handleClose}
      />
      
      <div className="relative bg-slate-900 rounded-2xl shadow-2xl border border-red-500/50 w-full max-w-md mx-4 overflow-hidden animate-in fade-in zoom-in-95 duration-300">
        <div className="bg-gradient-to-r from-red-600 to-red-500 p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                <AlertTriangle className="w-7 h-7 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white" style={{ fontFamily: "'Oswald', sans-serif" }}>
                  堆垛规则违规
                </h2>
                <p className="text-red-100 text-sm">操作已被阻止</p>
              </div>
            </div>
            <button
              onClick={handleClose}
              className="text-white/70 hover:text-white transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        <div className="p-6">
          <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 mb-6">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="text-red-400 font-semibold mb-2">违规详情</h3>
                <p className="text-white text-sm leading-relaxed">{violationMessage}</p>
              </div>
            </div>
          </div>

          <div className="bg-slate-800/50 rounded-xl p-4 mb-6">
            <h3 className="text-slate-300 font-semibold mb-3 flex items-center gap-2">
              <span className="w-1.5 h-1.5 bg-orange-500 rounded-full" />
              堆场堆垛规则说明
            </h3>
            <ul className="space-y-2 text-sm text-slate-400">
              <li className="flex items-start gap-2">
                <span className="text-orange-400">•</span>
                <span><strong className="text-slate-300">高箱不能压矮箱:</strong> 40尺或高箱必须放在同类型或更高的箱子上面</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-orange-400">•</span>
                <span><strong className="text-slate-300">重量由上到下递减:</strong> 同一列中较重的箱子必须放在较轻的箱子下面</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-orange-400">•</span>
                <span><strong className="text-slate-300">底层优先:</strong> 必须从底层开始堆放，禁止悬空放置</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-orange-400">•</span>
                <span><strong className="text-slate-300">40尺箱占两列:</strong> 40尺集装箱需要占用相邻的两个列位</span>
              </li>
            </ul>
          </div>

          <button
            onClick={handleClose}
            className="w-full py-3 bg-red-600 hover:bg-red-500 text-white font-semibold rounded-xl transition-all shadow-lg shadow-red-500/20 hover:shadow-red-500/30"
          >
            我已知晓，调整作业计划
          </button>
        </div>
      </div>
    </div>
  );
};
