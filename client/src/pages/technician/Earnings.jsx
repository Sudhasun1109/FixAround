import React, { useState, useEffect, useCallback } from 'react';
import { earningsApi } from '../../services/api';
import StatsCard from '../../components/common/StatsCard';
import StatusBadge from '../../components/booking/StatusBadge';
import Spinner from '../../components/common/Spinner';
import EmptyState from '../../components/common/EmptyState';
import { formatCurrency, formatDate } from '../../utils/formatters';
import { DollarSign, Wallet, TrendingUp, CheckCircle, Clock } from 'lucide-react';

export default function Earnings() {
  const [earnings, setEarnings] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchEarningsData = useCallback(async () => {
    try {
      setLoading(true);
      const [earnRes, sumRes] = await Promise.all([
        earningsApi.getMyEarnings().catch(() => ({ data: [] })),
        earningsApi.getSummary().catch(() => ({ data: {} })),
      ]);

      const list = earnRes?.data?.earnings || earnRes?.data || [];
      const sumData = sumRes?.data?.summary || sumRes?.data || {};

      setEarnings(Array.isArray(list) ? list : []);
      setSummary(sumData);
    } catch (err) {
      console.error('Failed to load earnings:', err);
      setEarnings([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchEarningsData();
  }, [fetchEarningsData]);

  // Aggregate totals if not in summary
  const totalGross =
    summary?.total_gross ||
    earnings.reduce((sum, item) => sum + Number(item.gross_amount || 0), 0);

  const totalCommission =
    summary?.total_commission ||
    earnings.reduce((sum, item) => sum + Number(item.commission_amount || 0), 0);

  const netPayout =
    summary?.net_payout ||
    earnings.reduce((sum, item) => sum + Number(item.net_amount || 0), 0);

  const pendingSettlement =
    summary?.pending_settlement ||
    earnings
      .filter((e) => e.settlement_status === 'PENDING')
      .reduce((sum, item) => sum + Number(item.net_amount || 0), 0);

  return (
    <div className="space-y-6">
      <div>
        <span className="text-xs font-bold text-fixteal-600 uppercase tracking-wider">
          Financial Ledger
        </span>
        <h1 className="text-2xl font-extrabold text-fixblue-900 mt-0.5">
          Earnings & Payout Settlements
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Detailed accounting of completed jobs, platform commission, and bank transfers.
        </p>
      </div>

      {/* Summary Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard
          label="Total Gross Billed"
          value={formatCurrency(totalGross)}
          icon={TrendingUp}
          color="blue"
          subtitle="All completed jobs"
        />

        <StatsCard
          label="Platform Commission"
          value={formatCurrency(totalCommission)}
          icon={DollarSign}
          color="purple"
          subtitle="15% standard service fee"
        />

        <StatsCard
          label="Net Earnings"
          value={formatCurrency(netPayout)}
          icon={Wallet}
          color="green"
          subtitle="Your earned share"
        />

        <StatsCard
          label="Pending Transfer"
          value={formatCurrency(pendingSettlement)}
          icon={Clock}
          color="amber"
          subtitle="Weekly direct bank deposit"
        />
      </div>

      {/* Earnings Breakdown Table */}
      <div className="bg-white rounded-3xl border border-slate-200/90 shadow-xs overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <h3 className="text-sm font-bold text-fixblue-900 uppercase tracking-wider">
            Settlement Ledger ({earnings.length})
          </h3>
        </div>

        {loading ? (
          <Spinner size="lg" label="Loading earnings records..." className="py-16" />
        ) : earnings.length === 0 ? (
          <EmptyState
            icon={Wallet}
            title="No earnings records yet"
            description="When you complete client jobs, itemized gross and net payouts will appear in this ledger."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/70 text-slate-400 font-bold uppercase tracking-wider">
                  <th className="py-3 px-4">Booking</th>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4 text-right">Gross</th>
                  <th className="py-3 px-4 text-right">Commission</th>
                  <th className="py-3 px-4 text-right">Net Payout</th>
                  <th className="py-3 px-4 text-center">Settlement</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700 font-medium">
                {earnings.map((e) => (
                  <tr key={e.id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-fixblue-900">
                      #{e.booking_number || `BK-${e.booking_id}`}
                    </td>
                    <td className="py-3 px-4 text-slate-500">
                      {formatDate(e.created_at)}
                    </td>
                    <td className="py-3 px-4 text-right font-semibold">
                      {formatCurrency(e.gross_amount)}
                    </td>
                    <td className="py-3 px-4 text-right text-slate-400">
                      -{formatCurrency(e.commission_amount)}
                    </td>
                    <td className="py-3 px-4 text-right font-extrabold text-emerald-700 text-sm">
                      {formatCurrency(e.net_amount)}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span
                        className={`inline-block text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          e.settlement_status === 'SETTLED'
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {e.settlement_status || 'PENDING'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
