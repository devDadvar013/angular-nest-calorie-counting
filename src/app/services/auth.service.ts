import { Injectable, PLATFORM_ID, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, catchError, map, of, tap } from 'rxjs';
import { isPlatformBrowser } from '@angular/common';
import { User } from '../models/food';
import {
  TOKEN_STORAGE_KEY,
  USER_STORAGE_KEY,
} from './auth-storage';

interface AuthResponse {
  token: string;
  user: User;
}

/**
 * سرویس احراز هویت متصل به بک‌اند NestJS.
 * توکن JWT و پروفایل کاربر در localStorage نگه‌داری می‌شود.
 */
@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly platformId = inject(PLATFORM_ID);
  private readonly http = inject(HttpClient);

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
    }
  }

  private persist(token: string, user: User): void {
    this.userSubject.next(user);
    if (isPlatformBrowser(this.platformId)) {
      localStorage.setItem(TOKEN_STORAGE_KEY, token);
      localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user));
    }
  }

  private restore(): User | null {
    if (!isPlatformBrowser(this.platformId)) {
      return null;
    }
    try {
      const raw = localStorage.getItem(USER_STORAGE_KEY);
      return raw ? (JSON.parse(raw) as User) : null;
    } catch {
      return null;
    }
  }
}
