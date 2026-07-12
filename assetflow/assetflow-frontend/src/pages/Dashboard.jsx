import { useSelector } from 'react-redux';
import { Package, Calendar, AlertCircle, Wrench, ArrowRightLeft, Clock, Activity, Plus } from 'lucide-react';

export default function Dashboard() {
  const { role } = useSelector(state => state.auth);

  return (
    <div className="space-y-8 animate-in fade-in duration-500 max-w-5xl">
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-3xl font-bold text-white">Dashboard</h2>
        </div>
      </div>

      <div className="space-y-6">
        <h3 className="text-xl font-semibold text-white border-b border-slate-700 pb-2">Today's Overview</h3>
        
        {/* Top Row KPIs */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <KpiCard title="Available" value="128" icon={Package} color="text-emerald-400" bg="bg-emerald-400/10" />
          <KpiCard title="Allocated" value="76" icon={Package} color="text-blue-400" bg="bg-blue-400/10" />
          <KpiCard title="Maintenance" value="4" icon={Wrench} color="text-amber-400" bg="bg-amber-400/10" />
        </div>

        {/* Middle Row KPIs */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <KpiCard title="Active Bookings" value="4" icon={Calendar} color="text-indigo-400" bg="bg-indigo-400/10" />
          <KpiCard title="Pending Transfers" value="8" icon={ArrowRightLeft} color="text-purple-400" bg="bg-purple-400/10" />
          <KpiCard title="Upcoming returns" value="12" icon={Clock} color="text-teal-400" bg="bg-teal-400/10" />
        </div>

        {/* Alert Banner */}
        <div className="bg-red-900/40 border border-red-500/50 rounded-xl p-4 flex items-center gap-3 text-red-400 shadow-[0_0_15px_rgba(239,68,68,0.1)]">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <p className="font-medium">3 assets overdue for return - flagged for follow-up</p>
        </div>

        {/* Quick Actions */}
        <div className="flex flex-wrap gap-4 pt-2">
           {['Admin', 'Asset Manager'].includes(role) && (
              <button className="bg-transparent border border-emerald-500 text-emerald-400 hover:bg-emerald-500/10 px-6 py-2.5 rounded-full font-medium transition-all flex items-center gap-2">
                <Plus className="w-4 h-4" /> register asset
              </button>
           )}
           <button className="bg-transparent border border-slate-500 text-slate-300 hover:bg-slate-800 px-6 py-2.5 rounded-full font-medium transition-all">
             Book resource
           </button>
           <button className="bg-transparent border border-slate-500 text-slate-300 hover:bg-slate-800 px-6 py-2.5 rounded-full font-medium transition-all">
             Raise requests
           </button>
        </div>
      </div>

      <div className="pt-6">
        <h3 className="text-xl font-semibold text-white mb-4">Recent Activity</h3>
        <div className="space-y-3">
          <ActivityItem 
            text="Laptop AF-0114 - allocated to Priya Shah - IT dept"
          />
          <ActivityItem 
            text="Room B2 - booking confirmed - 2:00 to 3:00 PM"
          />
          <ActivityItem 
            text="Projector AF-0062 - maintenance resolved"
          />
        </div>
      </div>
    </div>
  );
}

function KpiCard({ title, value, icon: Icon, color, bg, border = 'border-slate-700' }) {
  return (
    <div className={`glass-panel p-5 rounded-2xl ${border} transition-transform hover:-translate-y-1 duration-300`}>
      <div className="flex justify-between items-start">
        <div>
          <p className="text-slate-400 text-sm font-medium">{title}</p>
          <h3 className="text-3xl font-bold mt-2 text-white">{value}</h3>
        </div>
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${bg}`}>
          <Icon className={`w-5 h-5 ${color}`} />
        </div>
      </div>
    </div>
  );
}

function ActivityItem({ text }) {
  return (
    <div className="flex items-center gap-3 text-slate-300 py-1">
      <div className="w-1.5 h-1.5 rounded-full bg-slate-500 flex-shrink-0" />
      <p className="text-[15px]">{text}</p>
    </div>
  );
}
