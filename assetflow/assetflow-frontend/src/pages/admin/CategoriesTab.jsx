import { useState, useEffect } from 'react';
import { Plus, Edit2, Search, Trash2 } from 'lucide-react';
import { api } from '../../utils/api';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Modal from '../../components/ui/Modal';

export default function CategoriesTab() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(null);

  const [categoryName, setCategoryName] = useState('');
  const [customFields, setCustomFields] = useState([]);
  const [formError, setFormError] = useState(null);
  const [formSubmitting, setFormSubmitting] = useState(false);

  useEffect(() => {
    fetchCategories();
  }, []);

  async function fetchCategories() {
    try {
      setLoading(true);
      setError(null);
      const res = await api.get('/api/categories?pageSize=100&sortBy=name&sortOrder=asc');
      setCategories(res.data || []);
    } catch (err) {
      setError(err.message || 'Failed to fetch categories');
    } finally {
      setLoading(false);
    }
  }

  const convertArrayToObject = (arr) => {
    const obj = {};
    arr.forEach(item => {
      const k = item.key.trim();
      const v = item.value.trim();
      if (k) {
        let parsedValue = v;
        if (v.toLowerCase() === 'true') parsedValue = true;
        else if (v.toLowerCase() === 'false') parsedValue = false;
        else if (!isNaN(v) && v !== '') parsedValue = Number(v);
        obj[k] = parsedValue;
      }
    });
    return obj;
  };

  const convertObjectToArray = (obj) => {
    if (!obj || typeof obj !== 'object') return [];
    return Object.entries(obj).map(([key, value]) => ({
      key,
      value: String(value)
    }));
  };

  const handleAddAttribute = () => {
    setCustomFields(prev => [...prev, { key: '', value: '' }]);
  };

  const handleRemoveAttribute = (index) => {
    setCustomFields(prev => prev.filter((_, i) => i !== index));
  };

  const handleFieldChange = (index, fieldName, value) => {
    setCustomFields(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [fieldName]: value };
      return updated;
    });
  };

  const openAddModal = () => {
    setCategoryName('');
    setCustomFields([]);
    setFormError(null);
    setIsAddModalOpen(true);
  };

  const openEditModal = (category) => {
    setSelectedCategory(category);
    setCategoryName(category.name);
    setCustomFields(convertObjectToArray(category.customFields));
    setFormError(null);
    setIsEditModalOpen(true);
  };

  const handleAddSubmit = async (e) => {
    e.preventDefault();
    setFormError(null);

    if (!categoryName.trim()) {
      setFormError('Category name is required.');
      return;
    }

    setFormSubmitting(true);
    try {
      const customFieldsObj = convertArrayToObject(customFields);
      await api.post('/api/categories', {
        name: categoryName.trim(),
        customFields: customFieldsObj,
      });

      setIsAddModalOpen(false);
      fetchCategories();
    } catch (err) {
      setFormError(err.message || 'Failed to create category');
    } finally {
      setFormSubmitting(false);
    }
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    setFormError(null);

    if (!categoryName.trim()) {
      setFormError('Category name is required.');
      return;
    }

    setFormSubmitting(true);
    try {
      const customFieldsObj = convertArrayToObject(customFields);
      await api.put(`/api/categories/${selectedCategory.id}`, {
        name: categoryName.trim(),
        customFields: customFieldsObj,
      });

      setIsEditModalOpen(false);
      fetchCategories();
    } catch (err) {
      setFormError(err.message || 'Failed to update category');
    } finally {
      setFormSubmitting(false);
    }
  };

  const filteredCategories = categories.filter((category) => {
    return category.name.toLowerCase().includes(searchQuery.toLowerCase());
  });

  const miniInputCls = "flex-1 h-9 px-3 rounded-lg text-[13px] text-[var(--color-text)] bg-[var(--color-surface-2)] border border-[var(--color-border-strong)] focus:outline-none focus:border-[var(--color-primary)]";

  if (loading && categories.length === 0) {
    return (
      <div className="p-16 text-center text-[var(--color-text-secondary)] text-[14px]">
        Loading asset categories...
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
            placeholder="Search categories..."
            className="w-full h-10 bg-[var(--color-surface-2)] border border-[var(--color-border-strong)] rounded-lg pl-9 pr-3 text-[14px] text-[var(--color-text)] placeholder:text-[var(--color-text-tertiary)] focus:outline-none focus:border-[var(--color-primary)] focus:ring-[3px] focus:ring-[var(--color-primary)]/25 transition-colors"
          />
        </div>

        <Button onClick={openAddModal} variant="primary">
          <Plus className="w-4 h-4" strokeWidth={1.75} /> Add Category
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
              <th className="px-4 text-[12px] font-medium text-[var(--color-text-secondary)] uppercase tracking-wider">Category Name</th>
              <th className="px-4 text-[12px] font-medium text-[var(--color-text-secondary)] uppercase tracking-wider">Custom Schema Attributes</th>
              <th className="px-4 text-[12px] font-medium text-[var(--color-text-secondary)] uppercase tracking-wider text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--color-border)]">
            {filteredCategories.map((cat) => (
              <tr key={cat.id} className="h-14 hover:bg-[var(--color-surface-2)] transition-colors">
                <td className="px-4 text-[14px] font-medium text-[var(--color-text)]">
                  {cat.name}
                </td>
                <td className="px-4 text-[13px] text-[var(--color-text-secondary)]">
                  {cat.customFields && Object.keys(cat.customFields).length > 0 ? (
                    <div className="flex flex-wrap gap-1.5 max-w-lg">
                      {Object.entries(cat.customFields).map(([k, v]) => (
                        <span key={k} className="inline-flex items-center px-2 py-0.5 rounded bg-[var(--color-surface-3)] text-[var(--color-text)] text-[12px] border border-[var(--color-border)]">
                          {k}: {String(v)}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <span className="text-[var(--color-text-tertiary)] italic">No custom fields</span>
                  )}
                </td>
                <td className="px-4 text-right">
                  <button
                    onClick={() => openEditModal(cat)}
                    className="p-1.5 text-[var(--color-text-secondary)] hover:text-[var(--color-primary)] hover:bg-[var(--color-surface-3)] rounded-lg transition-colors inline-flex items-center gap-1 text-[13px]"
                  >
                    <Edit2 className="w-3.5 h-3.5" /> Edit
                  </button>
                </td>
              </tr>
            ))}
            {filteredCategories.length === 0 && (
              <tr>
                <td colSpan={3} className="h-32 text-center text-[var(--color-text-tertiary)] text-[14px]">
                  No asset categories match your query.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Add Modal */}
      <Modal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} title="Add Asset Category" size="md">
        <form onSubmit={handleAddSubmit} className="space-y-4">
          {formError && (
            <div className="p-3 bg-[var(--color-error-tint)] border border-[var(--color-error)]/40 text-[var(--color-error)] rounded-lg text-[13px]">
              {formError}
            </div>
          )}

          <Input id="cat-name" label="Category Name" required value={categoryName} onChange={(e) => setCategoryName(e.target.value)} placeholder="e.g. Laptops, Audio Equipment" />

          <div className="space-y-2 pt-2">
            <div className="flex items-center justify-between">
              <label className="block text-[13px] font-medium text-[var(--color-text-secondary)]">
                Custom Attributes (Key-Value)
              </label>
              <Button size="sm" variant="ghost" onClick={handleAddAttribute}>
                <Plus className="w-3.5 h-3.5" /> Add Attribute
              </Button>
            </div>

            {customFields.map((field, idx) => (
              <div key={idx} className="flex items-center gap-2">
                <input type="text" placeholder="Key (e.g. warranty_months)" value={field.key} onChange={(e) => handleFieldChange(idx, 'key', e.target.value)} className={miniInputCls} />
                <input type="text" placeholder="Default value" value={field.value} onChange={(e) => handleFieldChange(idx, 'value', e.target.value)} className={miniInputCls} />
                <button type="button" onClick={() => handleRemoveAttribute(idx)} className="p-2 text-[var(--color-text-secondary)] hover:text-[var(--color-error)]">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-[var(--color-border)]">
            <Button variant="ghost" onClick={() => setIsAddModalOpen(false)}>Cancel</Button>
            <Button type="submit" variant="primary" disabled={formSubmitting}>
              {formSubmitting ? 'Saving...' : 'Create Category'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Edit Modal */}
      <Modal isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)} title="Edit Asset Category" size="md">
        <form onSubmit={handleEditSubmit} className="space-y-4">
          {formError && (
            <div className="p-3 bg-[var(--color-error-tint)] border border-[var(--color-error)]/40 text-[var(--color-error)] rounded-lg text-[13px]">
              {formError}
            </div>
          )}

          <Input id="edit-cat-name" label="Category Name" required value={categoryName} onChange={(e) => setCategoryName(e.target.value)} />

          <div className="space-y-2 pt-2">
            <div className="flex items-center justify-between">
              <label className="block text-[13px] font-medium text-[var(--color-text-secondary)]">
                Custom Attributes (Key-Value)
              </label>
              <Button size="sm" variant="ghost" onClick={handleAddAttribute}>
                <Plus className="w-3.5 h-3.5" /> Add Attribute
              </Button>
            </div>

            {customFields.map((field, idx) => (
              <div key={idx} className="flex items-center gap-2">
                <input type="text" placeholder="Key (e.g. warranty_months)" value={field.key} onChange={(e) => handleFieldChange(idx, 'key', e.target.value)} className={miniInputCls} />
                <input type="text" placeholder="Default value" value={field.value} onChange={(e) => handleFieldChange(idx, 'value', e.target.value)} className={miniInputCls} />
                <button type="button" onClick={() => handleRemoveAttribute(idx)} className="p-2 text-[var(--color-text-secondary)] hover:text-[var(--color-error)]">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
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
