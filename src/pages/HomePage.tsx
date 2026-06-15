import { PortScene } from '../components/scene/PortScene';
import { JobPanel } from '../components/JobPanel';
import { MonitorPanel } from '../components/MonitorPanel';
import { ControlPanel } from '../components/ControlPanel';
import { ViolationModal } from '../components/ViolationModal';
import { useSimulationStore } from '../store/useSimulationStore';
import { useOperationController } from '../hooks/useOperationController';
import { useReplayEngine } from '../hooks/useReplayEngine';

export const HomePage = () => {
  const violationMessage = useSimulationStore(s => s.violationMessage);
  const mode = useSimulationStore(s => s.mode);
  
  useOperationController();
  useReplayEngine();

  return (
    <div className="relative w-full h-screen overflow-hidden bg-slate-950">
      <div className="absolute inset-0">
        <PortScene />
      </div>

      <div className="absolute inset-0 pointer-events-none">
        <div className="pointer-events-auto">
          <JobPanel />
        </div>
        <div className="pointer-events-auto">
          <MonitorPanel />
        </div>
        <div className="pointer-events-auto">
          <ControlPanel />
        </div>
      </div>

      <div className="absolute top-4 left-1/2 -translate-x-1/2 pointer-events-none">
        <div className="bg-slate-900/80 backdrop-blur-md px-6 py-3 rounded-full border border-slate-700/50 shadow-xl">
          <h1 
            className="text-2xl font-bold text-white tracking-wider"
            style={{ fontFamily: "'Oswald', sans-serif" }}
          >
            港口集装箱码头装卸作业模拟系统
          </h1>
        </div>
      </div>

      {mode !== 'EDIT' && (
        <div className="absolute top-4 left-1/2 translate-x-20 pointer-events-none">
          <div className={`px-3 py-1.5 rounded-full text-xs font-bold ${
            mode === 'PLAYING' ? 'bg-green-500/20 text-green-400 border border-green-500/30' :
            mode === 'REPLAY' ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30' :
            mode === 'PLAN' ? 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/30' :
            'bg-slate-700/50 text-slate-400'
          }`}>
            {mode === 'PLAYING' ? '▶ 作业中' : mode === 'REPLAY' ? '⏮ 回放中' : mode === 'PLAN' ? '✎ 编排中' : ''}
          </div>
        </div>
      )}

      <div className="absolute bottom-20 right-4 pointer-events-none">
        <div className="bg-slate-900/70 backdrop-blur-sm px-4 py-2 rounded-lg border border-slate-700/50 text-xs text-slate-400 space-y-1">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 bg-blue-500 rounded-full" />
            <span>20尺标准箱</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 bg-orange-500 rounded-full" />
            <span>40尺高箱</span>
          </div>
          <div className="mt-2 pt-2 border-t border-slate-700/50">
            <p className="text-slate-500">鼠标左键: 旋转视角</p>
            <p className="text-slate-500">鼠标滚轮: 缩放</p>
            <p className="text-slate-500">鼠标右键: 平移</p>
          </div>
        </div>
      </div>

      {violationMessage && <ViolationModal />}
    </div>
  );
};
