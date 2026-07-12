import { useState, useEffect } from 'react';
import { Plus, Edit2, Search, X } from 'lucide-react';
import { api } from '../../utils/api';

export default function CategoriesTab() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Modals state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(null);

  // Form states
  const [categoryName, setCategoryName] = useState('');
  const [customFields, setCustomFields] = useState([]); // [{ key: '', value: '' }]
  const [formError, setFormError] = useState(null);
  const [formSubmitting, setFormSubmitting] = useState(false);

  useEffect(() => {
    fetchCategories();
  }, []);

  async function fetchCategories() {
    try {
      setLoading(true);
      setError(null);
      // Fetch categories with high pageSize to get all for client-side search/filtering
      const res = await api.get('/api/categories?pageSize=100&sortBy=name&sortOrder=asc');
      setCategories(res.data || []);
    } catch (err) {
      setError(err.message || 'Failed to fetch categories');
    } finally {
      setLoading(false);
    }
  }

  // Convert array of {key, value} to object
  const convertArrayToObject = (arr) => {
    const obj = {};
    arr.forEach(item => {
      const k = item.key.trim();
      const v = item.value.trim();
      if (k) {
        let parsedValue = v;
        if (v.toLowerCase() === 'true') {
          parsedValue = true;
        } else if (v.toLowerCase() === 'false') {
          parsedValue = false;
        } else if (!isNaN(v) && v !== '') {
          parsedValue = Number(v);
        }
        obj[k] = parsedValue;
      }
    });
    return obj;
  };

  // Convert object to array of {key, value}
  const convertObjectToArray = (obj) => {
    if (!obj || typeof obj !== 'object') return [];
    return Object.entries(obj).map(([key, value]) => ({
      key,
      value: String(value)
    }));
  };

  // Attribute action handlers
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

  // Form open handlers
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

  // Submit handlers
  const handleAddSubmit = async (e) => {
    e.preventDefault();
    setFormError(null);

    if (!categoryName.trim()) {
      setFormError('Category name is required.');
      return;
    }

    // Validate custom fields
    const uniqueKeys = new Set();
    for (const field of customFields) {
      const trimmedKey = field.key.trim();
      const trimmedVal = field.value.trim();
      if (!trimmedKey && trimmedVal) {
        setFormError('Attribute name cannot be empty for defined values.');
        return;
      }
      if (trimmedKey) {
        if (uniqueKeys.has(trimmedKey)) {
          setFormError(`Duplicate attribute name: "${trimmedKey}".`);
          return;
        }
        uniqueKeys.add(trimmedKey);
      }
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

    // Validate custom fields
    const uniqueKeys = new Set();
    for (const field of customFields) {
      const trimmedKey = field.key.trim();
      const trimmedVal = field.value.trim();
      if (!trimmedKey && trimmedVal) {
        setFormError('Attribute name cannot be empty for defined values.');
        return;
      }
      if (trimmedKey) {
        if (uniqueKeys.has(trimmedKey)) {
          setFormError(`Duplicate attribute name: "${trimmedKey}".`);
          return;
        }
        uniqueKeys.add(trimmedKey);
      }
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

  // Search filter
  const filteredCategories = categories.filter((category) => {
    return category.name.toLowerCase().includes(searchQuery.toLowerCase());
  });

  if (loading && categories.length === 0) {
    return (
      <div className="p-20 text-center text-slate-400">
        <div className="animate-spin inline-block w-8 h-8 border-[3px] border-current border-t-transparent text-emerald-500 rounded-full mb-4" role="status" aria-label="loading"></div>
        <p>Loading asset categories...</p>
      </div>
    );
  }

  return (
    <div className="animate-in slide-in-from-bottom-4 duration-500 space-y-6">
      
      {/* Search and Action Header */}
      <div className="flex flex-col sm:flex-row gap-4 items-stretch sm:items-center justify-between p-6 pb-0">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-slate-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search categories by name..."
            className="w-full bg-slate-900/60 border border-slate-700/60 rounded-xl pl-11 pr-4 py-2.5 text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all text-sm"
          />
        </div>
        
        <button
          onClick={openAddModal}
          className="bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-white px-5 py-2.5 rounded-xl text-sm font-semibold transition-all shadow-[0_0_15px_rgba(16,185,129,0.3)] hover:shadow-[0_0_25px_rgba(16,185,129,0.5)] flex items-center justify-center gap-2 hover:-translate-y-0.5"
        >
          <Plus className="w-4 h-4" /> Add Category
        </button>
      </div>

      {error && (
        <div className="mx-6 bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-2xl">
          <p className="font-semibold">Error Loading Categories</p>
          <p className="text-sm mt-1">{error}</p>
        </div>
      )}

      {/* Table List View */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse whitespace-nowrap">
          <thead>
            <tr className="border-b border-slate-700/60 bg-slate-900/30">
              <th className="py-5 px-8 font-semibold text-slate-400 uppercase tracking-wider text-[11px] w-1/4">Category Name</th>
              <th className="py-5 px-8 font-semibold text-slate-400 uppercase tracking-wider text-[11px] w-7/12">Custom Attributes</th>
              <th className="py-5 px-8 font-semibold text-slate-400 uppercase tracking-wider text-[11px] text-right w-1/6">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-700/40">
            {filteredCategories.map((category) => (
              <tr key={category.id} className="hover:bg-slate-700/30 transition-colors group">
                {/* Category Name */}
                <td className="py-5 px-8">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-emerald-500 to-teal-500 flex items-center justify-center text-xs font-bold text-white shadow-md">
                      {category.name.charAt(0).toUpperCase()}
                    </div>
                    <span className="font-semibold text-slate-200 tracking-wide">{category.name}</span>
                  </div>
                </td>

                {/* Custom Fields in Badge Layout */}
                <td className="py-5 px-8">
                  {category.customFields && Object.keys(category.customFields).length > 0 ? (
                    <div className="flex flex-wrap gap-2 max-w-2xl">
                      {Object.entries(category.customFields).map(([key, value]) => (
                        <div 
                          key={key} 
                          className="inline-flex rounded-lg overflow-hidden border border-slate-700/60 text-xs shadow-sm bg-slate-900/40 hover:border-slate-600 transition-all duration-300"
                        >
                          <span className="bg-slate-950/80 px-2.5 py-1 text-slate-400 font-bold tracking-wide border-r border-slate-700/60">
                            {key}
                          </span>
                          <span className="px-2.5 py-1 text-emerald-400 font-semibold">
                            {String(value)}
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <span className="text-slate-500 text-xs italic">No attributes defined</span>
                  )}
                </td>

                {/* Actions */}
                <td className="py-5 px-8 text-right">
                  <div className="flex items-center justify-end gap-2">
                    <button
                      onClick={() => openEditModal(category)}
                      className="text-slate-400 hover:text-white transition-all duration-300 p-2 hover:bg-slate-600/50 rounded-xl flex items-center justify-center gap-1.5 text-xs font-semibold px-3 py-1.5 border border-slate-700/60 hover:border-slate-500/80 active:scale-95 shadow-sm"
                      title="Edit Category"
                    >
                      <Edit2 className="w-3.5 h-3.5 text-emerald-400" /> Edit
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {filteredCategories.length === 0 && (
              <tr>
                <td colSpan={3} className="py-12 px-8 text-center text-slate-500">
                  No categories found matching the search.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="p-6 bg-slate-900/30 border-t border-slate-700/60 text-slate-400 text-sm flex items-center gap-3">
        <div className="w-2 h-2 rounded-full bg-emerald-500/50 shadow-[0_0_8px_rgba(16,185,129,0.5)] animate-pulse"></div>
        <p>Categories define custom attributes that are required or tracked for specifically grouped company assets.</p>
      </div>

      {/* Add Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="glass-panel w-full max-w-lg rounded-3xl p-8 border border-slate-700/80 relative shadow-2xl bg-slate-900/95 max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setIsAddModalOpen(false)}
              className="absolute top-6 right-6 text-slate-400 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-xl font-bold text-white mb-6">Add New Category</h3>

            {formError && (
              <div className="mb-6 bg-red-500/10 border border-red-500/20 text-red-400 p-3.5 rounded-xl text-sm font-medium">
                {formError}
              </div>
            )}

            <form onSubmit={handleAddSubmit} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1.5 font-semibold">Category Name</label>
                <input
                  type="text"
                  required
                  value={categoryName}
                  onChange={(e) => setCategoryName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all text-sm"
                  placeholder="e.g. Laptops"
                />
              </div>

              <div>
                <div className="flex justify-between items-center mb-3">
                  <label className="block text-sm font-medium text-slate-300 font-semibold">Custom Attributes</label>
                  <button
                    type="button"
                    onClick={handleAddAttribute}
                    className="text-xs font-bold text-emerald-400 hover:text-emerald-300 flex items-center gap-1 transition-colors bg-slate-950 px-2.5 py-1 rounded-lg border border-slate-700 hover:border-slate-600 active:scale-95"
                  >
                    <Plus className="w-3.5 h-3.5" /> Add Attribute
                  </button>
                </div>

                <div className="space-y-3 max-h-[35vh] overflow-y-auto pr-1">
                  {customFields.map((field, index) => (
                    <div key={index} className="flex gap-2 items-center animate-in slide-in-from-top-2 duration-200">
                      <input
                        type="text"
                        placeholder="Name (e.g. RAM)"
                        required
                        value={field.key}
                        onChange={(e) => handleFieldChange(index, 'key', e.target.value)}
                        className="flex-1 bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all text-sm"
                      />
                      <input
                        type="text"
                        placeholder="Value (e.g. 16GB)"
                        required
                        value={field.value}
                        onChange={(e) => handleFieldChange(index, 'value', e.target.value)}
                        className="flex-1 bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all text-sm"
                      />
                      <button
                        type="button"
                        onClick={() => handleRemoveAttribute(index)}
                        className="text-slate-500 hover:text-red-400 transition-colors p-2 hover:bg-red-950/20 rounded-xl"
                        title="Remove Attribute"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                  {customFields.length === 0 && (
                    <p className="text-xs text-slate-500 italic py-2 text-center border border-dashed border-slate-700/60 rounded-xl">
                      No attributes added yet. Click "Add Attribute" to add specifications like Warranty, Serial Number, RAM, etc.
                    </p>
                  )}
                </div>
              </div>

              <div className="flex gap-4 justify-end pt-4 border-t border-slate-700/60">
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
                  {formSubmitting ? 'Creating...' : 'Create Category'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {isEditModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="glass-panel w-full max-w-lg rounded-3xl p-8 border border-slate-700/80 relative shadow-2xl bg-slate-900/95 max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setIsEditModalOpen(false)}
              className="absolute top-6 right-6 text-slate-400 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-xl font-bold text-white mb-6">Edit Category: {selectedCategory?.name}</h3>

            {formError && (
              <div className="mb-6 bg-red-500/10 border border-red-500/20 text-red-400 p-3.5 rounded-xl text-sm font-medium">
                {formError}
              </div>
            )}

            <form onSubmit={handleEditSubmit} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1.5 font-semibold">Category Name</label>
                <input
                  type="text"
                  required
                  value={categoryName}
                  onChange={(e) => setCategoryName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all text-sm"
                  placeholder="e.g. Laptops"
                />
              </div>

              <div>
                <div className="flex justify-between items-center mb-3">
                  <label className="block text-sm font-medium text-slate-300 font-semibold">Custom Attributes</label>
                  <button
                    type="button"
                    onClick={handleAddAttribute}
                    className="text-xs font-bold text-emerald-400 hover:text-emerald-300 flex items-center gap-1 transition-colors bg-slate-950 px-2.5 py-1 rounded-lg border border-slate-700 hover:border-slate-600 active:scale-95"
                  >
                    <Plus className="w-3.5 h-3.5" /> Add Attribute
                  </button>
                </div>

                <div className="space-y-3 max-h-[35vh] overflow-y-auto pr-1">
                  {customFields.map((field, index) => (
                    <div key={index} className="flex gap-2 items-center animate-in slide-in-from-top-2 duration-200">
                      <input
                        type="text"
                        placeholder="Name (e.g. RAM)"
                        required
                        value={field.key}
                        onChange={(e) => handleFieldChange(index, 'key', e.target.value)}
                        className="flex-1 bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all text-sm"
                      />
                      <input
                        type="text"
                        placeholder="Value (e.g. 16GB)"
                        required
                        value={field.value}
                        onChange={(e) => handleFieldChange(index, 'value', e.target.value)}
                        className="flex-1 bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all text-sm"
                      />
                      <button
                        type="button"
                        onClick={() => handleRemoveAttribute(index)}
                        className="text-slate-500 hover:text-red-400 transition-colors p-2 hover:bg-red-950/20 rounded-xl"
                        title="Remove Attribute"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                  {customFields.length === 0 && (
                    <p className="text-xs text-slate-500 italic py-2 text-center border border-dashed border-slate-700/60 rounded-xl">
                      No attributes added yet. Click "Add Attribute" to add specifications like Warranty, Serial Number, RAM, etc.
                    </p>
                  )}
                </div>
              </div>

              <div className="flex gap-4 justify-end pt-4 border-t border-slate-700/60">
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
