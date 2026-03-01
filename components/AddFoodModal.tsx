import React, { useState } from 'react';
import { MealType, FoodItem, Recipe } from '../types';
import { analyzeFoodText } from '../services/geminiService';
import { BarcodeScanner } from './BarcodeScanner';
import { Scan, ChefHat, Sparkles, PenTool, X, Search } from 'lucide-react';

interface AddFoodModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddFood: (food: FoodItem, mealType: MealType) => void;
  onAddRecipe: (recipe: Recipe, mealType: MealType) => void;
  selectedMealType: MealType;
  recipes: Recipe[];
}

export const AddFoodModal: React.FC<AddFoodModalProps> = ({ 
  isOpen, 
  onClose, 
  onAddFood, 
  onAddRecipe,
  selectedMealType,
  recipes
}) => {
  const [inputMode, setInputMode] = useState<'ai' | 'manual' | 'barcode' | 'recipe'>('ai');
  const [aiInput, setAiInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [manualForm, setManualForm] = useState({
    name: '',
    calories: '',
    protein: '',
    carbs: '',
    fat: '',
    weight: ''
  });
  const [scannedProduct, setScannedProduct] = useState<FoodItem | null>(null);
  const [baseNutrition, setBaseNutrition] = useState<{calories: number, protein: number, carbs: number, fat: number} | null>(null);

  if (!isOpen) return null;

  const handleAiSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!aiInput.trim()) return;

    setIsLoading(true);
    const result = await analyzeFoodText(aiInput);
    setIsLoading(false);

    if (result) {
      onAddFood(result, selectedMealType);
      setAiInput('');
      onClose();
    } else {
      alert("Désolé, je n'ai pas pu comprendre cet aliment. Essayez manuellement.");
    }
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const quantityStr = manualForm.weight ? `${manualForm.weight}g` : '1 portion';
    const food: FoodItem = {
      id: crypto.randomUUID(),
      name: manualForm.name,
      calories: parseFloat(manualForm.calories) || 0,
      protein: parseFloat(manualForm.protein) || 0,
      carbs: parseFloat(manualForm.carbs) || 0,
      fat: parseFloat(manualForm.fat) || 0,
      quantity: quantityStr
    };
    onAddFood(food, selectedMealType);
    setManualForm({ name: '', calories: '', protein: '', carbs: '', fat: '', weight: '' });
    setBaseNutrition(null);
    onClose();
  };

  const handleWeightChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newWeight = e.target.value;
    const weightNum = parseFloat(newWeight);
    
    if (baseNutrition && !isNaN(weightNum)) {
        const ratio = weightNum / 100;
        setManualForm({
            ...manualForm,
            weight: newWeight,
            calories: Math.round(baseNutrition.calories * ratio).toString(),
            protein: (baseNutrition.protein * ratio).toFixed(1),
            carbs: (baseNutrition.carbs * ratio).toFixed(1),
            fat: (baseNutrition.fat * ratio).toFixed(1)
        });
    } else {
        setManualForm({ ...manualForm, weight: newWeight });
    }
  };

  const handleBarcodeScan = async (barcode: string) => {
    setIsLoading(true);
    try {
      const response = await fetch(`https://world.openfoodfacts.org/api/v0/product/${barcode}.json`);
      const data = await response.json();
      
      if (data.status === 1 && data.product) {
        const p = data.product;
        const base = {
            calories: p.nutriments['energy-kcal_100g'] || 0,
            protein: p.nutriments['proteins_100g'] || 0,
            carbs: p.nutriments['carbohydrates_100g'] || 0,
            fat: p.nutriments['fat_100g'] || 0
        };
        
        setBaseNutrition(base);
        setManualForm({
            name: p.product_name || 'Produit inconnu',
            calories: base.calories.toString(),
            protein: base.protein.toString(),
            carbs: base.carbs.toString(),
            fat: base.fat.toString(),
            weight: '100'
        });
        setInputMode('manual'); // Switch to manual to confirm/edit
      } else {
        alert("Produit non trouvé.");
      }
    } catch (e) {
      console.error(e);
      alert("Erreur lors de la récupération du produit.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="bg-primary p-4 flex justify-between items-center text-white shrink-0">
          <h2 className="font-display font-bold text-xl">Ajouter à {selectedMealType}</h2>
          <button onClick={onClose} className="p-1 hover:bg-white/20 rounded-full transition">
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex p-2 bg-slate-50 gap-1 overflow-x-auto shrink-0">
          <button onClick={() => setInputMode('ai')} className={`flex-1 py-2 px-3 rounded-xl text-sm font-bold transition-colors flex flex-col items-center gap-1 ${inputMode === 'ai' ? 'bg-white text-primary shadow-sm' : 'text-slate-400'}`}>
            <Sparkles className="w-5 h-5" /> IA
          </button>
          <button onClick={() => setInputMode('manual')} className={`flex-1 py-2 px-3 rounded-xl text-sm font-bold transition-colors flex flex-col items-center gap-1 ${inputMode === 'manual' ? 'bg-white text-primary shadow-sm' : 'text-slate-400'}`}>
            <PenTool className="w-5 h-5" /> Manuel
          </button>
          <button onClick={() => setInputMode('barcode')} className={`flex-1 py-2 px-3 rounded-xl text-sm font-bold transition-colors flex flex-col items-center gap-1 ${inputMode === 'barcode' ? 'bg-white text-primary shadow-sm' : 'text-slate-400'}`}>
            <Scan className="w-5 h-5" /> Scan
          </button>
          <button onClick={() => setInputMode('recipe')} className={`flex-1 py-2 px-3 rounded-xl text-sm font-bold transition-colors flex flex-col items-center gap-1 ${inputMode === 'recipe' ? 'bg-white text-primary shadow-sm' : 'text-slate-400'}`}>
            <ChefHat className="w-5 h-5" /> Recettes
          </button>
        </div>

        <div className="p-6 overflow-y-auto">
          {inputMode === 'ai' && (
            <form onSubmit={handleAiSubmit} className="flex flex-col gap-4">
              <label className="block">
                <span className="text-slate-600 font-medium mb-1 block">Que mangez-vous ?</span>
                <textarea 
                  value={aiInput}
                  onChange={(e) => setAiInput(e.target.value)}
                  placeholder="Ex: Une banane et un yaourt nature..."
                  className="w-full border-2 border-slate-200 rounded-xl p-3 focus:border-primary focus:ring-0 outline-none resize-none h-32 transition-colors"
                />
              </label>
              <button 
                type="submit" 
                disabled={isLoading || !aiInput.trim()}
                className="bg-primary text-white font-bold py-3 rounded-xl hover:bg-emerald-600 disabled:opacity-50 transition-all flex justify-center items-center gap-2"
              >
                {isLoading ? 'Analyse...' : 'Ajouter'}
              </button>
            </form>
          )}

          {inputMode === 'manual' && (
            <form onSubmit={handleManualSubmit} className="flex flex-col gap-3">
              <input 
                type="text" 
                placeholder="Nom de l'aliment" 
                className="border-2 border-slate-200 rounded-xl p-3 focus:border-primary outline-none"
                value={manualForm.name}
                onChange={e => setManualForm({...manualForm, name: e.target.value})}
                required
              />
              
              <div className="relative">
                <input 
                    type="number" 
                    placeholder="Poids (g) - Optionnel" 
                    className={`w-full border-2 rounded-xl p-3 focus:border-primary outline-none ${baseNutrition ? 'border-primary/30 bg-primary/5' : 'border-slate-200'}`}
                    value={manualForm.weight}
                    onChange={handleWeightChange}
                />
                {baseNutrition && <span className="absolute right-3 top-3.5 text-xs text-primary font-bold bg-white/50 px-2 rounded-full">Auto-calcul</span>}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <input type="number" placeholder="Calories (kcal)" className="border-2 border-slate-200 rounded-xl p-3 focus:border-primary outline-none"
                  value={manualForm.calories} onChange={e => setManualForm({...manualForm, calories: e.target.value})} required />
                <input type="number" placeholder="Protéines (g)" className="border-2 border-slate-200 rounded-xl p-3 focus:border-primary outline-none"
                   value={manualForm.protein} onChange={e => setManualForm({...manualForm, protein: e.target.value})} />
                <input type="number" placeholder="Glucides (g)" className="border-2 border-slate-200 rounded-xl p-3 focus:border-primary outline-none"
                   value={manualForm.carbs} onChange={e => setManualForm({...manualForm, carbs: e.target.value})} />
                <input type="number" placeholder="Lipides (g)" className="border-2 border-slate-200 rounded-xl p-3 focus:border-primary outline-none"
                   value={manualForm.fat} onChange={e => setManualForm({...manualForm, fat: e.target.value})} />
              </div>
              <button type="submit" className="bg-primary text-white font-bold py-3 rounded-xl hover:bg-emerald-600 mt-2">
                Enregistrer
              </button>
            </form>
          )}

          {inputMode === 'barcode' && (
            <div className="flex flex-col items-center gap-4">
              {isLoading ? (
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
              ) : (
                <>
                  <p className="text-sm text-slate-500 text-center mb-2">Scannez le code-barre de l'emballage</p>
                  <div className="w-full aspect-square bg-black rounded-2xl overflow-hidden relative">
                     <BarcodeScanner onScanSuccess={handleBarcodeScan} onScanFailure={(err) => {}} />
                  </div>
                </>
              )}
            </div>
          )}

          {inputMode === 'recipe' && (
            <div className="space-y-3">
              {recipes.length === 0 ? (
                <p className="text-center text-slate-400 py-4">Aucune recette disponible. Créez-en une depuis le menu principal.</p>
              ) : (
                recipes.map(recipe => (
                  <button 
                    key={recipe.id}
                    onClick={() => { onAddRecipe(recipe, selectedMealType); onClose(); }}
                    className="w-full text-left bg-slate-50 p-3 rounded-xl border border-slate-100 hover:border-primary hover:bg-primary/5 transition group"
                  >
                    <div className="flex justify-between items-center">
                      <span className="font-bold text-slate-700 group-hover:text-primary">{recipe.name}</span>
                      <span className="text-xs font-bold bg-white px-2 py-1 rounded-lg text-slate-500 shadow-sm">{recipe.totalCalories} kcal</span>
                    </div>
                    <p className="text-xs text-slate-400 mt-1">{recipe.items.length} ingrédients</p>
                  </button>
                ))
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
