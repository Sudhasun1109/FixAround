import React, { useState, useEffect, useCallback } from 'react';
import { adminApi } from '../../services/api';
import SearchBar from '../../components/common/SearchBar';
import Pagination from '../../components/common/Pagination';
import Modal from '../../components/common/Modal';
import Button from '../../components/common/Button';
import Spinner from '../../components/common/Spinner';
import EmptyState from '../../components/common/EmptyState';
import { showToast } from '../../components/common/Toast';
import { formatDate } from '../../utils/formatters';
import {
  Users,
  Search,
  CheckCircle2,
  XCircle,
  Eye,
  Mail,
  Phone,
  ShieldCheck,
  ShieldAlert,
} from 'lucide-react';

export default function CustomerManagement() {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  // Selected customer for modal
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [togglingId, setTogglingId] = useState(null);

  const fetchCustomers = useCallback(async () => {
    try {
      setLoading(true);
      const res = await adminApi.getUsers({
        role: 'customer',
        page,
        limit: 10,
        search,
      });

      const list = res?.data?.users || res?.data || [];
      const pagination = res?.pagination || {};

      setCustomers(Array.isArray(list) ? list : []);
      setTotalPages(pagination.totalPages || 1);
      setTotalCount(pagination.total || list.length);
    } catch (err) {
      console.error('Failed to load customers:', err);
      setCustomers([]);
    } finally {
      setLoading(false);
    }
  }, [page, search]);

  useEffect(() => {
    fetchCustomers();
  }, [fetchCustomers]);

  const handleToggleStatus = async (user) => {
    const nextStatus = user.is_active ? 0 : 1;
    try {
      setTogglingId(user.id);
      await adminApi.updateUserStatus(user.id, nextStatus);
      showToast.success(`User ${user.first_name} ${nextStatus ? 'activated' : 'suspended'}.`);
      fetchCustomers();
      if (selectedCustomer && selectedCustomer.id === user.id) {
        setSelectedCustomer({ ...selectedCustomer, is_active: nextStatus });
      }
    } catch (err) {
      showToast.error(err.message || 'Failed to update user status');
    } finally {
      setTogglingId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-bold text-fixteal-600 uppercase tracking-wider">
            Directory
          </span>
          <h1 className="text-2xl font-extrabold text-fixblue-900 mt-0.5">
            Customer Account Management
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Search, view profiles, and manage account authorization status.
          </p>
        </div>

        <div className="w-full sm:w-72">
          <SearchBar
            value={search}
            onChange={(val) => {
              setSearch(val);
              setPage(1);
            }}
            placeholder="Search by name, email, phone..."
          />
        </div>
      </div>

      {/* Customer Table */}
      <div className="bg-white rounded-3xl border border-slate-200/90 shadow-xs overflow-hidden">
        {loading ? (
          <Spinner size="lg" label="Loading customer directory..." className="py-16" />
        ) : customers.length === 0 ? (
          <EmptyState
            icon={Users}
            title="No customers found"
            description="No customer accounts match your current search query."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/70 text-slate-400 font-bold uppercase tracking-wider">
                  <th className="py-3 px-4">User</th>
                  <th className="py-3 px-4">Contact</th>
                  <th className="py-3 px-4">Joined</th>
                  <th className="py-3 px-4 text-center">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700 font-medium">
                {customers.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-fixblue-50 text-fixblue-900 font-bold flex items-center justify-center">
                          {c.first_name ? c.first_name[0] : 'U'}
                        </div>
                        <div>
                          <p className="font-bold text-slate-900">
                            {c.first_name} {c.last_name}
                          </p>
                          <span className="text-[10px] text-slate-400 font-mono">
                            ID #{c.id}
                          </span>
                        </div>
                      </div>
                    </td>

                    <td className="py-3 px-4">
                      <p className="text-slate-800">{c.email}</p>
                      <p className="text-[11px] text-slate-400">{c.phone || '-'}</p>
                    </td>

                    <td className="py-3 px-4 text-slate-500">
                      {formatDate(c.created_at)}
                    </td>

                    <td className="py-3 px-4 text-center">
                      <span
                        className={`inline-flex items-center gap-1 text-[10px] font-bold px-2.5 py-0.5 rounded-full ${
                          c.is_active
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-rose-100 text-rose-800'
                        }`}
                      >
                        {c.is_active ? 'Active' : 'Suspended'}
                      </span>
                    </td>

                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          icon={Eye}
                          onClick={() => setSelectedCustomer(c)}
                        >
                          View
                        </Button>

                        <button
                          type="button"
                          disabled={togglingId === c.id}
                          onClick={() => handleToggleStatus(c)}
                          className={`text-xs font-bold px-2.5 py-1.5 rounded-lg border transition-colors ${
                            c.is_active
                              ? 'text-rose-600 border-rose-200 hover:bg-rose-50'
                              : 'text-emerald-700 border-emerald-200 hover:bg-emerald-50'
                          }`}
                        >
                          {c.is_active ? 'Suspend' : 'Activate'}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {!loading && totalPages > 1 && (
          <Pagination
            currentPage={page}
            totalPages={totalPages}
            totalItems={totalCount}
            onPageChange={setPage}
          />
        )}
      </div>

      {/* Customer Detail Modal */}
      <Modal
        isOpen={Boolean(selectedCustomer)}
        onClose={() => setSelectedCustomer(null)}
        title="Customer Profile Dossier"
        size="md"
      >
        {selectedCustomer && (
          <div className="space-y-4 text-xs">
            <div className="flex items-center gap-4 pb-4 border-b border-slate-100">
              <div className="w-12 h-12 rounded-2xl bg-fixblue-900 text-white font-bold text-lg flex items-center justify-center">
                {selectedCustomer.first_name ? selectedCustomer.first_name[0] : 'U'}
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  {selectedCustomer.first_name} {selectedCustomer.last_name}
                </h3>
                <p className="text-slate-400">User ID #{selectedCustomer.id} &bull; Role: Customer</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 text-slate-600">
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                <span className="font-bold text-slate-400 uppercase tracking-wider block">Email</span>
                <span className="font-semibold text-slate-800">{selectedCustomer.email}</span>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                <span className="font-bold text-slate-400 uppercase tracking-wider block">Phone</span>
                <span className="font-semibold text-slate-800">{selectedCustomer.phone || 'Not provided'}</span>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                <span className="font-bold text-slate-400 uppercase tracking-wider block">Registration Date</span>
                <span>{formatDate(selectedCustomer.created_at)}</span>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                <span className="font-bold text-slate-400 uppercase tracking-wider block">Account Status</span>
                <span className={selectedCustomer.is_active ? 'text-emerald-600 font-bold' : 'text-rose-600 font-bold'}>
                  {selectedCustomer.is_active ? 'Active' : 'Suspended'}
                </span>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100 flex justify-end gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSelectedCustomer(null)}
              >
                Close
              </Button>
              <Button
                variant={selectedCustomer.is_active ? 'danger' : 'secondary'}
                size="sm"
                onClick={() => handleToggleStatus(selectedCustomer)}
              >
                {selectedCustomer.is_active ? 'Suspend Account' : 'Reactivate Account'}
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
