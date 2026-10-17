import React, { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { servicesApi, techniciansApi } from '../../services/api';
import Spinner from '../../components/common/Spinner';
import Button from '../../components/common/Button';
import { showToast } from '../../components/common/Toast';
import { Wrench, Plus, Trash2, CheckCircle2, Save } from 'lucide-react';

export default function Skills() {
  const { user } = useAuth();

  const [allCategories, setAllCategories] = useState([]);
  const [technicianSkills, setTechnicianSkills] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [catRes, skillRes] = await Promise.all([
          servicesApi.getAll({ is_active: 1 }),
          techniciansApi.getSkills(user?.id).catch(() => ({ data: [] })),
        ]);

        const catList = catRes?.data?.categories || catRes?.data || [];
        const skillList = skillRes?.data?.skills || skillRes?.data || [];

        setAllCategories(Array.isArray(catList) ? catList : []);

        // Map initial skills
        if (Array.isArray(skillList) && skillList.length > 0) {
          setTechnicianSkills(
            skillList.map((s) => ({
              category_id: s.category_id || s.id,
              name: s.name || s.category_name,
              years_experience: s.years_experience || 2,
            }))
          );
        } else {
          // Default skill if none yet
          setTechnicianSkills([]);
        }
      } catch (err) {
        console.error('Failed to load skills:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user?.id]);

  const handleAddSkill = (cat) => {
    if (!cat || !cat.id) {
      showToast.error('Invalid category selection.');
      return;
    }
    const catId = cat.id;
    if (technicianSkills.some((s) => String(s.category_id || s.categoryId) === String(catId))) {
      showToast.info('This category is already added to your skills.');
      return;
    }
    setTechnicianSkills((prev) => [
      ...prev,
      {
        categoryId: catId,
        category_id: catId,
        name: cat.name,
        yearsExperience: 2,
        years_experience: 2,
      },
    ]);
  };

  const handleRemoveSkill = (catId) => {
    setTechnicianSkills((prev) => prev.filter((s) => String(s.category_id || s.categoryId) !== String(catId)));
  };

  const handleExperienceChange = (catId, years) => {
    const parsedYears = Math.max(0, parseInt(years, 10) || 0);
    setTechnicianSkills((prev) =>
      prev.map((s) =>
        String(s.category_id || s.categoryId) === String(catId)
          ? { ...s, years_experience: parsedYears, yearsExperience: parsedYears }
          : s
      )
    );
  };

  const handleSaveSkills = async () => {
    if (technicianSkills.length === 0) {
      showToast.error('You must maintain at least one active trade skill.');
      return;
    }

    try {
      setSaving(true);
      const payload = technicianSkills
        .filter((s) => s.category_id || s.categoryId)
        .map((s) => ({
          categoryId: s.category_id || s.categoryId,
          category_id: s.category_id || s.categoryId,
          yearsExperience: s.years_experience ?? s.yearsExperience ?? 0,
          years_experience: s.years_experience ?? s.yearsExperience ?? 0,
        }));

      await techniciansApi.updateSkills(payload);
      showToast.success('Your skill competencies have been updated successfully.');
    } catch (err) {
      showToast.error(err.message || 'Failed to update skills');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <Spinner fullScreen label="Loading trade competencies..." />;
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 py-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-bold text-fixteal-600 uppercase tracking-wider">
            Qualifications
          </span>
          <h1 className="text-2xl font-extrabold text-fixblue-900 mt-0.5">
            Trade Skills & Service Categories
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Specify the exact services you are qualified to perform and set your experience level.
          </p>
        </div>

        <Button
          variant="primary"
          size="md"
          loading={saving}
          icon={Save}
          onClick={handleSaveSkills}
        >
          Save Skill Portfolio
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Active Skills List */}
        <div className="lg:col-span-2 bg-white p-6 rounded-3xl border border-slate-200/90 shadow-xs space-y-4">
          <h3 className="text-sm font-bold text-fixblue-900 uppercase tracking-wider pb-2 border-b border-slate-100">
            My Active Services ({technicianSkills.length})
          </h3>

          {technicianSkills.length === 0 ? (
            <div className="text-center py-8 text-xs text-slate-400">
              No skills added yet. Click categories on the right to add them to your profile.
            </div>
          ) : (
            <div className="space-y-3">
              {technicianSkills.map((skill) => (
                <div
                  key={skill.category_id}
                  className="p-4 rounded-2xl border border-slate-200 bg-slate-50/50 flex items-center justify-between gap-4"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-xl bg-fixblue-50 text-fixblue-800">
                      <Wrench className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-slate-800">
                        {skill.name}
                      </h4>
                      <span className="text-[11px] text-slate-400">
                        Category ID #{skill.category_id}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1.5 text-xs text-slate-600">
                      <label className="font-semibold text-slate-500">Exp:</label>
                      <input
                        type="number"
                        min="0"
                        max="50"
                        value={skill.years_experience}
                        onChange={(e) => handleExperienceChange(skill.category_id, e.target.value)}
                        className="w-16 py-1 px-2 border border-slate-300 rounded-lg text-xs font-bold text-center bg-white"
                      />
                      <span>yrs</span>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleRemoveSkill(skill.category_id)}
                      className="p-1.5 rounded-lg text-rose-500 hover:text-rose-700 hover:bg-rose-50 transition-colors"
                      title="Remove skill"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Available Categories to Add */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200/90 shadow-xs space-y-4">
          <h3 className="text-sm font-bold text-fixblue-900 uppercase tracking-wider pb-2 border-b border-slate-100">
            Available Categories
          </h3>
          <p className="text-xs text-slate-500">
            Click to add any trade category you are certified to service:
          </p>

          <div className="space-y-2">
            {allCategories.map((cat) => {
              const isAdded = technicianSkills.some((s) => String(s.category_id) === String(cat.id));
              return (
                <button
                  key={cat.id}
                  type="button"
                  disabled={isAdded}
                  onClick={() => handleAddSkill(cat)}
                  className={`
                    w-full flex items-center justify-between p-2.5 rounded-xl border text-xs font-semibold transition-all
                    ${
                      isAdded
                        ? 'border-emerald-200 bg-emerald-50/50 text-emerald-800 cursor-default opacity-60'
                        : 'border-slate-200 bg-white text-slate-700 hover:border-fixteal-400 hover:bg-teal-50/30'
                    }
                  `}
                >
                  <span>{cat.name}</span>
                  {isAdded ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  ) : (
                    <Plus className="w-4 h-4 text-slate-400 shrink-0" />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
