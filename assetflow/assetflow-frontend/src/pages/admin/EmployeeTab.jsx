import { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Search } from 'lucide-react';
import { api } from '../../utils/api';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Badge from '../../components/ui/Badge';
import Modal from '../../components/ui/Modal';

export default function EmployeeTab() {
  const [users, setUsers] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    departmentId: '',
    role: 'Employee',
    status: 'Active',
  });
  const [formError, setFormError] = useState(null);
  const [formSubmitting, setFormSubmitting] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    try {
      setLoading(true);
      setError(null);
      const [usersRes, deptsRes] = await Promise.all([
        api.get('/api/users'),
        api.get('/api/departments'),
      ]);
      setUsers(usersRes.data || []);
      setDepartments(deptsRes.data || []);
    } catch (err) {
      setError(err.message || 'Failed to load employee directory');
    } finally {
      setLoading(false);
    }
  }

  const getDeptName = (deptId) => {
    if (!deptId) return 'Unassigned';
    const dept = departments.find((d) => d.id === deptId);
    return dept ? dept.name : 'Unassigned';
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const validatePassword = (password) => {
    if (password.length < 8) return 'Password must be at least 8 characters long.';
    if (!/[A-Z]/.test(password)) return 'Password must contain at least one uppercase letter.';
    if (!/[a-z]/.test(password)) return 'Password must contain at least one lowercase letter.';
    if (!/[0-9]/.test(password)) return 'Password must contain at least one number.';
    return null;
  };

  const openAddModal = () => {
    setFormData({
      name: '',
      email: '',
      password: '',
      departmentId: '',
      role: 'Employee',
      status: 'Active',
    });
    setFormError(null);
    setIsAddModalOpen(true);
  };

  const handleAddSubmit = async (e) => {
    e.preventDefault();
    setFormError(null);

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      setFormError('Please enter a valid email address.');
      return;
    }

    const passwordErr = validatePassword(formData.password);
    if (passwordErr) {
      setFormError(passwordErr);
      return;
    }

    setFormSubmitting(true);
    try {
      await api.post('/api/users', {
        name: formData.name,
        email: formData.email,
        password: formData.password,
        departmentId: formData.departmentId || null,
        role: formData.role,
        status: formData.status,
      });

      setIsAddModalOpen(false);
      fetchData();
    } catch (err) {
      setFormError(err.message || 'Failed to create employee');
    } finally {
      setFormSubmitting(false);
    }
  };

  const openEditModal = (user) => {
    setSelectedUser(user);
    setFormData({
      name: user.name,
      email: user.email,
      password: '',
      departmentId: user.departmentId || '',
      role: user.role,
      status: user.status,
    });
    setFormError(null);
    setIsEditModalOpen(true);
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    setFormError(null);

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      setFormError('Please enter a valid email address.');
      return;
    }

    if (formData.password) {
      const passwordErr = validatePassword(formData.password);
      if (passwordErr) {
        setFormError(passwordErr);
        return;
      }
    }

    setFormSubmitting(true);
    try {
      const payload = {
        name: formData.name,
        email: formData.email,
        departmentId: formData.departmentId || null,
        role: formData.role,
        status: formData.status,
      };
      if (formData.password) {
        payload.password = formData.password;
      }

      await api.put(`/api/users/${selectedUser.id || selectedUser.userId}`, payload);
      setIsEditModalOpen(false);
      fetchData();
    } catch (err) {
      setFormError(err.message || 'Failed to update employee');
    } finally {
      setFormSubmitting(false);
    }
  };

  const handleDeleteUser = async (userId) => {
    if (!window.confirm('Are you sure you want to delete this employee?')) return;
    try {
      await api.delete(`/api/users/${userId}`);
      fetchData();
    } catch (err) {
      alert(err.message || 'Failed to delete employee.');
    }
  };

  const filteredUsers = users.filter((user) => {
    const q = searchQuery.toLowerCase();
    return (
      user.name.toLowerCase().includes(q) ||
      user.email.toLowerCase().includes(q) ||
      getDeptName(user.departmentId).toLowerCase().includes(q)
    );
  });

  const selectCls = "w-full h-10 px-3 rounded-lg text-[14px] text-[var(--color-text)] bg-[var(--color-surface-2)] border border-[var(--color-border-strong)] focus:outline-none focus:border-[var(--color-primary)] focus:ring-[3px] focus:ring-[var(--color-primary)]/25 cursor-pointer";

  if (loading && users.length === 0) {
    return (
      <div className="p-16 text-center text-[var(--color-text-secondary)] text-[14px]">
        Loading employee directory...
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header controls */}
      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between p-4 pb-0">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--color-text-secondary)]" strokeWidth={1.75} />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by name, email, dept..."
            className="w-full h-10 bg-[var(--color-surface-2)] border border-[var(--color-border-strong)] rounded-lg pl-9 pr-3 text-[14px] text-[var(--color-text)] placeholder:text-[var(--color-text-tertiary)] focus:outline-none focus:border-[var(--color-primary)] focus:ring-[3px] focus:ring-[var(--color-primary)]/25 transition-colors"
          />
        </div>

        <Button onClick={openAddModal} variant="primary">
          <Plus className="w-4 h-4" strokeWidth={1.75} /> Add Employee
        </Button>
      </div>

      {error && (
        <div className="p-4 mx-4 bg-[var(--color-error-tint)] border border-[var(--color-error)]/40 text-[var(--color-error)] rounded-xl text-[13px]">
          {error}
        </div>
      )}

      {/* Table Surface */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse whitespace-nowrap">
          <thead>
            <tr className="h-11 border-b border-[var(--color-border)] bg-[var(--color-surface-2)]">
              <th className="px-4 text-[12px] font-medium text-[var(--color-text-secondary)] uppercase tracking-wider">Employee Name</th>
              <th className="px-4 text-[12px] font-medium text-[var(--color-text-secondary)] uppercase tracking-wider">Email Address</th>
              <th className="px-4 text-[12px] font-medium text-[var(--color-text-secondary)] uppercase tracking-wider">Department</th>
              <th className="px-4 text-[12px] font-medium text-[var(--color-text-secondary)] uppercase tracking-wider">Role</th>
              <th className="px-4 text-[12px] font-medium text-[var(--color-text-secondary)] uppercase tracking-wider">Status</th>
              <th className="px-4 text-[12px] font-medium text-[var(--color-text-secondary)] uppercase tracking-wider text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--color-border)]">
            {filteredUsers.map((user) => (
              <tr key={user.id || user.userId} className="h-14 hover:bg-[var(--color-surface-2)] transition-colors">
                <td className="px-4 text-[14px] font-medium text-[var(--color-text)]">
                  {user.name}
                </td>
                <td className="px-4 text-[13px] text-[var(--color-text-secondary)]">
                  {user.email}
                </td>
                <td className="px-4 text-[14px] text-[var(--color-text-secondary)]">
                  {getDeptName(user.departmentId)}
                </td>
                <td className="px-4 text-[13px] text-[var(--color-text)]">
                  {user.role}
                </td>
                <td className="px-4">
                  <Badge status={user.status}>{user.status}</Badge>
                </td>
                <td className="px-4 text-right">
                  <div className="flex items-center justify-end gap-1">
                    <button
                      onClick={() => openEditModal(user)}
                      className="p-1.5 text-[var(--color-text-secondary)] hover:text-[var(--color-primary)] hover:bg-[var(--color-surface-3)] rounded-lg transition-colors"
                      title="Edit employee"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteUser(user.id || user.userId)}
                      className="p-1.5 text-[var(--color-text-secondary)] hover:text-[var(--color-error)] hover:bg-[var(--color-surface-3)] rounded-lg transition-colors"
                      title="Delete employee"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {filteredUsers.length === 0 && (
              <tr>
                <td colSpan={6} className="h-32 text-center text-[var(--color-text-tertiary)] text-[14px]">
                  No employees match your search query.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Add Modal */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Add New Employee"
        size="md"
      >
        <form onSubmit={handleAddSubmit} className="space-y-4">
          {formError && (
            <div className="p-3 bg-[var(--color-error-tint)] border border-[var(--color-error)]/40 text-[var(--color-error)] rounded-lg text-[13px]">
              {formError}
            </div>
          )}

          <Input id="emp-name" label="Full Name" name="name" required value={formData.name} onChange={handleInputChange} placeholder="e.g. Jane Doe" />
          <Input id="emp-email" label="Email Address" type="email" name="email" required value={formData.email} onChange={handleInputChange} placeholder="e.g. jane.doe@company.com" />
          <Input id="emp-password" label="Initial Password" type="password" name="password" required value={formData.password} onChange={handleInputChange} helperText="At least 8 chars with uppercase, lowercase, and numbers." />

          <div className="space-y-1">
            <label className="block text-[13px] font-medium text-[var(--color-text-secondary)]">Department</label>
            <select name="departmentId" value={formData.departmentId} onChange={handleInputChange} className={selectCls}>
              <option value="">Unassigned</option>
              {departments.map((d) => (
                <option key={d.id} value={d.id}>{d.name}</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="block text-[13px] font-medium text-[var(--color-text-secondary)]">Role</label>
              <select name="role" value={formData.role} onChange={handleInputChange} className={selectCls}>
                <option value="Employee">Employee</option>
                <option value="DepartmentHead">Department Head</option>
                <option value="AssetManager">Asset Manager</option>
                <option value="Admin">Admin</option>
              </select>
            </div>
            <div className="space-y-1">
              <label className="block text-[13px] font-medium text-[var(--color-text-secondary)]">Status</label>
              <select name="status" value={formData.status} onChange={handleInputChange} className={selectCls}>
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
                <option value="Suspended">Suspended</option>
              </select>
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-[var(--color-border)]">
            <Button variant="ghost" onClick={() => setIsAddModalOpen(false)}>Cancel</Button>
            <Button type="submit" variant="primary" disabled={formSubmitting}>
              {formSubmitting ? 'Creating...' : 'Create Employee'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Edit Modal */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title="Edit Employee Account"
        size="md"
      >
        <form onSubmit={handleEditSubmit} className="space-y-4">
          {formError && (
            <div className="p-3 bg-[var(--color-error-tint)] border border-[var(--color-error)]/40 text-[var(--color-error)] rounded-lg text-[13px]">
              {formError}
            </div>
          )}

          <Input id="edit-emp-name" label="Full Name" name="name" required value={formData.name} onChange={handleInputChange} />
          <Input id="edit-emp-email" label="Email Address" type="email" name="email" required value={formData.email} onChange={handleInputChange} />
          <Input id="edit-emp-password" label="Reset Password (Optional)" type="password" name="password" value={formData.password} onChange={handleInputChange} placeholder="Leave blank to keep existing password" />

          <div className="space-y-1">
            <label className="block text-[13px] font-medium text-[var(--color-text-secondary)]">Department</label>
            <select name="departmentId" value={formData.departmentId} onChange={handleInputChange} className={selectCls}>
              <option value="">Unassigned</option>
              {departments.map((d) => (
                <option key={d.id} value={d.id}>{d.name}</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="block text-[13px] font-medium text-[var(--color-text-secondary)]">Role</label>
              <select name="role" value={formData.role} onChange={handleInputChange} className={selectCls}>
                <option value="Employee">Employee</option>
                <option value="DepartmentHead">Department Head</option>
                <option value="AssetManager">Asset Manager</option>
                <option value="Admin">Admin</option>
              </select>
            </div>
            <div className="space-y-1">
              <label className="block text-[13px] font-medium text-[var(--color-text-secondary)]">Status</label>
              <select name="status" value={formData.status} onChange={handleInputChange} className={selectCls}>
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
                <option value="Suspended">Suspended</option>
              </select>
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-[var(--color-border)]">
            <Button variant="ghost" onClick={() => setIsEditModalOpen(false)}>Cancel</Button>
            <Button type="submit" variant="primary" disabled={formSubmitting}>
              {formSubmitting ? 'Updating...' : 'Save Changes'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
