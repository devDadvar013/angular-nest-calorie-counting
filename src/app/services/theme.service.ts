import { Injectable, PLATFORM_ID, REQUEST, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { isPlatformBrowser } from '@angular/common';
import { BehaviorSubject, map, Observable } from 'rxjs';

export type Theme = 'light' | 'dark';

const STORAGE_KEY = 'calorie-counter.theme';
const THEME_COOKIE = 'calorie-counter.theme';

/**
 * مدیریت تم روشن/تاریک با RxJS.
 * - در مرورگر مقدار اولیه به‌صورت همگام از localStorage (یا ترجیح سیستم) خوانده می‌شود
 * - در سرور از کوکی خوانده می‌شود تا خروجی SSR و کلاینت یکسان باشند
 * - کلاس `dark` روی <html> اعمال می‌شود و Tailwind با `dark:` از آن استفاده می‌کند
 */
@Injectable({ providedIn: 'root' })
export class ThemeService {
  private readonly platformId = inject(PLATFORM_ID);
  private readonly request = inject(REQUEST, { optional: true });

  private readonly themeSubject = new BehaviorSubject<Theme>(
    isPlatformBrowser(this.platformId)
      ? this.readClient()
      : this.readServer(),
  );
  readonly theme$: Observable<Theme> = this.themeSubject.asObservable();
  readonly isDark$ = this.theme$.pipe(map((t) => t === 'dark'));

  constructor() {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }
    this.theme$.pipe(takeUntilDestroyed()).subscribe((theme) => {
      document.documentElement.classList.toggle('dark', theme === 'dark');
      document.documentElement.style.colorScheme = theme;
      localStorage.setItem(STORAGE_KEY, theme);
      this.setCookie(THEME_COOKIE, theme);
    });
  }

  toggle(): void {
    this.themeSubject.next(
      this.themeSubject.getValue() === 'dark' ? 'light' : 'dark',
    );
  }

  private readClient(): Theme {
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

  private readServer(): Theme {
    try {
      const value = this.parseCookies(this.cookieHeader())[THEME_COOKIE];
      return value === 'light' || value === 'dark' ? value : 'dark';
    } catch {
      return 'dark';
    }
  }

  private cookieHeader(): string {
    const req = this.request as
      | { headers?: { cookie?: string; get?: (k: string) => string | null } }
      | null
      | undefined;
    if (!req || !req.headers) {
      return '';
    }
    if (typeof req.headers.get === 'function') {
      return req.headers.get('cookie') ?? '';
    }
    return req.headers.cookie ?? '';
  }

  private parseCookies(header: string): Record<string, string> {
    const out: Record<string, string> = {};
    header.split(';').forEach((pair) => {
      const idx = pair.indexOf('=');
      if (idx < 0) {
        return;
      }
      out[pair.slice(0, idx).trim()] = pair.slice(idx + 1).trim();
    });
    return out;
  }

  private setCookie(name: string, value: string): void {
    document.cookie = `${name}=${encodeURIComponent(value)}; path=/; max-age=${60 * 60 * 24 * 365}; samesite=lax`;
  }
}
