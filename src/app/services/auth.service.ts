import {
  Injectable,
  PLATFORM_ID,
  REQUEST,
  inject,
} from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, catchError, map, of, tap } from 'rxjs';
import { isPlatformBrowser } from '@angular/common';
import { User } from '../models/food';
import {
  TOKEN_STORAGE_KEY,
  USER_COOKIE,
  USER_STORAGE_KEY,
} from './auth-storage';

interface AuthResponse {
  token: string;
  user: User;
}

/**
 * سرویس احراز هویت متصل به بک‌اند NestJS.
 * - پروفایل کاربر هم در localStorage (کلاینت) و هم در یک کوکی (برای SSR) نگه‌داری می‌شود
 *   تا خروجی سرور و کلاینت یکسان باشند و هنگام رفرش صفحه لاگین فلش نزند.
 * - توکن JWT فقط در localStorage می‌ماند.
 */
@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly platformId = inject(PLATFORM_ID);
  private readonly http = inject(HttpClient);
  private readonly request = inject(REQUEST, { optional: true });

  private readonly userSubject = new BehaviorSubject<User | null>(
    this.restore(),
  );
  readonly user$: Observable<User | null> = this.userSubject.asObservable();
  readonly isLoggedIn$ = this.user$.pipe(map((u) => u !== null));

  login(email: string, password: string): Observable<User | null> {
    return this.http
      .post<AuthResponse>('/api/auth/login', { email, password })
      .pipe(
        tap((res) => this.persist(res.token, res.user)),
        map((res) => res.user),
        catchError(() => of(null)),
      );
  }

  register(
    email: string,
    password: string,
    name?: string,
  ): Observable<User | null> {
    return this.http
      .post<AuthResponse>('/api/auth/register', { email, password, name })
      .pipe(
        tap((res) => this.persist(res.token, res.user)),
        map((res) => res.user),
        catchError(() => of(null)),
      );
  }

  logout(): void {
    this.userSubject.next(null);
    if (isPlatformBrowser(this.platformId)) {
      localStorage.removeItem(TOKEN_STORAGE_KEY);
      localStorage.removeItem(USER_STORAGE_KEY);
      this.deleteCookie(USER_COOKIE);
    }
  }

  private persist(token: string, user: User): void {
    this.userSubject.next(user);
    if (isPlatformBrowser(this.platformId)) {
      localStorage.setItem(TOKEN_STORAGE_KEY, token);
      localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user));
      this.setCookie(USER_COOKIE, JSON.stringify(user));
    }
  }

  private restore(): User | null {
    if (isPlatformBrowser(this.platformId)) {
      return this.restoreFromLocalStorage();
    }
    return this.restoreFromCookie();
  }

  private restoreFromLocalStorage(): User | null {
    try {
      const raw = localStorage.getItem(USER_STORAGE_KEY);
      if (!raw) {
        return null;
      }
      const user = JSON.parse(raw) as User;
      // نشست‌های قدیمی ممکن است کوکی نداشته باشند؛ برای SSR همگامش می‌کنیم
      this.setCookie(USER_COOKIE, JSON.stringify(user));
      return user;
    } catch {
      return null;
    }
  }

  private restoreFromCookie(): User | null {
    try {
      const header = this.cookieHeader();
      if (!header) {
        return null;
      }
      const cookies: Record<string, string> = {};
      header.split(';').forEach((pair) => {
        const idx = pair.indexOf('=');
        if (idx < 0) {
          return;
        }
        cookies[pair.slice(0, idx).trim()] = pair.slice(idx + 1).trim();
      });
      const raw = cookies[USER_COOKIE];
      return raw ? (JSON.parse(decodeURIComponent(raw)) as User) : null;
    } catch {
      return null;
    }
  }

  /** خواندن هدر Cookie از شیء request (هم Express و هم Fetch Request) */
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

  private setCookie(name: string, value: string): void {
    document.cookie = `${name}=${encodeURIComponent(value)}; path=/; max-age=${60 * 60 * 24 * 30}; samesite=lax`;
  }

  private deleteCookie(name: string): void {
    document.cookie = `${name}=; path=/; max-age=0`;
  }
}
