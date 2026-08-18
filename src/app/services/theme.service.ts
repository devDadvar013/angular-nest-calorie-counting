import { Injectable, PLATFORM_ID, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { isPlatformBrowser } from '@angular/common';
import { BehaviorSubject, map, Observable } from 'rxjs';

export type Theme = 'light' | 'dark';

const STORAGE_KEY = 'calorie-counter.theme';

/**
 * مدیریت تم روشن/تاریک با RxJS.
 * - حالت در `localStorage` و در غیر این صورت در ترجیح سیستم (prefers-color-scheme) ذخیره می‌شود
 * - کلاس `dark` روی <html> اعمال می‌شود و Tailwind با `dark:` از آن استفاده می‌کند
 * - مقدار اولیه «dark» است تا خروجی SSR و اولین رندر کلاینت یکسان باشند و
 *   ترجیح کاربر به‌صورت غیرهمزمان (بعد از هیدریشن) اعمال می‌شود
 */
@Injectable({ providedIn: 'root' })
export class ThemeService {
  private readonly platformId = inject(PLATFORM_ID);

  private readonly themeSubject = new BehaviorSubject<Theme>('dark');
  readonly theme$: Observable<Theme> = this.themeSubject.asObservable();
  readonly isDark$ = this.theme$.pipe(map((t) => t === 'dark'));

  constructor() {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }
    // ترجیح ذخیره‌شده یا سیستم را بعد از رندر اولیه اعمال می‌کنیم
    setTimeout(() => {
      const pref = this.preference();
      if (pref !== this.themeSubject.getValue()) {
        this.themeSubject.next(pref);
      }
    }, 0);

    this.theme$.pipe(takeUntilDestroyed()).subscribe((theme) => {
      document.documentElement.classList.toggle('dark', theme === 'dark');
      document.documentElement.style.colorScheme = theme;
      localStorage.setItem(STORAGE_KEY, theme);
    });
  }

  toggle(): void {
    this.themeSubject.next(
      this.themeSubject.getValue() === 'dark' ? 'light' : 'dark',
    );
  }

  private preference(): Theme {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored === 'light' || stored === 'dark') {
        return stored;
      }
      return window.matchMedia('(prefers-color-scheme: dark)').matches
        ? 'dark'
        : 'light';
    } catch {
      return 'dark';
    }
  }
}
