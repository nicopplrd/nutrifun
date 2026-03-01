import React, { useState } from 'react';
import { Recipe, FoodItem } from '../types';
import { Plus, Trash2, ChevronRight, Save, X } from 'lucide-react';

interface RecipeModalProps {
  isOpen: boolean;
  onClose: () => void;
  recipes: Recipe[];
  onAddRecipeToMeal: (recipe: Recipe) => void;
  onSaveRecipe: (recipe: Recipe) => void;
  onDeleteRecipe: (id: string) => void;
}

export const RecipeModal: React.FC<RecipeModalProps> = ({ 
  isOpen, 
  onClose, 
  recipes, 
  onAddRecipeToMeal, 
  onSaveRecipe, 
  onDeleteRecipe 
}) => {
  const [view, setView] = useState<'list' | 'create'>('list');
  const [newRecipeName, setNewRecipeName] = useState('');
  const [newRecipeItems, setNewRecipeItems] = useState<FoodItem[]>([]);
  
  // Temporary form for adding items to a recipe
  const [tempItem, setTempItem] = useState({
    name: '',
    calories: '',
    protein: '',
    carbs: '',
    fat: '',
    weight: ''
  });

  if (!isOpen) return null;

  const handleAddTempItem = () => {
    if (!tempItem.name) return;
    const quantityStr = tempItem.weight ? `${tempItem.weight}g` : '1 portion';
    const item: FoodItem = {
      id: crypto.randomUUID(),
      name: tempItem.name,
      calories: parseFloat(tempItem.calories) || 0,
      protein: parseFloat(tempItem.protein) || 0,
      carbs: parseFloat(tempItem.carbs) || 0,
      fat: parseFloat(tempItem.fat) || 0,
      quantity: quantityStr
    };
    setNewRecipeItems([...newRecipeItems, item]);
    setTempItem({ name: '', calories: '', protein: '', carbs: '', fat: '', weight: '' });
  };

  const handleSaveRecipe = () => {
    if (!newRecipeName || newRecipeItems.length === 0) return;
    
    const totalCalories = newRecipeItems.reduce((sum, item) => sum + item.calories, 0);
    const totalProtein = newRecipeItems.reduce((sum, item) => sum + item.protein, 0);
    const totalCarbs = newRecipeItems.reduce((sum, item) => sum + item.carbs, 0);
    const totalFat = newRecipeItems.reduce((sum, item) => sum + item.fat, 0);

    const recipe: Recipe = {
      id: crypto.randomUUID(),
      name: newRecipeName,
      items: newRecipeItems,
      totalCalories,
      totalProtein,
      totalCarbs,
      totalFat
    };

    onSaveRecipe(recipe);
    setNewRecipeName('');
    setNewRecipeItems([]);
    setView('list');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="bg-primary p-4 flex justify-between items-center text-white shrink-0">
          <h2 className="font-display font-bold text-xl">
            {view === 'list' ? 'Mes Recettes' : 'Nouvelle Recette'}
          </h2>
          <button onClick={onClose} className="p-1 hover:bg-white/20 rounded-full transition">
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4">
          {view === 'list' ? (
            <div className="space-y-4">
              <button 
                onClick={() => setView('create')}
                className="w-full py-3 border-2 border-dashed border-primary/50 rounded-xl text-primary font-bold flex items-center justify-center gap-2 hover:bg-primary/5 transition"
              >
                <Plus className="w-5 h-5" />
                Créer une recette
              </button>

              {recipes.length === 0 ? (
                <p className="text-center text-slate-400 py-8">Aucune recette enregistrée</p>
              ) : (
                <div className="space-y-2">
                  {recipes.map(recipe => (
                    <div key={recipe.id} className="bg-slate-50 p-3 rounded-xl border border-slate-100 flex justify-between items-center group hover:border-primary/30 transition">
                      <div className="flex-1 cursor-pointer" onClick={() => { onAddRecipeToMeal(recipe); onClose(); }}>
                        <h3 className="font-bold text-slate-700">{recipe.name}</h3>
                        <p className="text-xs text-slate-500">
                          {recipe.totalCalories} kcal • {recipe.items.length} ingrédients
                        </p>
                      </div>
                      <button 
                        onClick={() => onDeleteRecipe(recipe.id)}
                        className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              <input 
                type="text" 
                placeholder="Nom de la recette (ex: Pâtes Carbo)" 
                className="w-full border-2 border-slate-200 rounded-xl p-3 focus:border-primary outline-none font-bold"
                value={newRecipeName}
                onChange={e => setNewRecipeName(e.target.value)}
              />

              <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 space-y-3">
                <h4 className="text-sm font-bold text-slate-600">Ajouter un ingrédient</h4>
                <input 
                  type="text" 
                  placeholder="Ingrédient" 
                  className="w-full border border-slate-200 rounded-lg p-2 text-sm"
                  value={tempItem.name}
                  onChange={e => setTempItem({...tempItem, name: e.target.value})}
                />
                <input 
                  type="number" 
                  placeholder="Poids (g) - Optionnel" 
                  className="w-full border border-slate-200 rounded-lg p-2 text-sm"
                  value={tempItem.weight}
                  onChange={e => setTempItem({...tempItem, weight: e.target.value})}
                />
                <div className="grid grid-cols-4 gap-2">
                  <input type="number" placeholder="Kcal" className="border border-slate-200 rounded-lg p-2 text-sm"
                    value={tempItem.calories} onChange={e => setTempItem({...tempItem, calories: e.target.value})} />
                  <input type="number" placeholder="Prot" className="border border-slate-200 rounded-lg p-2 text-sm"
                    value={tempItem.protein} onChange={e => setTempItem({...tempItem, protein: e.target.value})} />
                  <input type="number" placeholder="Glu" className="border border-slate-200 rounded-lg p-2 text-sm"
                    value={tempItem.carbs} onChange={e => setTempItem({...tempItem, carbs: e.target.value})} />
                  <input type="number" placeholder="Lip" className="border border-slate-200 rounded-lg p-2 text-sm"
                    value={tempItem.fat} onChange={e => setTempItem({...tempItem, fat: e.target.value})} />
                </div>
                <button 
                  onClick={handleAddTempItem}
                  disabled={!tempItem.name}
                  className="w-full py-2 bg-slate-200 text-slate-600 rounded-lg font-bold text-sm hover:bg-slate-300 disabled:opacity-50"
                >
                  Ajouter l'ingrédient
                </button>
              </div>

              {/* List of added items */}
              {newRecipeItems.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-sm font-bold text-slate-600">Ingrédients ({newRecipeItems.length})</h4>
                  {newRecipeItems.map((item, idx) => (
                    <div key={idx} className="flex justify-between items-center text-sm bg-white p-2 rounded border border-slate-100">
                      <span>{item.name}</span>
                      <span className="text-slate-400">{item.calories} kcal</span>
                    </div>
                  ))}
                </div>
              )}

              <div className="flex gap-2 pt-4">
                <button 
                  onClick={() => setView('list')}
                  className="flex-1 py-3 border border-slate-200 rounded-xl font-bold text-slate-600 hover:bg-slate-50"
                >
                  Annuler
                </button>
                <button 
                  onClick={handleSaveRecipe}
                  disabled={!newRecipeName || newRecipeItems.length === 0}
                  className="flex-1 py-3 bg-primary text-white rounded-xl font-bold hover:bg-emerald-600 disabled:opacity-50 shadow-lg shadow-primary/20"
                >
                  Sauvegarder
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
