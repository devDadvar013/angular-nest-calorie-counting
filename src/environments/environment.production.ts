/**
 * تنظیمات محیط production.
 *
 * `apiUrl` — آدرس پایه بک‌اند NestJS (بدون `/api`).
 *
 * خالی = همان origin؛ در بیلد SSR سرور Express درخواست‌های `/api` را
 * به بک‌اند (متغیر محیطی BACKEND_URL) پروکسی می‌کند.
 * برای بک‌اند جداگانه، آدرس مطلق بگذارید؛ مثلاً: 'https://api.example.com'
 */
export const environment = {
  production: true,
  apiUrl: '',
};
