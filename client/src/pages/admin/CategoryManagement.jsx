import React, { useState, useEffect, useCallback } from 'react';
import { servicesApi } from '../../services/api';
import Modal from '../../components/common/Modal';
import Input from '../../components/common/Input';
import Textarea from '../../components/common/Textarea';
import Select from '../../components/common/Select';
import Button from '../../components/common/Button';
import Spinner from '../../components/common/Spinner';
import { formatCurrency } from '../../utils/formatters';
import { showToast } from '../../components/common/Toast';
import {
  FolderTree,
  Plus,
  Edit2,
  CheckCircle,
  XCircle,
  Tag,
} from 'lucide-react';

export default function CategoryManagement() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  // Add / Edit Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    description: '',
    icon: 'Wrench',
    min_price: '150',
    max_price: '5000',
    inspection_charge: '99',
    is_active: 1,
  });
  const [saving, setSaving] = useState(false);

  const fetchCategories = useCallback(async () => {
    try {
      setLoading(true);
      const res = await servicesApi.getAll();
      const list = res?.data?.categories || res?.data || [];
      setCategories(Array.isArray(list) ? list : []);
    } catch (err) {
      console.error('Failed to load categories:', err);
      setCategories([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  const handleOpenAdd = () => {
    setEditingId(null);
    setFormData({
      name: '',
      slug: '',
      description: '',
      icon: 'Wrench',
      min_price: '150',
      max_price: '5000',
      inspection_charge: '99',
      is_active: 1,
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (cat) => {
    setEditingId(cat.id);
    setFormData({
      name: cat.name || '',
      slug: cat.slug || '',
      description: cat.description || '',
      icon: cat.icon || 'Wrench',
      min_price: String(cat.min_price || 0),
      max_price: String(cat.max_price || 0),
      inspection_charge: String(cat.inspection_charge || 0),
      is_active: cat.is_active ? 1 : 0,
    });
    setIsModalOpen(true);
  };

  const handleToggleStatus = async (cat) => {
    const nextStatus = cat.is_active ? 0 : 1;
    try {
      await servicesApi.updateStatus(cat.id, nextStatus);
      showToast.success(`Category ${cat.name} ${nextStatus ? 'activated' : 'deactivated'}.`);
      fetchCategories();
    } catch (err) {
      showToast.error(err.message || 'Failed to toggle status');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name || !formData.slug) {
      showToast.error('Category name and slug are required');
      return;
    }

    try {
      setSaving(true);
      const payload = {
        name: formData.name.trim(),
        slug: formData.slug.trim().toLowerCase().replace(/\s+/g, '-'),
        description: formData.description.trim(),
        icon: formData.icon,
        min_price: parseFloat(formData.min_price) || 0,
        max_price: parseFloat(formData.max_price) || 0,
        inspection_charge: parseFloat(formData.inspection_charge) || 0,
        is_active: formData.is_active ? 1 : 0,
      };

      if (editingId) {
        await servicesApi.update(editingId, payload);
        showToast.success('Category updated successfully.');
      } else {
        await servicesApi.create(payload);
        showToast.success('New category registered.');
      }

      setIsModalOpen(false);
      fetchCategories();
    } catch (err) {
      showToast.error(err.message || 'Failed to save category');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-bold text-fixteal-600 uppercase tracking-wider">
            Catalog Management
          </span>
          <h1 className="text-2xl font-extrabold text-fixblue-900 mt-0.5">
            Service Categories
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Configure service offerings, pricing bounds, and customer dispatch settings.
          </p>
        </div>

        <Button
          variant="primary"
          size="md"
          icon={Plus}
          onClick={handleOpenAdd}
        >
          Add New Category
        </Button>
      </div>

      {/* Categories Table */}
      <div className="bg-white rounded-3xl border border-slate-200/90 shadow-xs overflow-hidden">
        {loading ? (
          <Spinner size="lg" label="Loading category catalog..." className="py-16" />
        ) : categories.length === 0 ? (
          <div className="text-center py-12 text-xs text-slate-400">
            No service categories defined. Click 'Add New Category' above.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/70 text-slate-500 font-bold uppercase tracking-wider">
                  <th className="py-3.5 px-4">Category</th>
                  <th className="py-3.5 px-4">Slug</th>
                  <th className="py-3.5 px-4">Price Range</th>
                  <th className="py-3.5 px-4">Inspection Fee</th>
                  <th className="py-3.5 px-4 text-center">Status</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700 font-medium">
                {categories.map((cat) => (
                  <tr key={cat.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-2.5">
                        <span className="font-mono text-[10px] text-slate-400">#{cat.id}</span>
                        <div>
                          <p className="font-bold text-slate-900">{cat.name}</p>
                          <span className="text-[10px] text-slate-400 font-mono">Icon: {cat.icon || 'Wrench'}</span>
                        </div>
                      </div>
                    </td>

                    <td className="py-3.5 px-4 font-mono text-slate-500">
                      {cat.slug}
                    </td>

                    <td className="py-3.5 px-4 font-bold text-fixblue-900">
                      {formatCurrency(cat.min_price)} – {formatCurrency(cat.max_price)}
                    </td>

                    <td className="py-3.5 px-4">
                      {Number(cat.inspection_charge) > 0 ? (
                        <span className="font-medium text-slate-700">{formatCurrency(cat.inspection_charge)}</span>
                      ) : (
                        <span className="font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100">FREE</span>
                      )}
                    </td>

                    <td className="py-3.5 px-4 text-center">
                      <span
                        className={`text-[10px] font-bold px-2.5 py-1 rounded-full ${
                          cat.is_active
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-rose-100 text-rose-800'
                        }`}
                      >
                        {cat.is_active ? 'Active' : 'Disabled'}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <Button
                          variant="outline"
                          size="sm"
                          icon={Edit2}
                          onClick={() => handleOpenEdit(cat)}
                        >
                          Edit
                        </Button>

                        <button
                          type="button"
                          onClick={() => handleToggleStatus(cat)}
                          className={`text-xs font-bold px-2.5 py-1.5 rounded-lg border transition-colors ${
                            cat.is_active
                              ? 'text-rose-600 border-rose-200 hover:bg-rose-50'
                              : 'text-emerald-700 border-emerald-200 hover:bg-emerald-50'
                          }`}
                        >
                          {cat.is_active ? 'Disable' : 'Enable'}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Create / Edit Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingId ? 'Edit Service Category' : 'Register New Category'}
        size="md"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input
              label="Category Name"
              required
              placeholder="e.g. Electrician"
              value={formData.name}
              onChange={(e) => {
                const nameVal = e.target.value;
                setFormData({
                  ...formData,
                  name: nameVal,
                  slug: editingId ? formData.slug : nameVal.toLowerCase().replace(/\s+/g, '-'),
                });
              }}
            />

            <Input
              label="URL Slug"
              required
              placeholder="e.g. electrician"
              value={formData.slug}
              onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
            />
          </div>

          <div>
            <Select
              label="Display Icon"
              value={formData.icon}
              onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
              options={[
                { value: 'Zap', label: 'Zap (Electrical)' },
                { value: 'Droplets', label: 'Droplets (Plumbing)' },
                { value: 'Snowflake', label: 'Snowflake (AC Repair)' },
                { value: 'Settings', label: 'Settings (Appliance)' },
                { value: 'Bike', label: 'Bike (Two-Wheeler)' },
                { value: 'Car', label: 'Car (Four-Wheeler)' },
                { value: 'Hammer', label: 'Hammer (Carpentry)' },
                { value: 'Paintbrush', label: 'Paintbrush (Painting)' },
                { value: 'SprayCan', label: 'SprayCan (Cleaning)' },
                { value: 'KeyRound', label: 'KeyRound (Locksmith)' },
                { value: 'Monitor', label: 'Monitor (Computer)' },
                { value: 'Wrench', label: 'Wrench (Handyman)' },
              ]}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <Input
              label="Min Price (₹)"
              type="number"
              min="0"
              required
              value={formData.min_price}
              onChange={(e) => setFormData({ ...formData, min_price: e.target.value })}
            />

            <Input
              label="Max Price (₹)"
              type="number"
              min="0"
              required
              value={formData.max_price}
              onChange={(e) => setFormData({ ...formData, max_price: e.target.value })}
            />

            <Input
              label="Inspection Fee (₹)"
              type="number"
              min="0"
              required
              value={formData.inspection_charge}
              onChange={(e) => setFormData({ ...formData, inspection_charge: e.target.value })}
            />
          </div>

          <Textarea
            label="Service Scope Description"
            rows={3}
            placeholder="Outline typical tasks covered by this category..."
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          />

          <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
            <Button
              variant="outline"
              size="md"
              onClick={() => setIsModalOpen(false)}
              disabled={saving}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="md"
              loading={saving}
            >
              {editingId ? 'Save Changes' : 'Create Category'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
