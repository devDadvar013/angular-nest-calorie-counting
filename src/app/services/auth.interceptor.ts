import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { PLATFORM_ID } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import {
  TOKEN_STORAGE_KEY,
  USER_STORAGE_KEY,
} from './auth-storage';

/**
 * اینترسپتور سراسری HTTP:
 * - توکن JWT را به درخواست‌های /api اضافه می‌کند (فقط سمت مرورگر)
 * - در صورت دریافت 401 (توکن نامعتبر)، نشست را پاک و کاربر را به لاگین می‌فرستد
 */
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const platformId = inject(PLATFORM_ID);
  const router = inject(Router);

  if (isPlatformBrowser(platformId) && req.url.startsWith('/api/')) {
    const token = localStorage.getItem(TOKEN_STORAGE_KEY);
    if (token) {
      req = req.clone({ setHeaders: { Authorization: `Bearer ${token}` } });
    }
  }

  return next(req).pipe(
    catchError((error: unknown) => {
      if (
        error instanceof HttpErrorResponse &&
        error.status === 401 &&
        req.url.startsWith('/api/') &&
        !req.url.includes('/api/auth/')
      ) {
        if (isPlatformBrowser(platformId)) {
          localStorage.removeItem(TOKEN_STORAGE_KEY);
          localStorage.removeItem(USER_STORAGE_KEY);
          router.navigate(['/login']);
        }
      }
      return throwError(() => error);
    }),
  );
};
