import React, { useState, useEffect } from 'react';
import { UserGoal } from '../types';
import { X, Save } from 'lucide-react';

interface GoalModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentGoal: UserGoal;
  onSaveGoal: (goal: UserGoal) => void;
}

export const GoalModal: React.FC<GoalModalProps> = ({ isOpen, onClose, currentGoal, onSaveGoal }) => {
  const [goal, setGoal] = useState<UserGoal>(currentGoal);

  useEffect(() => {
    setGoal(currentGoal);
  }, [currentGoal]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveGoal(goal);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl overflow-hidden animate-fade-in-up">
        
        {/* Header */}
        <div className="bg-primary p-4 flex justify-between items-center text-white">
          <h2 className="font-display font-bold text-xl">Mes Objectifs</h2>
          <button onClick={onClose} className="p-1 hover:bg-white/20 rounded-full transition">
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-1">Calories (kcal)</label>
            <input 
              type="number" 
              value={goal.calories}
              onChange={e => setGoal({...goal, calories: parseInt(e.target.value) || 0})}
              className="w-full border-2 border-slate-200 rounded-xl p-3 focus:border-primary outline-none font-bold text-lg"
            />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1">Protéines (g)</label>
              <input 
                type="number" 
                value={goal.protein}
                onChange={e => setGoal({...goal, protein: parseInt(e.target.value) || 0})}
                className="w-full border-2 border-slate-200 rounded-xl p-2 focus:border-primary outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1">Glucides (g)</label>
              <input 
                type="number" 
                value={goal.carbs}
                onChange={e => setGoal({...goal, carbs: parseInt(e.target.value) || 0})}
                className="w-full border-2 border-slate-200 rounded-xl p-2 focus:border-primary outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1">Lipides (g)</label>
              <input 
                type="number" 
                value={goal.fat}
                onChange={e => setGoal({...goal, fat: parseInt(e.target.value) || 0})}
                className="w-full border-2 border-slate-200 rounded-xl p-2 focus:border-primary outline-none"
              />
            </div>
          </div>

          <button 
            type="submit" 
            className="w-full bg-primary text-white font-bold py-3 rounded-xl hover:bg-emerald-600 shadow-lg shadow-primary/20 flex items-center justify-center gap-2 mt-4"
          >
            <Save className="w-5 h-5" />
            Enregistrer
          </button>
        </form>
      </div>
    </div>
  );
};
