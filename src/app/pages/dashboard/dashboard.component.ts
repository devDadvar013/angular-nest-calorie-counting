import { Component, PLATFORM_ID, inject } from '@angular/core';
import { AsyncPipe, isPlatformBrowser } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import {
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { map, startWith, take } from 'rxjs';
import { AuthService } from '../../services/auth.service';
import { CalorieStore } from '../../services/calorie-store.service';
import { FoodService } from '../../services/food.service';
import { FaNumPipe } from '../../pipes/fa-num.pipe';
import { Navbar } from '../../components/navbar/navbar.component';
import { FoodItem } from '../../models/food';

@Component({
  selector: 'app-dashboard',
  imports: [
    AsyncPipe,
    ReactiveFormsModule,
    FaNumPipe,
    Navbar,
  ],
  templateUrl: './dashboard.component.html',
})
export class DashboardPage {
  private readonly store = inject(CalorieStore);
  private readonly foodService = inject(FoodService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly platformId = inject(PLATFORM_ID);

  readonly user$ = inject(AuthService).user$;
  readonly totals$ = this.store.totals$;
  readonly goal$ = this.store.goal$;
  readonly entries$ = this.store.todayEntries$;
  readonly searchResults$ = this.foodService.results$;
  readonly searchQuery$ = this.foodService.query$;

  readonly todayLabel = new Intl.DateTimeFormat('fa-IR-u-ca-persian', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  }).format(new Date());

  readonly customForm = new FormGroup({
    name: new FormControl('', [Validators.required]),
    calories: new FormControl(0, [Validators.required, Validators.min(1)]),
    protein: new FormControl(0, [Validators.min(0)]),
    carbs: new FormControl(0, [Validators.min(0)]),
    fat: new FormControl(0, [Validators.min(0)]),
  });

  readonly goalForm = new FormGroup({
    goal: new FormControl(2000, [Validators.required, Validators.min(100)]),
  });

  /** اهداف پیشنهادی سریع */
  readonly goalPresets = [1500, 1800, 2000, 2200, 2500];

  constructor() {
    // همگام‌سازی مقدار فعلی هدف با فرم تنظیمات
    this.store.goal$
      .pipe(takeUntilDestroyed())
      .subscribe((goal) => this.goalForm.patchValue({ goal }));

    // بعد از افزودن از صفحه فهرست غذاها، روی همان آیتم اسکرول و هایلایت کن
    if (isPlatformBrowser(this.platformId)) {
      this.route.queryParams.pipe(take(1)).subscribe((params) => {
        const id = params['highlight'] as string | undefined;
        if (!id) {
          return;
        }
        // پاک کردن کوئری از URL بدون ری‌لود
        this.router.navigate([], {
          queryParams: { highlight: null },
          replaceUrl: true,
        });
        setTimeout(() => this.scrollToEntry(id), 0);
      });
    }
  }

  /** پیش‌نمایش زنده غذای سفارشی هنگام تایپ */
  readonly customPreview$ = this.customForm.valueChanges.pipe(
    startWith(this.customForm.value),
    map((v) => ({
      name: (v.name ?? '').trim(),
      calories: Number(v.calories) || 0,
      protein: Number(v.protein) || 0,
      carbs: Number(v.carbs) || 0,
      fat: Number(v.fat) || 0,
    })),
  );

  onSearch(event: Event): void {
    this.foodService.setQuery((event.target as HTMLInputElement).value);
  }

  clearSearch(): void {
    this.foodService.setQuery('');
  }

  /** اسکرول نرم به آیتم تازه‌افزوده‌شده و هایلایت موقت آن */
  scrollToEntry(id: string): void {
    const el = document.querySelector<HTMLElement>(`[data-entry-id="${id}"]`);
    if (!el) {
      return;
    }
    el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    el.classList.add('entry-highlight');
    setTimeout(() => el.classList.remove('entry-highlight'), 2200);
  }

  addFromLibrary(item: FoodItem): void {
    const id = this.store.addEntry({
      name: item.name,
      calories: item.calories,
      protein: item.protein,
      carbs: item.carbs,
      fat: item.fat,
    });
    // اسکرول و هایلایت آیتم تازه‌افزوده‌شده در «غذای امروز»
    setTimeout(() => this.scrollToEntry(id), 0);
  }

  addCustom(): void {
    if (this.customForm.invalid) {
      return;
    }
    const v = this.customForm.value;
    const id = this.store.addEntry({
      name: v.name?.trim() ?? '',
      calories: Number(v.calories),
      protein: Number(v.protein),
      carbs: Number(v.carbs),
      fat: Number(v.fat),
    });
    this.customForm.reset({ calories: 0, protein: 0, carbs: 0, fat: 0 });
    setTimeout(() => this.scrollToEntry(id), 0);
  }

  remove(id: string): void {
    this.store.removeEntry(id);
  }

  clearToday(): void {
    this.store.clearToday();
  }

  saveGoal(): void {
    this.store.setGoal(Number(this.goalForm.value.goal));
  }

  /** اعمال و ذخیره سریع یکی از اهداف پیشنهادی */
  applyGoalPreset(goal: number): void {
    this.goalForm.patchValue({ goal });
    this.saveGoal();
  }

  /** استایل دکمه‌های پیشنهادی بر اساس هدف فعلی */
  presetClass(preset: number, current: number | null): string {
    const base = 'rounded-lg border px-2.5 py-1 text-xs font-semibold transition';
    return preset === current
      ? `${base} border-emerald-500 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400`
      : `${base} border-slate-200 text-slate-500 hover:border-emerald-500/50 hover:text-emerald-600 dark:border-slate-700 dark:text-slate-400 dark:hover:border-emerald-500/40 dark:hover:text-emerald-400`;
  }

  /** رنگ نوار پیشرفت بر اساس میزان مصرف */
  barColor(percent: number): string {
    if (percent > 100) {
      return 'bg-rose-500';
    }
    if (percent > 80) {
      return 'bg-amber-500';
    }
    return 'bg-emerald-500';
  }

  /** عرض نوار پیشرفت (حداکثر ۱۰۰٪) */
  barWidth(percent: number): number {
    return Math.min(percent, 100);
  }

  remainingClass(remaining: number): string {
    return remaining < 0
      ? 'text-rose-600 dark:text-rose-400'
      : remaining === 0
        ? 'text-amber-600 dark:text-amber-400'
        : 'text-emerald-600 dark:text-emerald-400';
  }
}
