import { useState } from 'react';
import { Building2, Tags, Users } from 'lucide-react';
import DepartmentsTab from './DepartmentsTab';
import CategoriesTab from './CategoriesTab';
import EmployeeTab from './EmployeeTab';
import Card from '../../components/ui/Card';

export default function OrganizationSetup() {
  const [activeTab, setActiveTab] = useState('Departments');

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-[36px] font-semibold leading-[1.15] text-[var(--color-text)] tracking-tight">
          Organization Setup
        </h1>
        <p className="text-[14px] text-[var(--color-text-secondary)] mt-1">
          Manage company departments, asset category taxonomy, and user accounts
        </p>
      </div>

      {/* Segmented Control Tabs */}
      <div className="inline-flex bg-[var(--color-surface-2)] p-1 rounded-xl border border-[var(--color-border)]">
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
          label="Employees" 
          icon={Users}
          isActive={activeTab === 'Employee'} 
          onClick={() => setActiveTab('Employee')} 
        />
      </div>

      {/* Main Content Surface */}
      <Card className="p-0 overflow-hidden">
        {activeTab === 'Departments' && <DepartmentsTab />}
        {activeTab === 'Categories' && <CategoriesTab />}
        {activeTab === 'Employee' && <EmployeeTab />}
      </Card>
    </div>
  );
}

function TabButton({ label, icon: Icon, isActive, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`h-9 px-4 rounded-lg text-[13px] font-medium transition-all duration-150 ease-out flex items-center gap-2 select-none ${
        isActive 
          ? 'bg-[var(--color-primary-tint)] text-[var(--color-primary)] shadow-surface-sm border border-[var(--color-primary)]/40' 
          : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text)] hover:bg-[var(--color-surface-3)]'
      }`}
    >
      <Icon className="w-4 h-4" strokeWidth={1.75} />
      {label}
    </button>
  );
}
