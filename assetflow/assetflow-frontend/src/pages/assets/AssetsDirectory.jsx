import { useMemo, useState } from 'react';
import { useSelector } from 'react-redux';
import { Plus, Search } from 'lucide-react';
import { 
  useGetAssetsQuery, 
  useCreateAssetMutation, 
  useGetCategoriesQuery, 
  useUploadAttachmentMutation 
} from '../../store/apiSlice';
import FileUploadDropzone from '../../components/ui/FileUploadDropzone';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Badge from '../../components/ui/Badge';
import Modal from '../../components/ui/Modal';

const categories = ['All', 'Laptops', 'Projectors', 'Electronics', 'Furniture'];
const statuses = ['All', 'Available', 'Allocated', 'Maintenance', 'Reserved'];
const departments = ['All', 'IT Support', 'Human Resources', 'Engineering', 'Facilities'];

export default function AssetsDirectory() {
  const { role } = useSelector(state => state.auth);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');
  const [departmentFilter, setDepartmentFilter] = useState('All');
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newAsset, setNewAsset] = useState({ 
    name: '', 
    categoryId: '', 
    serialNumber: '', 
    location: '', 
    acquisitionDate: new Date().toISOString().split('T')[0] 
  });
  const [photoFiles, setPhotoFiles] = useState([]);
  const [docFiles, setDocFiles] = useState([]);

  const { data: assetsResponse, isLoading, error } = useGetAssetsQuery({ pageSize: 100 });
  const { data: categoriesResponse } = useGetCategoriesQuery();
  const [createAsset, { isLoading: isCreating }] = useCreateAssetMutation();
  const [uploadAttachment, { isLoading: isUploading }] = useUploadAttachmentMutation();
  
  const rawAssets = assetsResponse?.data || [];
  const dbCategories = categoriesResponse?.data || [];
  
  const mappedAssets = useMemo(() => {
    return rawAssets.map(a => {
      const categoryObj = dbCategories.find(c => c.id === a.category_id);
      return {
        id: a.id,
        tag: a.asset_tag || a.tag || '',
        name: a.name || '',
        serial: a.serial_number || '',
        category: categoryObj ? categoryObj.name : 'Unknown',
        status: a.status || 'Available',
        location: a.location || 'Unknown',
        department: a.department || 'Unknown'
      };
    });
  }, [rawAssets, dbCategories]);

  const filteredAssets = useMemo(() => {
    const query = search.trim().toLowerCase();
    return mappedAssets.filter((asset) => {
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
  }, [search, categoryFilter, statusFilter, departmentFilter, mappedAssets]);

  const handleCreateAsset = async (e) => {
    e.preventDefault();
    try {
      const createdAssetResponse = await createAsset(newAsset).unwrap();
      const assetId = createdAssetResponse.data?.id || createdAssetResponse.id;
      
      const allFiles = [...photoFiles, ...docFiles];
      if (assetId && allFiles.length > 0) {
        for (const file of allFiles) {
          const formData = new FormData();
          formData.append('file', file);
          formData.append('entity_type', 'Asset');
          formData.append('entity_id', assetId);
          await uploadAttachment(formData).unwrap();
        }
      }

      setIsModalOpen(false);
      setNewAsset({ 
        name: '', 
        categoryId: '', 
        serialNumber: '', 
        location: '', 
        acquisitionDate: new Date().toISOString().split('T')[0] 
      });
      setPhotoFiles([]);
      setDocFiles([]);
    } catch (err) {
      console.error('Failed to create asset or upload attachments', err);
    }
  };

  if (isLoading) return <div className="text-[var(--color-text-secondary)] text-[14px] p-8">Loading assets...</div>;
  if (error) return <div className="text-[var(--color-error)] text-[14px] p-8">Error loading assets.</div>;

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-[36px] font-semibold leading-[1.15] text-[var(--color-text)] tracking-tight">
            Assets Directory
          </h1>
          <p className="text-[14px] text-[var(--color-text-secondary)] mt-1">
            Manage organization assets, equipment, and lifecycle status
          </p>
        </div>

        {['Admin', 'Asset Manager'].includes(role) && (
          <Button onClick={() => setIsModalOpen(true)} variant="primary">
            <Plus className="w-4 h-4" strokeWidth={1.75} /> Register Asset
          </Button>
        )}
      </div>

      {/* Search and Filters Bar */}
      <div className="flex flex-col md:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--color-text-secondary)]" strokeWidth={1.75} />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by tag, serial, or name..."
            className="w-full h-10 bg-[var(--color-surface-2)] border border-[var(--color-border-strong)] rounded-lg pl-9 pr-3 text-[14px] text-[var(--color-text)] placeholder-[var(--color-text-tertiary)] focus:outline-none focus:border-[var(--color-primary)] focus:ring-[3px] focus:ring-[var(--color-primary)]/25 transition-colors"
          />
        </div>

        <div className="flex flex-wrap gap-2">
          <FilterSelect label="Category" value={categoryFilter} options={categories} onChange={setCategoryFilter} />
          <FilterSelect label="Status" value={statusFilter} options={statuses} onChange={setStatusFilter} />
          <FilterSelect label="Department" value={departmentFilter} options={departments} onChange={setDepartmentFilter} />
        </div>
      </div>

      {/* Table Surface */}
      <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse whitespace-nowrap">
            <thead>
              <tr className="h-11 border-b border-[var(--color-border)] bg-[var(--color-surface-2)]">
                <th className="px-4 text-[12px] font-medium text-[var(--color-text-secondary)] uppercase tracking-wider">Asset Tag</th>
                <th className="px-4 text-[12px] font-medium text-[var(--color-text-secondary)] uppercase tracking-wider">Name</th>
                <th className="px-4 text-[12px] font-medium text-[var(--color-text-secondary)] uppercase tracking-wider">Category</th>
                <th className="px-4 text-[12px] font-medium text-[var(--color-text-secondary)] uppercase tracking-wider">Status</th>
                <th className="px-4 text-[12px] font-medium text-[var(--color-text-secondary)] uppercase tracking-wider">Location</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--color-border)]">
              {filteredAssets.map((asset) => (
                <tr key={asset.id} className="h-14 hover:bg-[var(--color-surface-2)] transition-colors">
                  <td className="px-4 text-[14px] font-mono font-medium text-[var(--color-primary)]">
                    {asset.tag}
                  </td>
                  <td className="px-4 text-[14px] font-medium text-[var(--color-text)]">
                    {asset.name}
                  </td>
                  <td className="px-4 text-[14px] text-[var(--color-text-secondary)]">
                    {asset.category}
                  </td>
                  <td className="px-4">
                    <Badge status={asset.status}>{asset.status}</Badge>
                  </td>
                  <td className="px-4 text-[14px] text-[var(--color-text-secondary)] capitalize">
                    {asset.location}
                  </td>
                </tr>
              ))}
              {filteredAssets.length === 0 && (
                <tr>
                  <td colSpan={5} className="h-32 text-center text-[var(--color-text-tertiary)] text-[14px]">
                    No assets match your search or filter criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Register Asset Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Register Asset"
        size="md"
      >
        <form onSubmit={handleCreateAsset} className="space-y-4">
          <Input
            id="asset-name"
            label="Asset Name"
            required
            value={newAsset.name}
            onChange={e => setNewAsset({ ...newAsset, name: e.target.value })}
            placeholder="e.g. MacBook Pro 16"
          />

          <div className="space-y-1">
            <label className="block text-[13px] font-medium text-[var(--color-text-secondary)]">
              Category
            </label>
            <select
              required
              value={newAsset.categoryId}
              onChange={e => setNewAsset({ ...newAsset, categoryId: e.target.value })}
              className="w-full h-10 px-3 rounded-lg text-[14px] text-[var(--color-text)] bg-[var(--color-surface-2)] border border-[var(--color-border-strong)] focus:outline-none focus:border-[var(--color-primary)] focus:ring-[3px] focus:ring-[var(--color-primary)]/25"
            >
              <option value="">Select Category</option>
              {dbCategories.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>

          <Input
            id="asset-serial"
            label="Serial Number"
            value={newAsset.serialNumber}
            onChange={e => setNewAsset({ ...newAsset, serialNumber: e.target.value })}
            placeholder="e.g. SN-MAC-0042"
          />

          <Input
            id="asset-location"
            label="Location"
            required
            value={newAsset.location}
            onChange={e => setNewAsset({ ...newAsset, location: e.target.value })}
            placeholder="e.g. IT Storage / Floor 3"
          />

          <Input
            id="asset-acquisition"
            label="Acquisition Date"
            type="date"
            required
            value={newAsset.acquisitionDate}
            onChange={e => setNewAsset({ ...newAsset, acquisitionDate: e.target.value })}
          />

          <div className="pt-1">
            <FileUploadDropzone 
              onFilesChange={setPhotoFiles} 
              maxFiles={1} 
              label="Asset Photograph (Max 1)"
              acceptedTypes="image/jpeg,image/png"
            />
          </div>

          <div className="pt-1">
            <FileUploadDropzone 
              onFilesChange={setDocFiles} 
              maxFiles={2} 
              label="Related Documents (Max 2)"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-[var(--color-border)]">
            <Button variant="ghost" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" disabled={isCreating || isUploading}>
              {isCreating || isUploading ? 'Saving...' : 'Save Asset'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

function FilterSelect({ label, value, options, onChange }) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="h-10 px-3 rounded-lg text-[13px] font-medium text-[var(--color-text)] bg-[var(--color-surface-2)] border border-[var(--color-border-strong)] focus:outline-none focus:border-[var(--color-primary)] focus:ring-[3px] focus:ring-[var(--color-primary)]/25 cursor-pointer"
    >
      {options.map((opt) => (
        <option key={opt} value={opt}>
          {opt === 'All' ? `${label}: All` : opt}
        </option>
      ))}
    </select>
  );
}
