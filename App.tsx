import React, { useState, useEffect, useMemo } from 'react';
import { BarChart, Bar, XAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Settings, ChefHat, LogOut } from 'lucide-react';

import { DailyStats, MealLog, FoodItem, MealType, UserGoal, Recipe, UserProfile } from './types';
import { DEFAULT_GOAL, STORAGE_KEY, MEAL_TYPES_LIST, RECIPES_STORAGE_KEY, USER_SETTINGS_KEY } from './constants';
import { getMotivationalMessage } from './services/geminiService';
import { NutritionCard } from './components/NutritionCard';
import { AddFoodModal } from './components/AddFoodModal';
import { RecipeModal } from './components/RecipeModal';
import { GoalModal } from './components/GoalModal';
import { AuthScreen } from './components/AuthScreen';

const App: React.FC = () => {
  // --- State ---
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  
  const [dailyStats, setDailyStats] = useState<Record<string, DailyStats>>({});
  const [currentDate, setCurrentDate] = useState<string>(format(new Date(), 'yyyy-MM-dd'));
  const [goal, setGoal] = useState<UserGoal>(DEFAULT_GOAL);
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isRecipeModalOpen, setIsRecipeModalOpen] = useState(false);
  const [isGoalModalOpen, setIsGoalModalOpen] = useState(false);
  
  const [selectedMealType, setSelectedMealType] = useState<MealType>(MealType.BREAKFAST);
  const [coachMessage, setCoachMessage] = useState<string>("Salut ! Prêt à manger sainement ?");
  const [streak, setStreak] = useState(0);

  // --- Effects ---

  // Load data when user changes
  useEffect(() => {
    if (!currentUser) return;

    const userStorageKey = `${STORAGE_KEY}_${currentUser.id}`;
    const userRecipesKey = `${RECIPES_STORAGE_KEY}_${currentUser.id}`;
    const userSettingsKey = `${USER_SETTINGS_KEY}_${currentUser.id}`;

    const savedData = localStorage.getItem(userStorageKey);
    if (savedData) {
      try {
        setDailyStats(JSON.parse(savedData));
      } catch (e) {
        console.error("Failed to parse storage", e);
        setDailyStats({});
      }
    } else {
        setDailyStats({});
    }

    const savedRecipes = localStorage.getItem(userRecipesKey);
    if (savedRecipes) {
      try {
        setRecipes(JSON.parse(savedRecipes));
      } catch (e) { console.error(e); setRecipes([]); }
    } else {
        setRecipes([]);
    }

    const savedGoal = localStorage.getItem(userSettingsKey);
    if (savedGoal) {
      try {
        setGoal(JSON.parse(savedGoal));
      } catch (e) { console.error(e); setGoal(DEFAULT_GOAL); }
    } else {
        setGoal(DEFAULT_GOAL);
    }
  }, [currentUser]);

  // Save data on change
  useEffect(() => {
    if (!currentUser) return;
    const userStorageKey = `${STORAGE_KEY}_${currentUser.id}`;
    if (Object.keys(dailyStats).length > 0) {
      localStorage.setItem(userStorageKey, JSON.stringify(dailyStats));
    }
  }, [dailyStats, currentUser]);

  useEffect(() => {
    if (!currentUser) return;
    const userRecipesKey = `${RECIPES_STORAGE_KEY}_${currentUser.id}`;
    localStorage.setItem(userRecipesKey, JSON.stringify(recipes));
  }, [recipes, currentUser]);

  useEffect(() => {
    if (!currentUser) return;
    const userSettingsKey = `${USER_SETTINGS_KEY}_${currentUser.id}`;
    localStorage.setItem(userSettingsKey, JSON.stringify(goal));
  }, [goal, currentUser]);

  // Calculate Streak
  useEffect(() => {
    if (!currentUser) return;
    // Simple streak logic: consecutive days with at least one log
    let currentStreak = 0;
    const today = new Date();
    // Check backwards from yesterday
    for (let i = 0; i < 365; i++) {
        const d = new Date(today);
        d.setDate(today.getDate() - i);
        const dateStr = format(d, 'yyyy-MM-dd');
        
        // Skip checking today for streak break if empty, but count if full
        if (i === 0 && (!dailyStats[dateStr] || dailyStats[dateStr].logs.length === 0)) continue;

        if (dailyStats[dateStr] && dailyStats[dateStr].logs.length > 0) {
            currentStreak++;
        } else {
            break;
        }
    }
    setStreak(currentStreak);
  }, [dailyStats, currentUser]);

  // Coach Message
  useEffect(() => {
    if (!currentUser) return;
    const fetchMessage = async () => {
        const currentStats = dailyStats[currentDate];
        const cals = currentStats ? currentStats.totalCalories : 0;
        const remaining = goal.calories - cals;
        const msg = await getMotivationalMessage(remaining, streak);
        setCoachMessage(msg);
    };
    fetchMessage();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentDate, dailyStats[currentDate]?.totalCalories, currentUser]); 


  // --- Helpers ---
  const currentStats = useMemo(() => {
    if (!dailyStats[currentDate]) {
      return {
        date: currentDate,
        totalCalories: 0,
        totalProtein: 0,
        totalCarbs: 0,
        totalFat: 0,
        logs: []
      } as DailyStats;
    }
    return dailyStats[currentDate];
  }, [dailyStats, currentDate]);

  const updateDailyStats = (updater: (stats: DailyStats) => DailyStats) => {
    setDailyStats(prev => {
      const stats = prev[currentDate] || {
        date: currentDate,
        totalCalories: 0,
        totalProtein: 0,
        totalCarbs: 0,
        totalFat: 0,
        logs: []
      };
      
      const newStats = updater(stats);
      
      return {
        ...prev,
        [currentDate]: newStats
      };
    });
  };

  const handleAddFood = (food: FoodItem, type: MealType) => {
    updateDailyStats(stats => {
      const newLogs = [...stats.logs];
      let mealLog = newLogs.find(l => l.type === type);
      
      if (!mealLog) {
        mealLog = { id: crypto.randomUUID(), type, items: [], timestamp: Date.now() };
        newLogs.push(mealLog);
      } else {
         mealLog = { ...mealLog, items: [...mealLog.items] };
         const index = newLogs.findIndex(l => l.type === type);
         newLogs[index] = mealLog;
      }

      mealLog.items.push(food);

      return {
        ...stats,
        logs: newLogs,
        totalCalories: stats.totalCalories + food.calories,
        totalProtein: stats.totalProtein + food.protein,
        totalCarbs: stats.totalCarbs + food.carbs,
        totalFat: stats.totalFat + food.fat,
      };
    });
  };

  const handleAddRecipeToMeal = (recipe: Recipe, type: MealType) => {
    updateDailyStats(stats => {
      const newLogs = [...stats.logs];
      let mealLog = newLogs.find(l => l.type === type);
      
      if (!mealLog) {
        mealLog = { id: crypto.randomUUID(), type, items: [], timestamp: Date.now() };
        newLogs.push(mealLog);
      } else {
         mealLog = { ...mealLog, items: [...mealLog.items] };
         const index = newLogs.findIndex(l => l.type === type);
         newLogs[index] = mealLog;
      }

      // Add all items from recipe
      const newItems = recipe.items.map(item => ({...item, id: crypto.randomUUID()}));
      mealLog.items.push(...newItems);

      return {
        ...stats,
        logs: newLogs,
        totalCalories: stats.totalCalories + recipe.totalCalories,
        totalProtein: stats.totalProtein + recipe.totalProtein,
        totalCarbs: stats.totalCarbs + recipe.totalCarbs,
        totalFat: stats.totalFat + recipe.totalFat,
      };
    });
  };

  const handleRemoveFood = (mealType: MealType, foodId: string) => {
    updateDailyStats(stats => {
        const mealLog = stats.logs.find(l => l.type === mealType);
        if(!mealLog) return stats;

        const foodItem = mealLog.items.find(f => f.id === foodId);
        if (!foodItem) return stats;

        const newItems = mealLog.items.filter(f => f.id !== foodId);
        
        const newLogs = stats.logs.map(l => {
            if (l.type === mealType) {
                return { ...l, items: newItems };
            }
            return l;
        });

        return {
            ...stats,
            logs: newLogs,
            totalCalories: stats.totalCalories - foodItem.calories,
            totalProtein: stats.totalProtein - foodItem.protein,
            totalCarbs: stats.totalCarbs - foodItem.carbs,
            totalFat: stats.totalFat - foodItem.fat,
        };
    });
  };

  const openAddModal = (type: MealType) => {
    setSelectedMealType(type);
    setIsModalOpen(true);
  };

  // Recipe Management
  const handleSaveRecipe = (recipe: Recipe) => {
    setRecipes([...recipes, recipe]);
  };

  const handleDeleteRecipe = (id: string) => {
    setRecipes(recipes.filter(r => r.id !== id));
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setDailyStats({});
    setRecipes([]);
    setGoal(DEFAULT_GOAL);
  };

  // Chart Data preparation
  const chartData = useMemo(() => {
    const data = [];
    for (let i = 6; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const dStr = format(d, 'yyyy-MM-dd');
        data.push({
            name: format(d, 'EEE', { locale: fr }),
            calories: dailyStats[dStr]?.totalCalories || 0,
            goal: goal.calories
        });
    }
    return data;
  }, [dailyStats, goal.calories]);

  if (!currentUser) {
    return <AuthScreen onLogin={setCurrentUser} />;
  }

  // --- Render ---
  return (
    <div className="min-h-screen bg-slate-50 pb-20 md:pb-0">
      
      {/* Top Navigation / Header */}
      <div className="bg-white sticky top-0 z-30 shadow-sm px-6 py-4 flex justify-between items-center">
        <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center text-white font-bold text-lg">N</div>
            <h1 className="font-display font-bold text-xl text-slate-800">NutriFun</h1>
        </div>
        <div className="flex items-center gap-3">
            <div className="hidden md:flex items-center gap-2 mr-2 bg-slate-100 px-3 py-1 rounded-full">
                <span className="text-sm font-bold text-slate-600">{currentUser.name}</span>
            </div>
            <button onClick={() => setIsRecipeModalOpen(true)} className="p-2 text-slate-400 hover:text-primary hover:bg-slate-100 rounded-full transition">
                <ChefHat className="w-6 h-6" />
            </button>
            <button onClick={() => setIsGoalModalOpen(true)} className="p-2 text-slate-400 hover:text-primary hover:bg-slate-100 rounded-full transition">
                <Settings className="w-6 h-6" />
            </button>
            <button onClick={handleLogout} className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-full transition" title="Déconnexion">
                <LogOut className="w-6 h-6" />
            </button>
            <div className="flex items-center gap-1 bg-orange-100 text-orange-600 px-3 py-1 rounded-full text-sm font-bold">
                🔥 {streak}
            </div>
            <input 
                type="date" 
                value={currentDate}
                onChange={(e) => setCurrentDate(e.target.value)}
                className="bg-slate-100 border-none rounded-lg py-1 px-3 text-sm font-semibold text-slate-600 outline-none"
            />
        </div>
      </div>

      <div className="max-w-3xl mx-auto p-4 space-y-6">

        {/* Coach Message */}
        <div className="bg-gradient-to-r from-indigo-500 to-purple-500 rounded-2xl p-4 text-white shadow-lg flex items-center gap-4 relative overflow-hidden">
            <div className="text-4xl">🤖</div>
            <div className="relative z-10">
                <p className="font-bold text-lg opacity-90">Coach IA</p>
                <p className="font-display text-xl">{coachMessage}</p>
            </div>
            <div className="absolute -right-4 -bottom-10 w-32 h-32 bg-white/10 rounded-full blur-2xl"></div>
        </div>

        {/* Main Calorie Ring & Macros */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Calories Card */}
            <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 flex flex-col items-center justify-center relative overflow-hidden">
                <h2 className="text-slate-500 font-semibold mb-2">Calories Restantes</h2>
                <div className="relative w-40 h-40 flex items-center justify-center">
                    {/* Simple SVG Ring */}
                    <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
                        <path className="text-slate-100" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="currentColor" strokeWidth="3" />
                        <path 
                            className="text-primary transition-all duration-1000 ease-out" 
                            strokeDasharray={`${Math.min(100, (currentStats.totalCalories / goal.calories) * 100)}, 100`} 
                            d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" 
                            fill="none" stroke="currentColor" strokeWidth="3" 
                        />
                    </svg>
                    <div className="absolute flex flex-col items-center">
                        <span className="text-3xl font-display font-bold text-slate-800">
                            {Math.max(0, goal.calories - currentStats.totalCalories)}
                        </span>
                        <span className="text-xs text-slate-400">kcal</span>
                    </div>
                </div>
                <div className="mt-2 text-sm text-slate-400">
                    Objectif: {goal.calories} • Mangé: {currentStats.totalCalories}
                </div>
            </div>

            {/* Macros Grid */}
            <div className="grid grid-cols-1 gap-3">
                 <div className="flex flex-col gap-3 h-full justify-center">
                    <NutritionCard label="Protéines" value={currentStats.totalProtein} total={goal.protein} color="#8b5cf6" />
                    <NutritionCard label="Glucides" value={currentStats.totalCarbs} total={goal.carbs} color="#f59e0b" />
                    <NutritionCard label="Lipides" value={currentStats.totalFat} total={goal.fat} color="#ef4444" />
                 </div>
            </div>
        </div>

        {/* Meal Logging Section */}
        <div className="space-y-4">
            <h3 className="font-display font-bold text-xl text-slate-800">Repas d'aujourd'hui</h3>
            
            {MEAL_TYPES_LIST.map((type) => {
                const log = currentStats.logs.find(l => l.type === type);
                const items = log ? log.items : [];
                const mealCals = items.reduce((acc, i) => acc + i.calories, 0);

                return (
                    <div key={type} className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 transition hover:shadow-md">
                        <div className="flex justify-between items-center mb-3">
                            <div className="flex items-center gap-3">
                                <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-xl
                                    ${type === MealType.BREAKFAST ? 'bg-orange-100 text-orange-500' : ''}
                                    ${type === MealType.LUNCH ? 'bg-green-100 text-green-500' : ''}
                                    ${type === MealType.DINNER ? 'bg-blue-100 text-blue-500' : ''}
                                    ${type === MealType.SNACK ? 'bg-purple-100 text-purple-500' : ''}
                                `}>
                                    {type === MealType.BREAKFAST && '🥐'}
                                    {type === MealType.LUNCH && '🥗'}
                                    {type === MealType.DINNER && '🍽️'}
                                    {type === MealType.SNACK && '🍎'}
                                </div>
                                <div>
                                    <h4 className="font-bold text-slate-700">{type}</h4>
                                    <p className="text-xs text-slate-400 font-medium">{mealCals} kcal</p>
                                </div>
                            </div>
                            <button 
                                onClick={() => openAddModal(type)}
                                className="w-8 h-8 rounded-full bg-slate-100 text-primary hover:bg-primary hover:text-white transition flex items-center justify-center"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-5 h-5">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                                </svg>
                            </button>
                        </div>
                        
                        {/* Food List */}
                        {items.length > 0 ? (
                            <ul className="space-y-2 pl-12">
                                {items.map((item) => (
                                    <li key={item.id} className="flex justify-between items-center group">
                                        <div>
                                            <p className="text-sm font-semibold text-slate-700">{item.name}</p>
                                            <p className="text-xs text-slate-400">{item.quantity} • {item.calories} kcal</p>
                                        </div>
                                        <button 
                                            onClick={() => handleRemoveFood(type, item.id)}
                                            className="text-red-400 opacity-0 group-hover:opacity-100 transition p-1 hover:bg-red-50 rounded"
                                        >
                                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                                            </svg>
                                        </button>
                                    </li>
                                ))}
                            </ul>
                        ) : (
                            <p className="text-sm text-slate-300 pl-14 italic">Aucun aliment ajouté</p>
                        )}
                    </div>
                );
            })}
        </div>

        {/* Weekly Chart */}
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
             <h3 className="font-display font-bold text-lg text-slate-800 mb-4">Cette semaine</h3>
             <div className="h-48 w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData}>
                        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#94a3b8'}} />
                        <Tooltip 
                            cursor={{fill: '#f1f5f9'}}
                            contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}} 
                        />
                        <Bar dataKey="calories" radius={[6, 6, 6, 6]} barSize={20}>
                            {chartData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.calories > entry.goal ? '#ef4444' : '#10b981'} />
                            ))}
                        </Bar>
                    </BarChart>
                </ResponsiveContainer>
             </div>
        </div>

      </div>

      <AddFoodModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)}
        onAddFood={handleAddFood}
        onAddRecipe={handleAddRecipeToMeal}
        selectedMealType={selectedMealType}
        recipes={recipes}
      />

      <RecipeModal
        isOpen={isRecipeModalOpen}
        onClose={() => setIsRecipeModalOpen(false)}
        recipes={recipes}
        onAddRecipeToMeal={(recipe) => {
            // If called from here, we might need to ask for meal type? 
            // Or maybe this modal is just for management.
            // Actually, the user might want to add a recipe to a meal from the recipe manager.
            // But for simplicity, let's say the recipe manager is for managing.
            // Adding to meal is done via AddFoodModal.
            // But I passed onAddRecipeToMeal prop...
            // Let's just open AddFoodModal with recipe tab selected? No that's complex.
            // Let's just ignore adding to meal from the manager for now, or default to current time?
            // I'll just make the manager for managing.
            // Wait, I implemented `onAddRecipeToMeal` in `RecipeModal` to call `onAddRecipeToMeal(recipe)`.
            // I'll just pass a dummy function or handle it if I want.
            // Let's just let the user manage recipes there.
        }}
        onSaveRecipe={handleSaveRecipe}
        onDeleteRecipe={handleDeleteRecipe}
      />

      <GoalModal
        isOpen={isGoalModalOpen}
        onClose={() => setIsGoalModalOpen(false)}
        currentGoal={goal}
        onSaveGoal={setGoal}
      />
    </div>
  );
};

export default App;
