import { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Search, X } from 'lucide-react';
import { api } from '../../utils/api';

export default function EmployeeTab() {
  const [users, setUsers] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Modals state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);

  // Form states
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

  const getRoleLabel = (role) => {
    if (role === 'AssetManager') return 'Asset Manager';
    if (role === 'DepartmentHead') return 'Department Head';
    return role;
  };

  // Form handlers
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

    // Validate email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      setFormError('Please enter a valid email address.');
      return;
    }

    // Validate strong password
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
      password: '', // blank password unless resetting
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

    // Validate email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      setFormError('Please enter a valid email address.');
      return;
    }

    // Validate password ONLY if entered
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

  if (loading && users.length === 0) {
    return (
      <div className="p-20 text-center text-slate-400">
        <div className="animate-spin inline-block w-8 h-8 border-[3px] border-current border-t-transparent text-emerald-500 rounded-full mb-4" role="status" aria-label="loading"></div>
        <p>Loading employee directory...</p>
      </div>
    );
  }

  return (
    <div className="animate-in slide-in-from-bottom-4 duration-500 space-y-6">
      
      {/* Search and Tab-level Actions */}
      <div className="flex flex-col sm:flex-row gap-4 items-stretch sm:items-center justify-between p-6 pb-0">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-slate-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by name, email, department..."
            className="w-full bg-slate-900/60 border border-slate-700/60 rounded-xl pl-11 pr-4 py-2.5 text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all text-sm"
          />
        </div>
        
        <button
          onClick={openAddModal}
          className="bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-white px-5 py-2.5 rounded-xl text-sm font-semibold transition-all shadow-[0_0_15px_rgba(16,185,129,0.3)] hover:shadow-[0_0_25px_rgba(16,185,129,0.5)] flex items-center justify-center gap-2 hover:-translate-y-0.5"
        >
          <Plus className="w-4 h-4" /> Add Employee
        </button>
      </div>

      {error && (
        <div className="mx-6 bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-2xl">
          <p className="font-semibold">Error Loading Employee Directory</p>
          <p className="text-sm mt-1">{error}</p>
        </div>
      )}

      {/* Directory Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse whitespace-nowrap">
          <thead>
            <tr className="border-b border-slate-700/60 bg-slate-900/30">
              <th className="py-5 px-8 font-semibold text-slate-400 uppercase tracking-wider text-[11px]">Employee Name</th>
              <th className="py-5 px-8 font-semibold text-slate-400 uppercase tracking-wider text-[11px]">Email</th>
              <th className="py-5 px-8 font-semibold text-slate-400 uppercase tracking-wider text-[11px]">Department</th>
              <th className="py-5 px-8 font-semibold text-slate-400 uppercase tracking-wider text-[11px]">Role</th>
              <th className="py-5 px-8 font-semibold text-slate-400 uppercase tracking-wider text-[11px]">Status</th>
              <th className="py-5 px-8 font-semibold text-slate-400 uppercase tracking-wider text-[11px] text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-700/40">
            {filteredUsers.map((user) => {
              const uId = user.id || user.userId;
              return (
                <tr key={uId} className="hover:bg-slate-700/30 transition-colors group">
                  <td className="py-5 px-8">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-emerald-500 to-teal-500 flex items-center justify-center text-xs font-bold text-white shadow-md">
                        {user.name.charAt(0).toUpperCase()}
                      </div>
                      <span className="font-semibold text-slate-200 tracking-wide">{user.name}</span>
                    </div>
                  </td>
                  <td className="py-5 px-8 text-slate-300 text-sm font-medium">{user.email}</td>
                  <td className="py-5 px-8 text-slate-400 text-sm">{getDeptName(user.departmentId)}</td>
                  <td className="py-5 px-8 text-slate-400 text-sm">
                    <span className="bg-slate-900/80 px-2.5 py-1 rounded-lg text-slate-300 border border-slate-700/50">
                      {getRoleLabel(user.role)}
                    </span>
                  </td>
                  <td className="py-5 px-8">
                    <span className={`inline-flex items-center justify-center px-3 py-1 rounded-full text-[11px] uppercase tracking-wider font-bold border ${
                      user.status === 'Active' 
                        ? 'border-emerald-500/30 text-emerald-400 bg-emerald-500/10' 
                        : 'border-slate-500/30 text-slate-400 bg-slate-500/10'
                    }`}>
                      {user.status}
                    </span>
                  </td>
                  <td className="py-5 px-8 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => openEditModal(user)}
                        className="text-slate-400 hover:text-white transition-colors p-2 hover:bg-slate-600/50 rounded-xl"
                        title="Edit Employee"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteUser(uId)}
                        className="text-slate-400 hover:text-red-400 transition-colors p-2 hover:bg-red-950/30 rounded-xl"
                        title="Delete Employee"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
            {filteredUsers.length === 0 && (
              <tr>
                <td colSpan={6} className="py-12 px-8 text-center text-slate-500">
                  No employees found matching the filters.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Add Employee Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="glass-panel w-full max-w-lg rounded-3xl p-8 border border-slate-700/80 relative shadow-2xl bg-slate-900/90 max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setIsAddModalOpen(false)}
              className="absolute top-6 right-6 text-slate-400 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-xl font-bold text-white mb-6">Add New Employee</h3>

            {formError && (
              <div className="mb-6 bg-red-500/10 border border-red-500/20 text-red-400 p-3.5 rounded-xl text-sm font-medium">
                {formError}
              </div>
            )}

            <form onSubmit={handleAddSubmit} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1.5">Full Name</label>
                <input
                  type="text"
                  name="name"
                  required
                  value={formData.name}
                  onChange={handleInputChange}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all text-sm"
                  placeholder="e.g. Aditi Rao"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1.5">Email Address</label>
                <input
                  type="email"
                  name="email"
                  required
                  value={formData.email}
                  onChange={handleInputChange}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all text-sm"
                  placeholder="e.g. aditi@company.com"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1.5">Password</label>
                <input
                  type="password"
                  name="password"
                  required
                  value={formData.password}
                  onChange={handleInputChange}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all text-sm"
                  placeholder="At least 8 chars (1 Upper, 1 Lower, 1 Num)"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1.5">Department</label>
                  <select
                    name="departmentId"
                    value={formData.departmentId}
                    onChange={handleInputChange}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all text-sm"
                  >
                    <option value="">Unassigned</option>
                    {departments.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1.5">System Role</label>
                  <select
                    name="role"
                    value={formData.role}
                    onChange={handleInputChange}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all text-sm"
                  >
                    <option value="Employee">Employee</option>
                    <option value="DepartmentHead">Department Head</option>
                    <option value="AssetManager">Asset Manager</option>
                    <option value="Admin">Admin</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1.5">Status</label>
                <select
                  name="status"
                  value={formData.status}
                  onChange={handleInputChange}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all text-sm"
                >
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                </select>
              </div>

              <div className="flex gap-4 justify-end pt-4">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-5 py-2.5 rounded-xl border border-slate-700 text-slate-300 hover:text-white hover:bg-slate-800 transition-colors text-sm font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={formSubmitting}
                  className="bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-white px-6 py-2.5 rounded-xl text-sm font-semibold transition-all disabled:opacity-50"
                >
                  {formSubmitting ? 'Creating...' : 'Create Employee'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Employee Modal */}
      {isEditModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="glass-panel w-full max-w-lg rounded-3xl p-8 border border-slate-700/80 relative shadow-2xl bg-slate-900/90 max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setIsEditModalOpen(false)}
              className="absolute top-6 right-6 text-slate-400 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-xl font-bold text-white mb-6">Edit Employee: {selectedUser?.name}</h3>

            {formError && (
              <div className="mb-6 bg-red-500/10 border border-red-500/20 text-red-400 p-3.5 rounded-xl text-sm font-medium">
                {formError}
              </div>
            )}

            <form onSubmit={handleEditSubmit} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1.5">Full Name</label>
                <input
                  type="text"
                  name="name"
                  required
                  value={formData.name}
                  onChange={handleInputChange}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all text-sm"
                  placeholder="e.g. Aditi Rao"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1.5">Email Address</label>
                <input
                  type="email"
                  name="email"
                  required
                  value={formData.email}
                  onChange={handleInputChange}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all text-sm"
                  placeholder="e.g. aditi@company.com"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1.5">
                  Reset Password <span className="text-xs text-slate-500">(Leave blank to keep current)</span>
                </label>
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all text-sm"
                  placeholder="Enter new password if you want to reset"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1.5">Department</label>
                  <select
                    name="departmentId"
                    value={formData.departmentId}
                    onChange={handleInputChange}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all text-sm"
                  >
                    <option value="">Unassigned</option>
                    {departments.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1.5">System Role</label>
                  <select
                    name="role"
                    value={formData.role}
                    onChange={handleInputChange}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all text-sm"
                  >
                    <option value="Employee">Employee</option>
                    <option value="DepartmentHead">Department Head</option>
                    <option value="AssetManager">Asset Manager</option>
                    <option value="Admin">Admin</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1.5">Status</label>
                <select
                  name="status"
                  value={formData.status}
                  onChange={handleInputChange}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all text-sm"
                >
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                </select>
              </div>

              <div className="flex gap-4 justify-end pt-4">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="px-5 py-2.5 rounded-xl border border-slate-700 text-slate-300 hover:text-white hover:bg-slate-800 transition-colors text-sm font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={formSubmitting}
                  className="bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-white px-6 py-2.5 rounded-xl text-sm font-semibold transition-all disabled:opacity-50"
                >
                  {formSubmitting ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
