import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, debounceTime, map } from 'rxjs';
import { FoodItem } from '../models/food';

/** کتابخانه غذاهای ایرانی با مقادیر تقریبی به ازای ۱۰۰ گرم */
const LIBRARY: FoodItem[] = [
  { id: 'rice', name: 'برنج پخته', calories: 130, protein: 2.7, carbs: 28, fat: 0.3 },
  { id: 'sangak', name: 'نان سنگک', calories: 260, protein: 8, carbs: 55, fat: 1 },
  { id: 'chicken', name: 'سینه مرغ کبابی', calories: 165, protein: 31, carbs: 0, fat: 3.6 },
  { id: 'egg', name: 'تخم‌مرغ آب‌پز', calories: 155, protein: 13, carbs: 1.1, fat: 11 },
  { id: 'beef', name: 'گوشت گوساله', calories: 250, protein: 26, carbs: 0, fat: 17 },
  { id: 'salmon', name: 'ماهی سالمون', calories: 208, protein: 20, carbs: 0, fat: 13 },
  { id: 'yogurt', name: 'ماست کم‌چرب', calories: 63, protein: 5, carbs: 7, fat: 2 },
  { id: 'milk', name: 'شیر کم‌چرب', calories: 46, protein: 3.4, carbs: 5, fat: 1 },
  { id: 'cheese', name: 'پنیر سفید', calories: 300, protein: 22, carbs: 2, fat: 23 },
  { id: 'potato', name: 'سیب‌زمینی آب‌پز', calories: 87, protein: 1.9, carbs: 20, fat: 0.1 },
  { id: 'pasta', name: 'ماکارونی پخته', calories: 131, protein: 5, carbs: 25, fat: 1.1 },
  { id: 'lentil', name: 'عدس پخته', calories: 116, protein: 9, carbs: 20, fat: 0.4 },
  { id: 'beans', name: 'لوبیا چیتی پخته', calories: 120, protein: 8.5, carbs: 21, fat: 0.5 },
  { id: 'apple', name: 'سیب', calories: 52, protein: 0.3, carbs: 14, fat: 0.2 },
  { id: 'banana', name: 'موز', calories: 89, protein: 1.1, carbs: 23, fat: 0.3 },
  { id: 'orange', name: 'پرتقال', calories: 47, protein: 0.9, carbs: 12, fat: 0.1 },
  { id: 'walnut', name: 'گردو', calories: 654, protein: 15, carbs: 14, fat: 65 },
  { id: 'almond', name: 'بادام', calories: 579, protein: 21, carbs: 22, fat: 50 },
  { id: 'pb', name: 'کره بادام‌زمینی', calories: 588, protein: 25, carbs: 20, fat: 50 },
  { id: 'chocolate', name: 'شکلات تلخ', calories: 546, protein: 4.9, carbs: 61, fat: 31 },
  { id: 'icecream', name: 'بستنی', calories: 207, protein: 3.5, carbs: 24, fat: 11 },
];

/**
 * سرویس کتابخانه غذاها.
 * جستجو با BehaviorSubject + debounceTime انجام می‌شود تا
 * با هر تایپ کاربر یک جریان فیلترشده جدید منتشر شود.
 */
@Injectable({ providedIn: 'root' })
export class FoodService {
  private readonly querySubject = new BehaviorSubject<string>('');
  readonly query$ = this.querySubject.asObservable();

  readonly results$: Observable<FoodItem[]> = this.querySubject.pipe(
    debounceTime(150),
    map((q) => this.filter(q)),
  );

  setQuery(query: string): void {
    this.querySubject.next(query.trim());
  }

  all(): FoodItem[] {
    return LIBRARY;
  }

  private filter(query: string): FoodItem[] {
    if (!query) {
      return LIBRARY;
    }
    const normalized = query.replace(/\s+/g, '');
    return LIBRARY.filter((f) =>
      f.name.replace(/\s+/g, '').includes(normalized),
    );
  }
}
