/** یک ماده غذایی در کتابخانه (مقادیر به ازای ۱۰۰ گرم) */
export interface FoodItem {
  id: string;
  name: string;
  /** کالری به ازای ۱۰۰ گرم */
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

/** یک وعده ثبت‌شده برای یک روز خاص */
export interface FoodEntry {
  id: string;
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  /** کلید روز به شکل YYYY-MM-DD */
  date: string;
}

/** جمع‌های محاسبه‌شده برای یک روز */
export interface DayTotals {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  /** کالری باقی‌مانده تا هدف (می‌تواند منفی شود) */
  remaining: number;
  /** درصد پیشرفت نسبت به هدف */
  percent: number;
  /** سهم هر درشت‌مغذی از کالری مصرف‌شده (درصد) */
  macroPercent: { protein: number; carbs: number; fat: number };
}

export interface User {
  id?: string;
  email: string;
  name: string;
}
