import { Injectable, PLATFORM_ID, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { isPlatformBrowser } from '@angular/common';
import {
  BehaviorSubject,
  combineLatest,
  map,
  Observable,
  take,
} from 'rxjs';
import { DayTotals, FoodEntry } from '../models/food';
import { environment } from '../../environments/environment';
import { AuthService } from './auth.service';

/**
 * استور مرکزی کالری‌شمار با RxJS و همگام‌سازی با بک‌اند NestJS:
 * - entries$ و goal$ جریان‌های وضعیت هستند (BehaviorSubject)
 * - totals$ با combineLatest از ترکیب آن‌ها محاسبه می‌شود
 * - تغییرات به صورت خوش‌بینانه (optimistic) اعمال و همزمان به سرور ارسال می‌شود
 */
@Injectable({ providedIn: 'root' })
export class CalorieStore {
  private readonly platformId = inject(PLATFORM_ID);
  private readonly http = inject(HttpClient);
  private readonly auth = inject(AuthService);

  private readonly entriesSubject = new BehaviorSubject<FoodEntry[]>([]);
  readonly entries$ = this.entriesSubject.asObservable();

  private readonly goalSubject = new BehaviorSubject<number>(2000);
  readonly goal$: Observable<number> = this.goalSubject.asObservable();

  /** فقط وعده‌های امروز */
  readonly todayEntries$ = this.entries$.pipe(
    map((entries) => entries.filter((e) => e.date === this.todayKey())),
  );

  /** جمع کالری و درشت‌مغذی‌های امروز + پیشرفت نسبت به هدف */
  readonly totals$: Observable<DayTotals> = combineLatest([
    this.todayEntries$,
    this.goal$,
  ]).pipe(
    map(([entries, goal]) => {
      const sum = (pick: (e: FoodEntry) => number) =>
        entries.reduce((acc, e) => acc + pick(e), 0);
      const calories = sum((e) => e.calories);
      const protein = sum((e) => e.protein);
      const carbs = sum((e) => e.carbs);
      const fat = sum((e) => e.fat);
      const calFrom = (g: number, mult: number) =>
        calories > 0 ? Math.round(((g * mult) / calories) * 100) : 0;
      return {
        calories,
        protein,
        carbs,
        fat,
        remaining: goal - calories,
        percent: goal > 0 ? Math.round((calories / goal) * 100) : 0,
        macroPercent: {
          protein: calFrom(protein, 4),
          carbs: calFrom(carbs, 4),
          fat: calFrom(fat, 9),
        },
      };
    }),
  );

  constructor() {
    // با ورود/خروج کاربر، داده‌ها از سرور بارگذاری یا ریست می‌شوند
    this.auth.user$.subscribe((user) => {
      if (user) {
        this.loadFromServer();
      } else {
        this.entriesSubject.next([]);
        this.goalSubject.next(2000);
      }
    });
  }

  /** بارگذاری وعده‌های امروز و هدف از بک‌اند */
  private loadFromServer(): void {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }
    const params = { date: this.todayKey() };
    this.http
      .get<FoodEntry[]>(`${environment.apiUrl}/api/entries`, { params })
      .pipe(take(1))
      .subscribe({
        next: (entries) => this.entriesSubject.next(entries),
        error: () => this.entriesSubject.next([]),
      });
    this.http
      .get<{ goal: number }>(`${environment.apiUrl}/api/goal`)
      .pipe(take(1))
      .subscribe({
        next: (res) => this.goalSubject.next(res.goal),
        error: () => this.goalSubject.next(2000),
      });
  }

  addEntry(entry: Omit<FoodEntry, 'id' | 'date'>): string {
    const full: FoodEntry = {
      ...entry,
      id: this.uid(),
      date: this.todayKey(),
    };
    // به‌روزرسانی خوش‌بینانه
    this.entriesSubject.next([...this.entriesSubject.getValue(), full]);
    this.http
      .post<FoodEntry>(`${environment.apiUrl}/api/entries`, full)
      .pipe(take(1))
      .subscribe({
        error: () => this.loadFromServer(), // در صورت خطا، بازگشت به وضعیت سرور
      });
    return full.id;
  }

  removeEntry(id: string): void {
    this.entriesSubject.next(
      this.entriesSubject.getValue().filter((e) => e.id !== id),
    );
    this.http
      .delete(`${environment.apiUrl}/api/entries/${id}`)
      .pipe(take(1))
      .subscribe({
        error: () => this.loadFromServer(),
      });
  }

  clearToday(): void {
    const today = this.todayKey();
    this.entriesSubject.next(
      this.entriesSubject.getValue().filter((e) => e.date !== today),
    );
    this.http
      .delete(`${environment.apiUrl}/api/entries`, { params: { date: today } })
      .pipe(take(1))
      .subscribe({
        error: () => this.loadFromServer(),
      });
  }

  setGoal(goal: number): void {
    const value = Math.max(0, Math.round(goal));
    this.goalSubject.next(value);
    this.http
      .put<{ goal: number }>(`${environment.apiUrl}/api/goal`, { goal: value })
      .pipe(take(1))
      .subscribe({
        error: () => this.loadFromServer(),
      });
  }

  /** کلید روز محلی به شکل YYYY-MM-DD */
  todayKey(): string {
    return new Date().toLocaleDateString('en-CA');
  }

  private uid(): string {
    return (
      (globalThis.crypto?.randomUUID?.() as string | undefined) ??
      Math.random().toString(36).slice(2) + Date.now().toString(36)
    );
  }
}
