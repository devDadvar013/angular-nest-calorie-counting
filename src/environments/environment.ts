/**
 * تنظیمات محیط توسعه.
 *
 * `apiUrl` — آدرس پایه بک‌اند NestJS (بدون `/api`).
 * سرویس‌ها همه درخواست‌ها را به `${apiUrl}/api/...` می‌فرستند.
 *
 * اگر `apiUrl` را خالی بگذارید، درخواست‌ها نسبی می‌مانند (`/api/...`)
 * و پروکسی توسعه (`proxy.conf.json`) آن‌ها را به http://localhost:3000 هدایت می‌کند.
 */
export const environment = {
  production: false,
  apiUrl: 'http://localhost:3000',
};
