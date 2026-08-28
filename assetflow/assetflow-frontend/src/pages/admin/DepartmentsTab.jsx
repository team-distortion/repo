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
      <div className="p-16 text-center text-[var(--color-text-secondary)] text-[14px]">
        Loading department directory...
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8 text-center">
        <div className="bg-[var(--color-error-tint)] border border-[var(--color-error)]/40 text-[var(--color-error)] p-4 rounded-xl max-w-md mx-auto text-[14px]">
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
            <tr className="h-11 border-b border-[var(--color-border)] bg-[var(--color-surface-2)]">
              <th className="px-4 text-[12px] font-medium text-[var(--color-text-secondary)] uppercase tracking-wider">Department Name</th>
              <th className="px-4 text-[12px] font-medium text-[var(--color-text-secondary)] uppercase tracking-wider">Department Head</th>
              <th className="px-4 text-[12px] font-medium text-[var(--color-text-secondary)] uppercase tracking-wider">Parent Department</th>
              <th className="px-4 text-[12px] font-medium text-[var(--color-text-secondary)] uppercase tracking-wider">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--color-border)]">
            {departments.map((dept) => (
              <tr key={dept.id} className="h-14 hover:bg-[var(--color-surface-2)] transition-colors">
                <td className="px-4 text-[14px] font-medium text-[var(--color-text)]">
                  {dept.name}
                </td>
                <td className="px-4 text-[14px] text-[var(--color-text-secondary)]">
                  {getUserName(dept.headUserId)}
                </td>
                <td className="px-4 text-[14px] text-[var(--color-text-secondary)]">
                  {getParentDeptName(dept.parentId)}
                </td>
                <td className="px-4">
                  <Badge status={dept.status}>{dept.status}</Badge>
                </td>
              </tr>
            ))}
            {departments.length === 0 && (
              <tr>
                <td colSpan={4} className="h-32 text-center text-[var(--color-text-tertiary)] text-[14px]">
                  No departments recorded in the system.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      
      <div className="p-4 bg-[var(--color-surface-2)] border-t border-[var(--color-border)] text-[12px] text-[var(--color-text-secondary)] flex items-center gap-2">
        <div className="w-1.5 h-1.5 rounded-full bg-[var(--color-primary)]" />
        <p>Department structures automatically populate routing in the Allocation and Transfer modules.</p>
      </div>
    </div>
  );
}
