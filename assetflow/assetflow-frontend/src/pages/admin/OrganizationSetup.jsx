import { useState } from 'react';
import { Plus, Building2, Tags, Users, ChevronRight } from 'lucide-react';

export default function OrganizationSetup() {
  const [activeTab, setActiveTab] = useState('Departments');

  const departments = [
    { id: 1, name: 'Engineering', head: 'aditi rao', parent: '--', status: 'Active' },
    { id: 2, name: 'Facilities', head: 'rohan mehta', parent: '--', status: 'Active' },
    { id: 3, name: 'Field ops (east)', head: 'sana iqbal', parent: 'Field Ops', status: 'Inactive' },
  ];

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in duration-500">
      
      {/* Page Header */}
      <div>
        <h2 className="text-3xl font-bold text-white tracking-tight">Organization Setup</h2>
        <p className="text-slate-400 mt-2 text-sm">Manage your company's departments, asset categories, and employee directory.</p>
      </div>

      {/* Tabs and Actions Row */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        
        {/* Segmented Control Tabs */}
        <div className="flex bg-slate-900/60 p-1.5 rounded-2xl border border-slate-700/60 backdrop-blur-md shadow-lg shadow-black/20">
          <TabButton 
            label="Departments" 
            icon={Building2}
            isActive={activeTab === 'Departments'} 
            onClick={() => setActiveTab('Departments')} 
          />
          <TabButton 
            label="Categories" 
            icon={Tags}
            isActive={activeTab === 'Categories'} 
            onClick={() => setActiveTab('Categories')} 
          />
          <TabButton 
            label="Employee" 
            icon={Users}
            isActive={activeTab === 'Employee'} 
            onClick={() => setActiveTab('Employee')} 
          />
        </div>
        
        <button className="bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-white px-6 py-3 rounded-xl text-sm font-semibold transition-all shadow-[0_0_15px_rgba(16,185,129,0.3)] hover:shadow-[0_0_25px_rgba(16,185,129,0.5)] flex items-center gap-2 hover:-translate-y-0.5">
          <Plus className="w-5 h-5" /> Add New
        </button>
      </div>

      {/* Content Container */}
      <div className="glass-panel rounded-3xl overflow-hidden shadow-2xl border border-slate-700/60 relative bg-slate-800/40">
        {/* Subtle top glow */}
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-emerald-500/50 to-transparent"></div>

        {activeTab === 'Departments' && (
          <div className="animate-in slide-in-from-bottom-4 duration-500">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse whitespace-nowrap">
                <thead>
                  <tr className="border-b border-slate-700/60 bg-slate-900/30">
                    <th className="py-5 px-8 font-semibold text-slate-400 uppercase tracking-wider text-[11px] w-1/4">Department Name</th>
                    <th className="py-5 px-8 font-semibold text-slate-400 uppercase tracking-wider text-[11px] w-1/4">Department Head</th>
                    <th className="py-5 px-8 font-semibold text-slate-400 uppercase tracking-wider text-[11px] w-1/4">Parent Dept</th>
                    <th className="py-5 px-8 font-semibold text-slate-400 uppercase tracking-wider text-[11px] w-1/6">Status</th>
                    <th className="py-5 px-8 font-semibold text-slate-400 uppercase tracking-wider text-[11px] text-right w-1/12">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-700/40">
                  {departments.map((dept) => (
                    <tr key={dept.id} className="hover:bg-slate-700/30 transition-colors group">
                      <td className="py-5 px-8">
                        <span className="font-semibold text-slate-200 tracking-wide">{dept.name}</span>
                      </td>
                      <td className="py-5 px-8">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center text-xs font-bold text-white shadow-md">
                            {dept.head.charAt(0).toUpperCase()}
                          </div>
                          <span className="text-slate-300 capitalize text-sm">{dept.head}</span>
                        </div>
                      </td>
                      <td className="py-5 px-8 text-slate-400 text-sm">{dept.parent}</td>
                      <td className="py-5 px-8">
                        <span className={`inline-flex items-center justify-center px-3 py-1 rounded-full text-[11px] uppercase tracking-wider font-bold border ${
                          dept.status === 'Active' 
                            ? 'border-emerald-500/30 text-emerald-400 bg-emerald-500/10' 
                            : 'border-slate-500/30 text-slate-400 bg-slate-500/10'
                        }`}>
                          {dept.status}
                        </span>
                      </td>
                      <td className="py-5 px-8 text-right">
                        <button className="text-slate-500 hover:text-white transition-colors p-2 hover:bg-slate-600/50 rounded-xl opacity-0 group-hover:opacity-100">
                          <ChevronRight className="w-5 h-5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            <div className="p-6 bg-slate-900/30 border-t border-slate-700/60 text-slate-400 text-sm flex items-center gap-3">
              <div className="w-2 h-2 rounded-full bg-emerald-500/50 shadow-[0_0_8px_rgba(16,185,129,0.5)]"></div>
              <p>Editing a department here automatically updates the picklist in the Allocation & Transfer screen.</p>
            </div>
          </div>
        )}

        {activeTab === 'Categories' && (
          <div className="p-20 text-center animate-in slide-in-from-bottom-4 duration-500">
            <div className="w-20 h-20 bg-slate-900/80 rounded-2xl flex items-center justify-center mx-auto mb-6 border border-slate-700/50 shadow-inner">
              <Tags className="w-10 h-10 text-slate-500" />
            </div>
            <h3 className="text-xl font-semibold text-white mb-3">Asset Categories</h3>
            <p className="text-slate-400 max-w-md mx-auto text-sm leading-relaxed">Set up and manage hardware and software categories, including custom attributes and depreciation rules.</p>
          </div>
        )}
        
        {activeTab === 'Employee' && (
          <div className="p-20 text-center animate-in slide-in-from-bottom-4 duration-500">
            <div className="w-20 h-20 bg-slate-900/80 rounded-2xl flex items-center justify-center mx-auto mb-6 border border-slate-700/50 shadow-inner">
              <Users className="w-10 h-10 text-slate-500" />
            </div>
            <h3 className="text-xl font-semibold text-white mb-3">Employee Directory</h3>
            <p className="text-slate-400 max-w-md mx-auto text-sm leading-relaxed">Manage employee roles, access levels, and track assigned assets across your entire organization.</p>
          </div>
        )}
      </div>
    </div>
  );
}

function TabButton({ label, icon: Icon, isActive, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`px-5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-300 flex items-center gap-2.5 ${
        isActive 
          ? 'bg-slate-700/80 text-white shadow-sm ring-1 ring-slate-600/50' 
          : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
      }`}
    >
      <Icon className={`w-4 h-4 ${isActive ? 'text-emerald-400' : 'opacity-70'}`} />
      {label}
    </button>
  );
}
