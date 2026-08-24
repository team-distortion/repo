import { useState, useEffect } from 'react';
import { api } from '../../utils/api';
import Badge from '../../components/ui/Badge';

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
    if (!userId) return '—';
    const user = users.find((u) => u.id === userId || u.userId === userId);
    return user ? user.name : '—';
  };

  const getParentDeptName = (parentId) => {
    if (!parentId) return '—';
    const dept = departments.find((d) => d.id === parentId);
    return dept ? dept.name : '—';
  };

  if (loading) {
    return (
      <div className="p-16 text-center text-[#98989D] text-[14px]">
        Loading department directory...
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8 text-center">
        <div className="bg-[#330C0A] border border-[#FF453A]/40 text-[#FF6961] p-4 rounded-xl max-w-md mx-auto text-[14px]">
          <p className="font-semibold">Error Loading Departments</p>
          <p className="text-[13px] mt-1">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse whitespace-nowrap">
          <thead>
            <tr className="h-11 border-b border-[#38383A] bg-[#202022]">
              <th className="px-4 text-[12px] font-medium text-[#98989D] uppercase tracking-wider">Department Name</th>
              <th className="px-4 text-[12px] font-medium text-[#98989D] uppercase tracking-wider">Department Head</th>
              <th className="px-4 text-[12px] font-medium text-[#98989D] uppercase tracking-wider">Parent Department</th>
              <th className="px-4 text-[12px] font-medium text-[#98989D] uppercase tracking-wider">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#38383A]">
            {departments.map((dept) => (
              <tr key={dept.id} className="h-14 hover:bg-[#202022] transition-colors">
                <td className="px-4 text-[14px] font-medium text-[#F5F5F7]">
                  {dept.name}
                </td>
                <td className="px-4 text-[14px] text-[#98989D]">
                  {getUserName(dept.headUserId)}
                </td>
                <td className="px-4 text-[14px] text-[#98989D]">
                  {getParentDeptName(dept.parentId)}
                </td>
                <td className="px-4">
                  <Badge status={dept.status}>{dept.status}</Badge>
                </td>
              </tr>
            ))}
            {departments.length === 0 && (
              <tr>
                <td colSpan={4} className="h-32 text-center text-[#6E6E73] text-[14px]">
                  No departments recorded in the system.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      
      <div className="p-4 bg-[#202022] border-t border-[#38383A] text-[12px] text-[#98989D] flex items-center gap-2">
        <div className="w-1.5 h-1.5 rounded-full bg-[#0A84FF]" />
        <p>Department structures automatically populate routing in the Allocation and Transfer modules.</p>
      </div>
    </div>
  );
}
