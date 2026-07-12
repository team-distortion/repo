import { useState, useEffect } from 'react';
import { ChevronRight } from 'lucide-react';
import { api } from '../../utils/api';

export default function DepartmentsTab() {
  const [departments, setDepartments] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        setError(null);
        // Fetch departments and users (for mapping head names)
        const [deptsRes, usersRes] = await Promise.all([
          api.get('/api/departments'),
          api.get('/api/users'),
        ]);

        setDepartments(deptsRes.data || []);
        setUsers(usersRes.data || []);
      } catch (err) {
        setError(err.message || 'Failed to fetch departments');
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  const getUserName = (userId) => {
    if (!userId) return '--';
    const user = users.find((u) => u.id === userId || u.userId === userId);
    return user ? user.name : '--';
  };

  const getParentDeptName = (parentId) => {
    if (!parentId) return '--';
    const dept = departments.find((d) => d.id === parentId);
    return dept ? dept.name : '--';
  };

  if (loading) {
    return (
      <div className="p-20 text-center text-slate-400">
        <div className="animate-spin inline-block w-8 h-8 border-[3px] border-current border-t-transparent text-emerald-500 rounded-full mb-4" role="status" aria-label="loading"></div>
        <p>Loading departments...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-12 text-center">
        <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-2xl max-w-md mx-auto">
          <p className="font-semibold">Error Loading Departments</p>
          <p className="text-sm mt-1">{error}</p>
        </div>
      </div>
    );
  }

  return (
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
                      {getUserName(dept.headUserId).charAt(0).toUpperCase()}
                    </div>
                    <span className="text-slate-300 capitalize text-sm">{getUserName(dept.headUserId)}</span>
                  </div>
                </td>
                <td className="py-5 px-8 text-slate-400 text-sm">{getParentDeptName(dept.parentId)}</td>
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
            {departments.length === 0 && (
              <tr>
                <td colSpan={5} className="py-12 px-8 text-center text-slate-500">
                  No departments found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      
      <div className="p-6 bg-slate-900/30 border-t border-slate-700/60 text-slate-400 text-sm flex items-center gap-3">
        <div className="w-2 h-2 rounded-full bg-emerald-500/50 shadow-[0_0_8px_rgba(16,185,129,0.5)]"></div>
        <p>Editing a department here automatically updates the picklist in the Allocation & Transfer screen.</p>
      </div>
    </div>
  );
}
