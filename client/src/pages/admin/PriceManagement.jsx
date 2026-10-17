import React, { useState, useEffect } from 'react';
import { servicesApi } from '../../services/api';
import Button from '../../components/common/Button';
import Spinner from '../../components/common/Spinner';
import { formatCurrency } from '../../utils/formatters';
import { showToast } from '../../components/common/Toast';
import { Tag, Save, ShieldCheck, RefreshCw } from 'lucide-react';

export default function PriceManagement() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState(null);

  // Local price edits
  const [priceMap, setPriceMap] = useState({});

  const fetchPricing = async () => {
    try {
      setLoading(true);
      const res = await servicesApi.getAll();
      const list = res?.data?.categories || res?.data || [];
      setCategories(Array.isArray(list) ? list : []);

      // Initialize map
      const initial = {};
      list.forEach((c) => {
        initial[c.id] = {
          min_price: String(c.min_price || 0),
          max_price: String(c.max_price || 0),
          inspection_charge: String(c.inspection_charge || 0),
        };
      });
      setPriceMap(initial);
    } catch (err) {
      console.error('Failed to load prices:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPricing();
  }, []);

  const handleFieldChange = (catId, field, val) => {
    setPriceMap((prev) => ({
      ...prev,
      [catId]: {
        ...prev[catId],
        [field]: val,
      },
    }));
  };

  const handleSavePrice = async (cat) => {
    const prices = priceMap[cat.id];
    const minP = parseFloat(prices?.min_price) || 0;
    const maxP = parseFloat(prices?.max_price) || 0;
    const insp = parseFloat(prices?.inspection_charge) || 0;

    if (minP > maxP) {
      showToast.error(`Min price cannot exceed Max price for ${cat.name}`);
      return;
    }

    try {
      setSavingId(cat.id);
      await servicesApi.update(cat.id, {
        ...cat,
        min_price: minP,
        max_price: maxP,
        inspection_charge: insp,
      });

      showToast.success(`Pricing updated for ${cat.name}.`);
    } catch (err) {
      showToast.error(err.message || 'Failed to update pricing');
    } finally {
      setSavingId(null);
    }
  };

  if (loading) {
    return <Spinner fullScreen label="Loading category price matrices..." />;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-bold text-fixteal-600 uppercase tracking-wider">
            Rate Cards
          </span>
          <h1 className="text-2xl font-extrabold text-fixblue-900 mt-0.5">
            Price Range & Inspection Fee Management
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Govern public indicative price bands and mandatory minimum visiting charges per trade.
          </p>
        </div>

        <Button
          variant="outline"
          size="sm"
          icon={RefreshCw}
          onClick={fetchPricing}
        >
          Reset Rates
        </Button>
      </div>

      <div className="bg-white rounded-3xl border border-slate-200/90 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/70 text-slate-400 font-bold uppercase tracking-wider">
                <th className="py-3 px-4">Category</th>
                <th className="py-3 px-4">Min Rate (₹)</th>
                <th className="py-3 px-4">Max Rate (₹)</th>
                <th className="py-3 px-4">Visiting / Inspection (₹)</th>
                <th className="py-3 px-4 text-right">Save</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700 font-medium">
              {categories.map((cat) => {
                const prices = priceMap[cat.id] || {};
                return (
                  <tr key={cat.id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-3 px-4">
                      <span className="font-bold text-slate-900 block">{cat.name}</span>
                      <span className="text-[10px] text-slate-400 font-mono">/{cat.slug}</span>
                    </td>

                    <td className="py-3 px-4">
                      <input
                        type="number"
                        min="0"
                        step="10"
                        value={prices.min_price || ''}
                        onChange={(e) => handleFieldChange(cat.id, 'min_price', e.target.value)}
                        className="w-28 py-1.5 px-2.5 rounded-lg border border-slate-300 font-semibold focus:outline-none focus:ring-2 focus:ring-fixteal-500 bg-white"
                      />
                    </td>

                    <td className="py-3 px-4">
                      <input
                        type="number"
                        min="0"
                        step="10"
                        value={prices.max_price || ''}
                        onChange={(e) => handleFieldChange(cat.id, 'max_price', e.target.value)}
                        className="w-28 py-1.5 px-2.5 rounded-lg border border-slate-300 font-semibold focus:outline-none focus:ring-2 focus:ring-fixteal-500 bg-white"
                      />
                    </td>

                    <td className="py-3 px-4">
                      <input
                        type="number"
                        min="0"
                        step="10"
                        value={prices.inspection_charge || ''}
                        onChange={(e) => handleFieldChange(cat.id, 'inspection_charge', e.target.value)}
                        className="w-28 py-1.5 px-2.5 rounded-lg border border-slate-300 font-semibold focus:outline-none focus:ring-2 focus:ring-fixteal-500 bg-white"
                      />
                    </td>

                    <td className="py-3 px-4 text-right">
                      <Button
                        variant="secondary"
                        size="sm"
                        icon={Save}
                        loading={savingId === cat.id}
                        onClick={() => handleSavePrice(cat)}
                      >
                        Update
                      </Button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
