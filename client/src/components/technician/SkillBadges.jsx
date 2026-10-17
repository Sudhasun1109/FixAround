import React from 'react';

export default function SkillBadges({
  skills = [],
  max,
  size = 'sm',
  className = '',
}) {
  if (!skills || !Array.isArray(skills) || skills.length === 0) {
    return (
      <span className="text-xs text-slate-400 italic">No skills listed</span>
    );
  }

  const visibleSkills = max ? skills.slice(0, max) : skills;
  const remainingCount = max && skills.length > max ? skills.length - max : 0;

  return (
    <div className={`flex flex-wrap items-center gap-1.5 ${className}`}>
      {visibleSkills.map((skill, index) => {
        const skillName =
          typeof skill === 'string'
            ? skill
            : skill.name || skill.category_name || `Skill ${index + 1}`;
        const experience =
          typeof skill === 'object' && skill.years_experience
            ? `${skill.years_experience}y`
            : null;

        return (
          <span
            key={skill.id || skillName || index}
            className={`
              inline-flex items-center gap-1 font-semibold rounded-md bg-slate-100 text-slate-700 border border-slate-200/80
              ${size === 'sm' ? 'text-[11px] px-2 py-0.5' : 'text-xs px-2.5 py-1'}
            `}
          >
            <span>{skillName}</span>
            {experience && (
              <span className="text-[10px] text-fixteal-700 bg-fixteal-50 px-1 py-0.2 rounded font-bold">
                {experience}
              </span>
            )}
          </span>
        );
      })}

      {remainingCount > 0 && (
        <span
          className={`
            font-medium rounded-md bg-slate-50 text-slate-500 border border-slate-200
            ${size === 'sm' ? 'text-[11px] px-1.5 py-0.5' : 'text-xs px-2 py-1'}
          `}
        >
          +{remainingCount} more
        </span>
      )}
    </div>
  );
}
