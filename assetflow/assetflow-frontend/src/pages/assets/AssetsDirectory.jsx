import { useMemo, useState } from 'react';
import { useSelector } from 'react-redux';
import { Plus, Search } from 'lucide-react';

const mockAssets = [
  { id: 1, tag: 'AF-0012', name: 'Dell Laptop', serial: 'SN-DL-0012', category: 'Electronics', status: 'Allocated', location: 'bengaluru', department: 'Engineering' },
  { id: 2, tag: 'AF-0062', name: 'Projector', serial: 'SN-PJ-0062', category: 'Electronics', status: 'Maintenance', location: 'HQ floor 2', department: 'Facilities' },
  { id: 3, tag: 'AF-0201', name: 'Office chair', serial: 'SN-OC-0201', category: 'Furniture', status: 'Available', location: 'Warehouse', department: 'Facilities' },
  { id: 4, tag: 'AF-0114', name: 'Dell laptop', serial: 'SN-DL-0114', category: 'Electronics', status: 'Allocated', location: 'Engineering floor', department: 'Engineering' },
  { id: 5, tag: 'AF-0305', name: 'Conference Room B2', serial: 'RM-B2', category: 'Spaces', status: 'Reserved', location: 'HQ floor 2', department: 'Facilities' },
];

const categories = ['All', 'Electronics', 'Furniture', 'Spaces'];
const statuses = ['All', 'Available', 'Allocated', 'Maintenance', 'Reserved'];
const departments = ['All', 'Engineering', 'Facilities'];

const statusStyles = {
  Available: 'border-emerald-500/30 text-emerald-400 bg-emerald-500/10',
  Allocated: 'border-blue-500/30 text-blue-400 bg-blue-500/10',
  Maintenance: 'border-amber-500/30 text-amber-400 bg-amber-500/10',
  Reserved: 'border-purple-500/30 text-purple-400 bg-purple-500/10',
  Lost: 'border-red-500/30 text-red-400 bg-red-500/10',
  Retired: 'border-slate-500/30 text-slate-400 bg-slate-500/10',
  Disposed: 'border-slate-500/30 text-slate-400 bg-slate-500/10',
};

export default function AssetsDirectory() {
  const { role } = useSelector(state => state.auth);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');
  const [departmentFilter, setDepartmentFilter] = useState('All');

  const filteredAssets = useMemo(() => {
    const query = search.trim().toLowerCase();
    return mockAssets.filter((asset) => {
      const matchesSearch =
        !query ||
        asset.tag.toLowerCase().includes(query) ||
        asset.name.toLowerCase().includes(query) ||
        asset.serial.toLowerCase().includes(query);
      const matchesCategory = categoryFilter === 'All' || asset.category === categoryFilter;
      const matchesStatus = statusFilter === 'All' || asset.status === statusFilter;
      const matchesDepartment = departmentFilter === 'All' || asset.department === departmentFilter;
      return matchesSearch && matchesCategory && matchesStatus && matchesDepartment;
    });
  }, [search, categoryFilter, statusFilter, departmentFilter]);

  return (
    <div className="max-w-6xl mx-auto space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row gap-4 items-stretch sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by tag, serial, or QR code.."
            className="w-full bg-slate-900/50 border border-slate-700 rounded-xl pl-12 pr-4 py-3.5 text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all"
          />
        </div>

        {['Admin', 'Asset Manager'].includes(role) && (
          <button className="bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-white px-6 py-3.5 rounded-xl text-sm font-semibold transition-all shadow-[0_0_15px_rgba(16,185,129,0.3)] hover:shadow-[0_0_25px_rgba(16,185,129,0.5)] flex items-center justify-center gap-2 whitespace-nowrap">
            <Plus className="w-5 h-5" /> Register Asset
          </button>
        )}
      </div>

      <div className="flex flex-wrap gap-3">
        <FilterPill label="Category" value={categoryFilter} options={categories} onChange={setCategoryFilter} />
        <FilterPill label="Status" value={statusFilter} options={statuses} onChange={setStatusFilter} />
        <FilterPill label="Department" value={departmentFilter} options={departments} onChange={setDepartmentFilter} />
      </div>

      <div className="glass-panel rounded-3xl overflow-hidden shadow-2xl border border-slate-700/60 relative bg-slate-800/40">
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-blue-500/50 to-transparent" />

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse whitespace-nowrap">
            <thead>
              <tr className="border-b border-slate-700/60 bg-slate-900/30">
                <th className="py-5 px-8 font-semibold text-slate-400 uppercase tracking-wider text-[11px]">Tag</th>
                <th className="py-5 px-8 font-semibold text-slate-400 uppercase tracking-wider text-[11px]">Name</th>
                <th className="py-5 px-8 font-semibold text-slate-400 uppercase tracking-wider text-[11px]">Category</th>
                <th className="py-5 px-8 font-semibold text-slate-400 uppercase tracking-wider text-[11px]">Status</th>
                <th className="py-5 px-8 font-semibold text-slate-400 uppercase tracking-wider text-[11px]">Location</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700/40">
              {filteredAssets.map((asset) => (
                <tr key={asset.id} className="hover:bg-slate-700/30 transition-colors">
                  <td className="py-5 px-8">
                    <span className="font-mono font-semibold text-blue-400">{asset.tag}</span>
                  </td>
                  <td className="py-5 px-8 text-slate-200">{asset.name}</td>
                  <td className="py-5 px-8 text-slate-400">{asset.category}</td>
                  <td className="py-5 px-8">
                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-[11px] uppercase tracking-wider font-bold border ${statusStyles[asset.status]}`}>
                      {asset.status}
                    </span>
                  </td>
                  <td className="py-5 px-8 text-slate-400 capitalize">{asset.location}</td>
                </tr>
              ))}
              {filteredAssets.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-12 px-8 text-center text-slate-500">
                    No assets match your search or filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function FilterPill({ label, value, options, onChange }) {
  return (
    <div className="relative">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="appearance-none bg-slate-900/60 border border-slate-700 rounded-full pl-4 pr-10 py-2 text-sm text-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500/50 cursor-pointer hover:border-slate-600 transition-colors"
      >
        {options.map((opt) => (
          <option key={opt} value={opt}>
            {opt === 'All' ? label : opt}
          </option>
        ))}
      </select>
      <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 text-xs">▾</span>
    </div>
  );
}
