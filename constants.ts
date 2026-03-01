import { MealType, UserGoal } from './types';

export const DEFAULT_GOAL: UserGoal = {
  calories: 2000,
  protein: 150,
  carbs: 200,
  fat: 70
};

export const MEAL_TYPES_LIST = [
  MealType.BREAKFAST,
  MealType.LUNCH,
  MealType.DINNER,
  MealType.SNACK
];

export const STORAGE_KEY = 'nutrifun_data_v1';
export const USER_SETTINGS_KEY = 'nutrifun_settings_v1';
export const RECIPES_STORAGE_KEY = 'nutrifun_recipes_v1';
