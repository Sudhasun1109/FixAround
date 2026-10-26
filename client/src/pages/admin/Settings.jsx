import React, { useState, useEffect } from 'react';
import { adminApi } from '../../services/api';
import Input from '../../components/common/Input';
import Button from '../../components/common/Button';
import Spinner from '../../components/common/Spinner';
import { showToast } from '../../components/common/Toast';
import { Settings, Save, ShieldCheck, RefreshCw, Sliders } from 'lucide-react';

export default function PlatformSettings() {
  const [settings, setSettings] = useState({});
  const [loading, setLoading] = useState(true);
  const [savingKey, setSavingKey] = useState(null);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const res = await adminApi.getSettings();
      const data = res?.data?.settings || res?.data || {};

      if (Array.isArray(data)) {
        const mapped = {};
        data.forEach((item) => {
          mapped[item.setting_key] = item.setting_value;
        });
        setSettings(mapped);
      } else {
        setSettings({
          emergency_timeout_seconds: '120',
          platform_commission_percentage: '15',
          emergency_dispatch_radius_km: '10',
          support_phone: '9597993402',
          support_email: 'vichudass15@gmail.com',
          default_warranty_days: '7',
          max_emergency_attempts: '5',
          ...data,
        });
      }
    } catch {
      // Default fallback settings
      setSettings({
        emergency_timeout_seconds: '120',
        platform_commission_percentage: '15',
        emergency_dispatch_radius_km: '10',
        support_phone: '9597993402',
        support_email: 'vichudass15@gmail.com',
        default_warranty_days: '7',
        max_emergency_attempts: '5',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const handleValueChange = (key, val) => {
    setSettings((prev) => ({ ...prev, [key]: val }));
  };

  const handleSaveSetting = async (key) => {
    try {
      setSavingKey(key);
      await adminApi.updateSetting(key, settings[key]);
      showToast.success(`Setting '${key}' saved.`);
    } catch (err) {
      showToast.error(err.message || 'Failed to update setting');
    } finally {
      setSavingKey(null);
    }
  };

  if (loading) {
    return <Spinner fullScreen label="Loading system parameters..." />;
  }

  const settingConfigs = [
    {
      key: 'emergency_timeout_seconds',
      label: 'Emergency Technician Response Timeout (Seconds)',
      description: 'Maximum time allotted to a technician before cascading offer to backup pro.',
    },
    {
      key: 'platform_commission_percentage',
      label: 'Platform Commission Rate (%)',
      description: 'Percentage retained by FixAround on completed jobs before technician settlement.',
    },
    {
      key: 'emergency_dispatch_radius_km',
      label: 'Emergency Dispatch Radius (Kilometers)',
      description: 'Spatial range used by the Haversine query for active technician isolation.',
    },
    {
      key: 'default_warranty_days',
      label: 'Default Minimum Warranty Period (Days)',
      description: 'Baseline coverage window applied to standard service categories.',
    },
    {
      key: 'max_emergency_attempts',
      label: 'Max Cascade Retries Before Admin Alert',
      description: 'Attempts allowed before escalating to human operations team.',
    },
    {
      key: 'support_phone',
      label: 'Public Support Toll-Free Helpline',
      description: 'Displayed across footer, invoice header, and customer receipt portals.',
    },
    {
      key: 'support_email',
      label: 'Support Operations Email Address',
      description: 'Inbox for legal notices, privacy requests, and escalated customer tickets.',
    },
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-6 py-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-bold text-fixteal-600 uppercase tracking-wider">
            Configuration
          </span>
          <h1 className="text-2xl font-extrabold text-fixblue-900 mt-0.5">
            Platform Settings & Algorithms
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Fine-tune dynamic parameters for cascading dispatch, platform commissions, and SLAs.
          </p>
        </div>

        <Button
          variant="outline"
          size="sm"
          icon={RefreshCw}
          onClick={fetchSettings}
        >
          Reload
        </Button>
      </div>

      <div className="bg-white rounded-3xl border border-slate-200/90 shadow-xs divide-y divide-slate-100 overflow-hidden">
        {settingConfigs.map((cfg) => {
          const val = settings[cfg.key] || '';
          const isSaving = savingKey === cfg.key;

          return (
            <div key={cfg.key} className="p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-50/50 transition-colors">
              <div className="max-w-md space-y-1">
                <h3 className="text-sm font-bold text-slate-800">{cfg.label}</h3>
                <p className="text-xs text-slate-500 leading-relaxed">{cfg.description}</p>
                <span className="text-[10px] text-slate-400 font-mono block pt-0.5">{cfg.key}</span>
              </div>

              <div className="flex items-center gap-3 shrink-0 w-full sm:w-auto">
                <input
                  type="text"
                  value={val}
                  onChange={(e) => handleValueChange(cfg.key, e.target.value)}
                  className="w-full sm:w-48 text-xs font-semibold py-2 px-3 border border-slate-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-fixteal-500"
                />

                <Button
                  variant="primary"
                  size="sm"
                  icon={Save}
                  loading={isSaving}
                  onClick={() => handleSaveSetting(cfg.key)}
                >
                  Save
                </Button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
