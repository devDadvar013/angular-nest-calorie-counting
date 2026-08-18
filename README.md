# کالری‌شمار 🍎

یک اپلیکیشن کالری‌شمار با **Angular 21 + TypeScript + Tailwind CSS v4 + RxJS + SSR** و بک‌اند **NestJS**.

## امکانات

- 🔐 **احراز هویت واقعی** — ثبت‌نام/ورود با **JWT** و رمزنگاری `bcryptjs`؛ توکن و پروفایل در `localStorage`، اینترسپتور HTTP و Route Guard
- 👤 **کاربر پیش‌فرض** — در اولین اجرا یک کاربر نمونه در دیتابیس ساخته می‌شود و فرم لاگین با اعتبار آن از پیش پر می‌شود
- 📊 **داشبورد** — جمع کالری، باقی‌مانده تا هدف، نوار پیشرفت و نمودار درشت‌مغذی‌ها (پروتئین/کربوهیدرات/چربی)
- 🍽️ **فهرست غذاها** — بیش از ۲۰ غذای ایرانی با مقادیر تقریبی به ازای ۱۰۰ گرم + جستجوی زنده با `debounceTime`
- ➕ **افزودن غذا** — از کتابخانه یا به‌صورت سفارشی
- 🎯 **هدف روزانه قابل تنظیم** — همگام‌سازی با بک‌اند
- 🌗 **تم روشن/تاریک** — سوییچ در نوار بالا؛ بدون فلش رنگ در SSR
- 🖥️ **SSR** — رندر سمت سرور با Express + پروکسی `/api` به بک‌اند NestJS

## معماری

### فرانت‌اند (RxJS)

- `CalorieStore` — استور مرکزی با `BehaviorSubject`؛ `combineLatest` جمع‌های روزانه را محاسبه می‌کند و تغییرات را به‌صورت خوش‌بینانه (optimistic) اعمال و همزمان به سرور می‌فرستد.
- `AuthService` — ورود/ثبت‌نام با `HttpClient` و نگه‌داری توکن JWT.
- `auth.interceptor.ts` — اینترسپتور HTTP که توکن را به درخواست‌های `/api` اضافه می‌کند و در صورت 401 کاربر را به لاگین می‌فرستد.
- `FoodService` — جستجوی کتابخانه با `debounceTime` روی یک `BehaviorSubject`.

### بک‌اند (NestJS)

| ماژول | مسیرها |
| --- | --- |
| `auth` | `POST /api/auth/register` · `POST /api/auth/login` · `GET /api/auth/me` |
| `foods` | `GET /api/foods?q=...` |
| `entries` | `GET /api/entries?date=...` · `POST /api/entries` · `DELETE /api/entries/:id` · `DELETE /api/entries?date=...` |
| `goal` | `GET /api/goal` · `PUT /api/goal` |

- ذخیره‌سازی در **MongoDB** با `@nestjs/mongoose` (جمع‌های `users` و `entries`).
- رشته اتصال از متغیر محیطی `MONGODB_URI` در فایل `backend/.env` خوانده می‌شود.
- `JwtAuthGuard` از همه مسیرهای `entries` و `goal` محافظت می‌کند.
- شناسه وعده‌ها از سمت کلاینت تولید می‌شود تا افزودن خوش‌بینانه بدون تغییر id همگام شود.

## کاربر پیش‌فرض

در اولین اجرا، بک‌اند این کاربر نمونه را در MongoDB می‌سازد، چند وعده نمونه برای امروزش اضافه می‌کند (تا داشبورد خالی نباشد) و فرم لاگین فرانت‌اند هم با همین اعتبار از پیش پر می‌شود:

| فیلد | مقدار |
| --- | --- |
| ایمیل | `demo@calorie.app` |
| رمز عبور | `demo1234` |

(با متغیرهای محیطی `DEMO_EMAIL`، `DEMO_PASSWORD` و `DEMO_NAME` قابل تغییر است.)

## اجرا

دو ترمینال باز کنید:

```bash
# ترمینال ۱ — بک‌اند NestJS (http://localhost:3000/api)
npm install            # در ریشه
npm --prefix backend install
# فایل backend/.env بسازید و MONGODB_URI را در آن بگذارید
npm run backend        # توسعه بک‌اند با watch

# ترمینال ۲ — فرانت‌اند Angular (http://localhost:4200)
npm start              # ng serve با پروکسی /api به بک‌اند
```

بیلدها:

```bash
npm run build              # بیلد فرانت‌اند (شامل SSR)
npm run backend:build      # بیلد بک‌اند
npm run backend:start      # اجرای بیلد production بک‌اند
npm run serve:ssr:calorie-counter   # اجرای بیلد SSR (پروکسی /api روی پورت 4000)
```

### نکات

- پروکسی توسعه در `proxy.conf.json` درخواست‌های `/api` را به `http://localhost:3000` می‌فرستد.
- در بیلد SSR، سرور Express همان `/api` را به بک‌اند پروکسی می‌کند (متغیر محیطی `BACKEND_URL` برای تغییر آدرس).
- پورت بک‌اند با متغیر `API_PORT` قابل تغییر است (پیش‌فرض ۳۰۰۰).
- `backend/.env` gitignore شده است و حاوی `MONGODB_URI` (رشته اتصال MongoDB Atlas) است.
