export enum MealType {
  BREAKFAST = 'Petit Déjeuner',
  LUNCH = 'Déjeuner',
  DINNER = 'Dîner',
  SNACK = 'En-cas'
}

export interface FoodItem {
  id: string;
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  quantity?: string;
}

export interface MealLog {
  id: string;
  type: MealType;
  items: FoodItem[];
  timestamp: number;
}

export interface DailyStats {
  date: string; // YYYY-MM-DD
  totalCalories: number;
  totalProtein: number;
  totalCarbs: number;
  totalFat: number;
  logs: MealLog[];
}

export interface Recipe {
  id: string;
  name: string;
  items: FoodItem[];
  totalCalories: number;
  totalProtein: number;
  totalCarbs: number;
  totalFat: number;
}

export interface UserGoal {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}
