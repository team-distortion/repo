import { useState } from 'react';
import { Building2, Tags, Users } from 'lucide-react';
import DepartmentsTab from './DepartmentsTab';
import CategoriesTab from './CategoriesTab';
import EmployeeTab from './EmployeeTab';

export default function OrganizationSetup() {
  const [activeTab, setActiveTab] = useState('Departments');

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in duration-500">
      
      {/* Page Header */}
      <div>
        <h2 className="text-3xl font-bold text-white tracking-tight">Organization Setup</h2>
        <p className="text-slate-400 mt-2 text-sm">Manage your company's departments, asset categories, and employee directory.</p>
      </div>

      {/* Tabs Row */}
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
      </div>

      {/* Content Container */}
      <div className="glass-panel rounded-3xl overflow-hidden shadow-2xl border border-slate-700/60 relative bg-slate-800/40">
        {/* Subtle top glow */}
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-emerald-500/50 to-transparent"></div>

        {activeTab === 'Departments' && <DepartmentsTab />}
        {activeTab === 'Categories' && <CategoriesTab />}
        {activeTab === 'Employee' && <EmployeeTab />}
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
