import React, { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { techniciansApi } from '../../services/api';
import Input from '../../components/common/Input';
import Textarea from '../../components/common/Textarea';
import Button from '../../components/common/Button';
import Spinner from '../../components/common/Spinner';
import { showToast } from '../../components/common/Toast';
import { User, MapPin, Award, Save, Image, CheckCircle } from 'lucide-react';

export default function ProfileManagement() {
  const { user, updateUser } = useAuth();

  const [form, setForm] = useState({
    bio: '',
    experience_years: '5',
    avatar_url: '',
    service_city: 'New Delhi',
    service_pincode: '110001',
    service_radius_km: '15',
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setLoading(true);
        const res = await techniciansApi.getById(user?.id);
        const data = res?.data || res;
        setForm({
          bio: data.bio || '',
          experience_years: String(data.experience_years || 5),
          avatar_url: data.avatar_url || '',
          service_city: data.service_city || 'New Delhi',
          service_pincode: data.service_pincode || '110001',
          service_radius_km: String(data.service_radius_km || 15),
        });
      } catch {
        // Fallback to user auth state
        if (user) {
          setForm({
            bio: user.bio || '',
            experience_years: String(user.experience_years || 5),
            avatar_url: user.avatar_url || '',
            service_city: user.service_city || 'New Delhi',
            service_pincode: user.service_pincode || '110001',
            service_radius_km: String(user.service_radius_km || 15),
          });
        }
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [user]);

  const handleChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      await techniciansApi.updateProfile({
        bio: form.bio.trim(),
        experience_years: parseInt(form.experience_years, 10) || 1,
        avatar_url: form.avatar_url.trim(),
        service_city: form.service_city.trim(),
        service_pincode: form.service_pincode.trim(),
        service_radius_km: parseFloat(form.service_radius_km) || 10,
      });

      updateUser({
        avatar_url: form.avatar_url.trim(),
        bio: form.bio.trim(),
        experience_years: parseInt(form.experience_years, 10),
      });

      showToast.success('Professional profile updated successfully.');
    } catch (err) {
      showToast.error(err.message || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <Spinner fullScreen label="Loading professional profile..." />;
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6 py-4">
      <div>
        <span className="text-xs font-bold text-fixteal-600 uppercase tracking-wider">
          Profile Settings
        </span>
        <h1 className="text-2xl font-extrabold text-fixblue-900 mt-0.5">
          Technician Profile Management
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Keep your professional bio, experience level, and operational areas current for customers.
        </p>
      </div>

      <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200/90 shadow-xs">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Avatar Preview & URL */}
          <div>
            <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-3">
              Profile Photo
            </h3>
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-slate-100 border border-slate-200 overflow-hidden flex items-center justify-center font-bold text-fixblue-900 text-xl shrink-0">
                {form.avatar_url ? (
                  <img
                    src={form.avatar_url}
                    alt="Preview"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span>{user?.first_name ? user.first_name[0] : 'T'}</span>
                )}
              </div>

              <div className="flex-1">
                <Input
                  label="Avatar Image URL"
                  icon={Image}
                  placeholder="https://example.com/photo.jpg"
                  value={form.avatar_url}
                  onChange={(e) => handleChange('avatar_url', e.target.value)}
                  helperText="Provide a clear, professional headshot photo URL."
                />
              </div>
            </div>
          </div>

          {/* Experience & Areas */}
          <div className="pt-4 border-t border-slate-100">
            <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-3">
              Experience & Coverage Areas
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Input
                label="Years of Experience"
                type="number"
                min="0"
                max="50"
                value={form.experience_years}
                onChange={(e) => handleChange('experience_years', e.target.value)}
              />

              <Input
                label="Base City"
                value={form.service_city}
                onChange={(e) => handleChange('service_city', e.target.value)}
              />

              <Input
                label="Primary Pincode"
                value={form.service_pincode}
                onChange={(e) => handleChange('service_pincode', e.target.value)}
              />
            </div>

            <div className="mt-4">
              <Input
                label="Service Radius (km)"
                type="number"
                min="1"
                max="50"
                value={form.service_radius_km}
                onChange={(e) => handleChange('service_radius_km', e.target.value)}
                helperText="Jobs within this radius will be dispatched to you."
              />
            </div>
          </div>

          {/* Bio */}
          <div className="pt-4 border-t border-slate-100">
            <Textarea
              label="Professional Bio"
              rows={4}
              placeholder="Detail your specializations, brand certifications, and years of customer satisfaction..."
              value={form.bio}
              onChange={(e) => handleChange('bio', e.target.value)}
              helperText="This text appears on your public profile visible to customers."
            />
          </div>

          <div className="pt-4 border-t border-slate-100 flex justify-end">
            <Button
              type="submit"
              variant="primary"
              size="md"
              loading={saving}
              icon={Save}
            >
              Save Profile Updates
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
