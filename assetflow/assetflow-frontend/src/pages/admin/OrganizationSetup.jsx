import { useState } from 'react';
import { Plus, Building2, Tags, Users, ChevronRight, X } from 'lucide-react';
import { useGetDepartmentsQuery, useCreateDepartmentMutation, useGetUsersQuery, useSignupMutation, useGetCategoriesQuery, useCreateCategoryMutation } from '../../store/apiSlice';

export default function OrganizationSetup() {
  const [activeTab, setActiveTab] = useState('Departments');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newDept, setNewDept] = useState({ name: '', head_user_id: '', parent: '' });
  const [newEmployee, setNewEmployee] = useState({ name: '', email: '', password: '', departmentId: '' });
  const [newCategory, setNewCategory] = useState({ name: '', description: '' });

  const { data: deptRes, isLoading: isDeptLoading } = useGetDepartmentsQuery();
  const { data: usersRes } = useGetUsersQuery();
  const { data: catRes, isLoading: isCatLoading } = useGetCategoriesQuery();
  
  const [createDepartment, { isLoading: isCreatingDept }] = useCreateDepartmentMutation();
  const [signup, { isLoading: isCreatingUser }] = useSignupMutation();
  const [createCategory, { isLoading: isCreatingCat }] = useCreateCategoryMutation();

  const departments = deptRes?.data || [];
  const users = usersRes?.data || [];
  const categories = catRes?.data || [];

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      if (activeTab === 'Departments') {
        await createDepartment(newDept).unwrap();
        setNewDept({ name: '', head_user_id: '', parent: '' });
      } else if (activeTab === 'Employee') {
        await signup(newEmployee).unwrap();
        setNewEmployee({ name: '', email: '', password: '', departmentId: '' });
      } else if (activeTab === 'Categories') {
        await createCategory(newCategory).unwrap();
        setNewCategory({ name: '', description: '' });
      }
      setIsModalOpen(false);
    } catch (err) {
      console.error('Failed to create', err);
      alert('Error creating record. Check console for details.');
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in duration-500 relative">
      
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
        
        <button 
          onClick={() => setIsModalOpen(true)}
          className="bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-white px-6 py-3 rounded-xl text-sm font-semibold transition-all shadow-[0_0_15px_rgba(16,185,129,0.3)] hover:shadow-[0_0_25px_rgba(16,185,129,0.5)] flex items-center gap-2 hover:-translate-y-0.5"
        >
          <Plus className="w-5 h-5" /> Add New
        </button>
      </div>

      {/* Content Container */}
      <div className="glass-panel rounded-3xl overflow-hidden shadow-2xl border border-slate-700/60 relative bg-slate-800/40">
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-emerald-500/50 to-transparent"></div>

        {activeTab === 'Departments' && (
          <div className="animate-in slide-in-from-bottom-4 duration-500">
            {isDeptLoading ? <div className="p-8 text-white">Loading...</div> : (
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
                  {departments.map((dept) => {
                    const headUser = users.find(u => u.id === dept.head_user_id);
                    const headName = headUser ? headUser.name : 'Unknown';
                    const initial = headName !== 'Unknown' ? headName.charAt(0).toUpperCase() : 'U';
                    
                    return (
                    <tr key={dept.id} className="hover:bg-slate-700/30 transition-colors group">
                      <td className="py-5 px-8">
                        <span className="font-semibold text-slate-200 tracking-wide">{dept.name}</span>
                      </td>
                      <td className="py-5 px-8">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center text-xs font-bold text-white shadow-md">
                            {initial}
                          </div>
                          <span className="text-slate-300 capitalize text-sm">{headName}</span>
                        </div>
                      </td>
                      <td className="py-5 px-8 text-slate-400 text-sm">{dept.parent || '--'}</td>
                      <td className="py-5 px-8">
                        <span className={`inline-flex items-center justify-center px-3 py-1 rounded-full text-[11px] uppercase tracking-wider font-bold border ${
                          dept.status !== 'Inactive' 
                            ? 'border-emerald-500/30 text-emerald-400 bg-emerald-500/10' 
                            : 'border-slate-500/30 text-slate-400 bg-slate-500/10'
                        }`}>
                          {dept.status || 'Active'}
                        </span>
                      </td>
                      <td className="py-5 px-8 text-right">
                        <button className="text-slate-500 hover:text-white transition-colors p-2 hover:bg-slate-600/50 rounded-xl opacity-0 group-hover:opacity-100">
                          <ChevronRight className="w-5 h-5" />
                        </button>
                      </td>
                    </tr>
                  )})}
                </tbody>
              </table>
            </div>
            )}
            
            <div className="p-6 bg-slate-900/30 border-t border-slate-700/60 text-slate-400 text-sm flex items-center gap-3">
              <div className="w-2 h-2 rounded-full bg-emerald-500/50 shadow-[0_0_8px_rgba(16,185,129,0.5)]"></div>
              <p>Editing a department here automatically updates the picklist in the Allocation & Transfer screen.</p>
            </div>
          </div>
        )}

        {activeTab === 'Categories' && (
          <div className="animate-in slide-in-from-bottom-4 duration-500">
            {isCatLoading ? <div className="p-8 text-white">Loading...</div> : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse whitespace-nowrap">
                <thead>
                  <tr className="border-b border-slate-700/60 bg-slate-900/30">
                    <th className="py-5 px-8 font-semibold text-slate-400 uppercase tracking-wider text-[11px] w-1/3">Category Name</th>
                    <th className="py-5 px-8 font-semibold text-slate-400 uppercase tracking-wider text-[11px] w-1/2">Description</th>
                    <th className="py-5 px-8 font-semibold text-slate-400 uppercase tracking-wider text-[11px] text-right w-1/6">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-700/40">
                  {categories.map((cat) => (
                    <tr key={cat.id} className="hover:bg-slate-700/30 transition-colors group">
                      <td className="py-5 px-8">
                        <span className="font-semibold text-slate-200 tracking-wide">{cat.name}</span>
                      </td>
                      <td className="py-5 px-8 text-slate-400 text-sm">
                        {cat.description || '--'}
                      </td>
                      <td className="py-5 px-8 text-right">
                        <button className="text-slate-500 hover:text-white transition-colors p-2 hover:bg-slate-600/50 rounded-xl opacity-0 group-hover:opacity-100">
                          <ChevronRight className="w-5 h-5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                  {categories.length === 0 && (
                    <tr>
                      <td colSpan="3" className="py-8 text-center text-slate-400">No categories found. Create one to get started.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            )}
            
            <div className="p-6 bg-slate-900/30 border-t border-slate-700/60 text-slate-400 text-sm flex items-center gap-3">
              <div className="w-2 h-2 rounded-full bg-emerald-500/50 shadow-[0_0_8px_rgba(16,185,129,0.5)]"></div>
              <p>Asset categories help organize your inventory and apply specific depreciation rules.</p>
            </div>
          </div>
        )}
        
        {activeTab === 'Employee' && (
          <div className="animate-in slide-in-from-bottom-4 duration-500">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse whitespace-nowrap">
                <thead>
                  <tr className="border-b border-slate-700/60 bg-slate-900/30">
                    <th className="py-5 px-8 font-semibold text-slate-400 uppercase tracking-wider text-[11px] w-1/4">Name</th>
                    <th className="py-5 px-8 font-semibold text-slate-400 uppercase tracking-wider text-[11px] w-1/4">Email</th>
                    <th className="py-5 px-8 font-semibold text-slate-400 uppercase tracking-wider text-[11px] w-1/4">Role</th>
                    <th className="py-5 px-8 font-semibold text-slate-400 uppercase tracking-wider text-[11px] w-1/4">Department</th>
                    <th className="py-5 px-8 font-semibold text-slate-400 uppercase tracking-wider text-[11px] w-1/6">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-700/40">
                  {users.map((user) => {
                    const dept = departments.find(d => d.id === user.departmentId);
                    return (
                    <tr key={user.userId} className="hover:bg-slate-700/30 transition-colors">
                      <td className="py-5 px-8 font-semibold text-slate-200">{user.name}</td>
                      <td className="py-5 px-8 text-slate-400">{user.email}</td>
                      <td className="py-5 px-8 text-slate-400">{user.role}</td>
                      <td className="py-5 px-8 text-slate-400">{dept?.name || '--'}</td>
                      <td className="py-5 px-8">
                        <span className={`inline-flex items-center justify-center px-3 py-1 rounded-full text-[11px] uppercase tracking-wider font-bold border ${
                          user.status === 'Active' 
                            ? 'border-emerald-500/30 text-emerald-400 bg-emerald-500/10' 
                            : 'border-slate-500/30 text-slate-400 bg-slate-500/10'
                        }`}>
                          {user.status}
                        </span>
                      </td>
                    </tr>
                  )})}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-slate-800 border border-slate-700 rounded-2xl p-6 w-full max-w-md shadow-2xl">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-white">Add New {activeTab.slice(0, -1)}</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleCreate} className="space-y-4">
              {activeTab === 'Departments' ? (
                <>
                  <div>
                    <label className="block text-sm text-slate-300 mb-1">Department Name</label>
                    <input required type="text" value={newDept.name} onChange={e => setNewDept({...newDept, name: e.target.value})} className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white" />
                  </div>
                  <div>
                    <label className="block text-sm text-slate-300 mb-1">Department Head</label>
                    <select value={newDept.head_user_id} onChange={e => setNewDept({...newDept, head_user_id: e.target.value})} className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white">
                      <option value="">Select a head</option>
                      {users.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                    </select>
                  </div>
                </>
              ) : activeTab === 'Employee' ? (
                <>
                  <div>
                    <label className="block text-sm text-slate-300 mb-1">Full Name</label>
                    <input required type="text" value={newEmployee.name} onChange={e => setNewEmployee({...newEmployee, name: e.target.value})} className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white" />
                  </div>
                  <div>
                    <label className="block text-sm text-slate-300 mb-1">Email Address</label>
                    <input required type="email" value={newEmployee.email} onChange={e => setNewEmployee({...newEmployee, email: e.target.value})} className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white" />
                  </div>
                  <div>
                    <label className="block text-sm text-slate-300 mb-1">Password</label>
                    <input required type="password" value={newEmployee.password} onChange={e => setNewEmployee({...newEmployee, password: e.target.value})} className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white" minLength="8" />
                  </div>
                  <div>
                    <label className="block text-sm text-slate-300 mb-1">Department</label>
                    <select required value={newEmployee.departmentId} onChange={e => setNewEmployee({...newEmployee, departmentId: e.target.value})} className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white">
                      <option value="">Select a department</option>
                      {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                    </select>
                  </div>
                </>
              ) : activeTab === 'Categories' ? (
                <>
                  <div>
                    <label className="block text-sm text-slate-300 mb-1">Category Name</label>
                    <input required type="text" value={newCategory.name} onChange={e => setNewCategory({...newCategory, name: e.target.value})} className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white" />
                  </div>
                  <div>
                    <label className="block text-sm text-slate-300 mb-1">Description</label>
                    <textarea value={newCategory.description} onChange={e => setNewCategory({...newCategory, description: e.target.value})} className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white h-24" />
                  </div>
                </>
              ) : (
                <div className="text-slate-400 text-sm">Form for {activeTab} not fully implemented in mock.</div>
              )}
              <button type="submit" disabled={isCreatingDept || isCreatingUser || isCreatingCat} className="w-full bg-emerald-500 hover:bg-emerald-400 text-white rounded-lg py-2.5 font-semibold transition-colors mt-4">
                {(isCreatingDept || isCreatingUser || isCreatingCat) ? 'Saving...' : 'Save'}
              </button>
            </form>
          </div>
        </div>
      )}
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
