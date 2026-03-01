import React from 'react';

interface NutritionCardProps {
  label: string;
  value: number;
  total: number;
  color: string;
  unit?: string;
}

export const NutritionCard: React.FC<NutritionCardProps> = ({ label, value, total, color, unit = 'g' }) => {
  const percentage = Math.min(100, Math.max(0, (value / total) * 100));
  
  return (
    <div className="bg-white p-3 rounded-2xl shadow-sm border border-slate-100 flex flex-col items-center justify-center flex-1 min-w-[80px]">
      <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider mb-1">{label}</span>
      <span className="text-lg font-display font-bold text-slate-700">
        {Math.round(value)}{unit}
      </span>
      <div className="w-full bg-slate-100 h-1.5 rounded-full mt-2 overflow-hidden">
        <div 
          className={`h-full rounded-full transition-all duration-500 ease-out`}
          style={{ width: `${percentage}%`, backgroundColor: color }}
        />
      </div>
    </div>
  );
};