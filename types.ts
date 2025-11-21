export interface UserProfile {
  id: string;
  email?: string;
}

export interface Exercise {
  id: number;
  user_id: string;
  nombre: string;
  created_at: string;
}

export interface WorkoutSet {
  id?: number;
  user_id: string;
  WorkoutID: string;
  Date: string; // DD/MM/YYYY
  Exercise: string;
  SetNumber: number;
  Reps: number;
  Weight: number;
  Timestamp?: string;
}

export interface DietDay {
  day: string;
  meals: {
    name: string;
    time: string;
    description: string;
    macros: { k: number; p: number; c: number; f: number };
  }[];
}

export interface MacroTarget {
  calories: number;
  protein: number;
  fat: number;
  carbs: number;
}

export interface WeightEntry {
    date: string; // ISO format YYYY-MM-DD
    weight: number;
}