# Flux — Personal Productivity & Financial Workspace

[![TypeScript](https://img.shields.io/badge/TypeScript-5.5-blue.svg?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-18.3-61DAFB.svg?logo=react&logoColor=black)](https://react.dev/)
[![Node.js](https://img.shields.io/badge/Node.js-20+-339933.svg?logo=node.js&logoColor=white)](https://nodejs.org/)
[![Vite](https://img.shields.io/badge/Vite-5.4-646CFF.svg?logo=vite&logoColor=white)](https://vitejs.dev/)
[![Tailwind CSS](https://img.shields.io/badge/TailwindCSS-3.4-38B2AC.svg?logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-17-4169E1.svg?logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![Supabase](https://img.shields.io/badge/Supabase-Managed_DB-3ECF8E.svg?logo=supabase&logoColor=white)](https://supabase.com/)
[![Redis](https://img.shields.io/badge/Redis-7.0-DC382D.svg?logo=redis&logoColor=white)](https://redis.io/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

> **Flux** là nền tảng không gian làm việc cá nhân hợp nhất All-in-one hiện đại: Quản lý Tài chính Đa ví chuẩn ACID, Làm chủ Công việc với Bảng Kanban & Lập kế hoạch tuần (Weekly Planner), Hệ thống Nhắc nhở thông minh báo thức thời gian thực, và Trạm Ý tưởng ghi chú Markdown với cơ chế tự động lưu Auto-save và kiến trúc bảo mật chuẩn Enterprise.

---

## 🌟 Tính Năng Nổi Bật (Key Features)

### 1. 💰 Quản Lý Tài Chính Đa Ví & Dòng Tiền ACID (Multi-Wallet & Finance)
- **Hệ thống đa ví linh hoạt**: Tạo và quản lý nhiều ví tiền độc lập (Tiền mặt, Ngân hàng, Thẻ tín dụng, Quỹ tiết kiệm...), tùy chỉnh biểu tượng, mã màu nhận diện và đơn vị tiền tệ (`VND` / `USD`). Cho phép thiết lập ví mặc định.
- **Dòng tiền giao dịch chuẩn ACID**: Theo dõi thu nhập, chi phí và **Chuyển tiền nội bộ giữa các ví (Inter-wallet Transfer)**. Áp dụng cơ chế khóa dòng dữ liệu `SELECT ... FOR UPDATE` trong transaction của PostgreSQL, bảo đảm số dư không bao giờ bị xung đột hoặc sai lệch.
- **Tính toán số dư chính xác tuyệt đối**: Tích hợp thư viện `decimal.js` xử lý số học dấu phẩy động dạng `NUMERIC(15, 2)`. Tự động tính toán và tái đồng bộ số dư các ví tức thì khi người dùng chỉnh sửa hoặc xóa các giao dịch trong lịch sử.
- **Điều hướng chu kỳ theo tháng & Thẻ phân tích (Filter Insights)**: Bộ chọn khoảng thời gian trực quan theo tháng kèm thẻ tóm tắt dòng tiền thông minh: Tổng thu, Tổng chi, Dòng tiền ròng (Net Flow) và tỷ lệ phần trăm phân bổ.
- **Quản lý danh mục & thẻ tùy chỉnh**: Tạo mới, đổi tên hoặc xóa danh mục với bảng màu và icon trực quan.
- **Xuất dữ liệu CSV**: Xuất toàn bộ hoặc theo bộ lọc ra tệp CSV tương thích Microsoft Excel với chuẩn mã hóa Tiếng Việt (UTF-8 BOM).

### 2. 🎯 Làm Chủ Công Việc, Kanban & Lập Kế Hoạch Tuần (Tasks & Weekly Planner)
- **3 Chế độ xem công việc toàn diện**:
  - **Danh sách (List View)**: Hiển thị mạch lạc với bộ chọn sắp xếp động (Sắp xếp theo Độ ưu tiên, Hạn chót, Ngày tạo, Trạng thái).
  - **Bảng Kanban (Kanban Board)**: Kéo thả HTML5 chuyển trạng thái tức thì giữa `TODO` (Cần làm) ➔ `IN_PROGRESS` (Đang làm) ➔ `DONE` (Hoàn thành).
  - **Lập kế hoạch tuần (Weekly Planner View)**: Bảng lịch 7 ngày trong tuần trực quan kết hợp cột "Chưa lên lịch" (Unscheduled). Kéo thả công việc giữa các ngày để phân bổ khối lượng làm việc, có tùy chọn ẩn các ngày đã qua để tập trung vào hiện tại.
- **Nhiệm vụ con (Subtasks / Checklist) với Deadline riêng**:
  - Thêm danh sách checklist chi tiết cho từng công việc.
  - Thiết lập ngày đến hạn riêng biệt cho từng nhiệm vụ con kèm huy hiệu thông minh (**Hôm nay**, **Quá hạn**, **Sắp tới**).
  - Thanh tiến độ hiển thị trực quan tỷ lệ % hoàn thành của task chính.
- **Bộ lọc đa tầng & Quản lý nhãn nâng cao**:
  - Bộ lọc trạng thái kết hợp bộ lọc đa thẻ (Multi-tag filtering) với cơ chế toggle linh hoạt và tự động làm mới.
  - Tính năng ẩn task theo nhãn thẻ lưu trữ bền bỉ trong `localStorage`.
- **Chế độ tập trung (Focus Mode)**: Tối giản giao diện và tìm kiếm tức thì trên tiêu đề, nội dung và thẻ nhãn.
- **Chu kỳ lặp lại & Hoàn tác (Undo)**: Hỗ trợ công việc lặp lại tự động (Hàng ngày, Hàng tuần, Hàng tháng); Toast thông báo 6 giây cho phép Hoàn tác (Undo) phục hồi khi lỡ tay xóa task.

### 3. ⏰ Nhắc Nhở Thông Minh & Chuông Báo Thời Gian Thực (Scheduled Reminders)
- **Lập lịch nhắc hẹn chi tiết**: Đặt mốc thời gian, mô tả công việc, địa điểm và gắn nhãn phân loại màu sắc.
- **Khoảng thời gian báo trước linh hoạt**: Tùy chỉnh thông báo đúng giờ, hoặc báo trước 5, 10, 15, 30, hoặc 60 phút.
- **Chuông báo thời gian thực & Cửa sổ tương tác (`RingingReminderModal`)**:
  - Công nghệ âm thanh Web Audio API (`audioNotifier`) phát chuông báo thức tức thì khi chạm mốc hẹn.
  - Cửa sổ nhắc việc xuất hiện nổi bật trên màn hình, hỗ trợ thao tác nhanh: **Báo lại (Snooze 5-15 phút)**, **Đánh dấu đã hoàn thành**, hoặc **Tắt chuông**.
- **Dòng thời gian trực quan (Timeline View)**: Nhóm các lời nhắc theo ngày gần nhất, theo dõi trạng thái rõ ràng: *Đã lên lịch*, *Đang báo lại*, *Hoàn thành*, hoặc *Bỏ lỡ*.

### 4. 📝 Trạm Ý Tưởng & Ghi Chú Markdown (Notes & Knowledge Hub)
- **Tự động lưu thông minh (Enterprise Debounced Auto-save)**: Cơ chế lưu ngầm tự động theo chu kỳ debounce mượt mà, kèm thanh hiển thị trạng thái động ("Đang lưu...", "Đã lưu", "Lỗi đồng bộ").
- **Soạn thảo Markdown phong phú & Bố cục 2 cột (Desktop)**:
  - Thanh công cụ định dạng nhanh: Tiêu đề (H1-H3), In đậm, In nghiêng, Trích dẫn, Khối mã code, Checkbox công việc, Bảng biểu.
  - Modal thêm và sửa mở rộng dạng 2 cột trên máy tính: Một bên soạn thảo, một bên Xem Trước (Live Preview) trực tiếp.
- **Bảo mật nội dung kép (Dual-tier DOMPurify)**: Làm sạch mã HTML/Markdown ở cả Client và Server, loại bỏ triệt để nguy cơ Stored XSS.
- **Bảng 12 màu Pastel & Bộ chọn màu HEX**: Gán màu sắc thẩm mỹ cho thẻ ghi chú hoặc tự do chọn mã màu tùy biến.
- **Tìm kiếm toàn văn (PostgreSQL Full-Text Search)**: Truy vấn siêu tốc hàng ngàn ghi chú dựa trên trường sinh `tsvector` kết hợp chỉ mục GIN Index.
- **Đính kèm tệp tin & Chế độ xem kép**: Tải lên tài liệu, hình ảnh an toàn qua Pre-signed URLs; Chuyển đổi linh hoạt giữa dạng Lưới thẻ (Google Keep Grid) và dạng Danh sách (List View).

### 5. 📊 Bảng Điều Khiển Hợp Nhất & Thao Tác Nhanh (Smart Dashboard & Quick Actions)
- **Bức tranh tổng thể cuộc sống**: Widget Tổng tài sản (Net Worth) hợp nhất từ tất cả các ví, biểu đồ thu/chi tháng, Widget Smart To-Do (tự động lọc 5 công việc khẩn cấp nhất), Lời nhắc sắp tới gần nhất và Danh sách ghi chú đã ghim.
- **Cửa sổ thao tác nhanh (Global Quick Action Modal)**: Phím tắt toàn cục `Ctrl + K` (hoặc `Cmd + K`) và nút bấm nổi `+` cho phép thêm ngay Giao dịch, Nhiệm vụ hoặc Ghi chú ở bất kỳ trang nào mà không làm gián đoạn luồng làm việc (Zero-redirect), tự động đồng bộ dữ liệu phản ứng tức thì (Reactive Cache Invalidation).

### 6. 🛡️ Kiến Trúc An Toàn & Bảo Mật Chuẩn Enterprise
- **Kiến trúc xác thực Dual JWT**:
  - Access Token (15 phút, lưu trữ strictly in-memory của React Client, triệt tiêu nguy cơ đánh cắp token qua XSS).
  - Refresh Token (7 ngày, lưu trong Cookie HttpOnly, Secure, SameSite=Strict) kết hợp cơ chế Xoay vòng (Refresh Token Rotation - RTR).
  - Cơ chế dự phòng (Cross-Domain Token Fallback) hỗ trợ các trình duyệt chặn cookie bên thứ ba.
- **Xác thực 2 yếu tố (2FA / TOTP RFC 6238)**: Hỗ trợ ứng dụng xác thực (Google Authenticator, Microsoft Authenticator, 1Password) qua mã QR bí mật và cấp 8 mã dự phòng (One-time backup codes) băm an toàn.
- **Đăng nhập Google OAuth2 & Xác thực Email OTP 6 số**: Tích hợp Google OAuth2 Authorization Code flow và hệ thống gửi mã OTP 6 số ngẫu nhiên qua Gmail SMTP (Nodemailer) có hạn dùng 10 phút.
- **Phòng vệ chủ động & Chống Bot**:
  - Khóa tài khoản tạm thời 15 phút sau 5 lần đăng nhập thất bại liên tiếp.
  - Tích hợp Cloudflare Turnstile CAPTCHA vô hình chống spam và brute-force.
  - Thu hồi token qua Redis Blacklist khi đăng xuất hoặc đổi mật khẩu.
  - Băm mật khẩu bằng thuật toán tiên tiến **Argon2id**.
  - Kiểm soát tần suất truy cập phân tán (Distributed Rate Limiting) qua Redis Token Bucket.
  - Bộ tiêu đề bảo vệ HTTP qua **Helmet** (HSTS 2 năm, CSP nghiêm ngặt, `X-Frame-Options: DENY`, `X-Content-Type: nosniff`).
  - Xác thực dữ liệu đầu vào Zero-Trust với thư viện **Zod**.

### 7. 🎨 Trải Nghiệm Giao Diện Tinh Tế & Motion Engine (UI/UX)
- **Dual-layer Motion Engine**: Xây dựng trên thư viện `motion`, chuyển tab điều hướng mượt mà (Directional Tab Transitions), hiệu ứng từ tính `MagneticBox`, viền sáng chuyển động `StarBorder`, văn bản tỏa sáng `ShinyText`.
- **Giao diện Tối/Sáng (Dark / Light Theme)**: Chuyển đổi màu sắc liền mạch, không gây giật bố cục (Zero Cumulative Layout Shift - CLS < 0.1).
- **Thiết kế thân thiện ngón cái (Mobile-First Thumb Zone)**: Thanh điều hướng dưới đáy và các nút bấm chính được bố trí trong tầm với tự nhiên trên màn hình cảm ứng di động.

---

## 🛠️ Ngăn Xếp Công Nghệ (Tech Stack)

| Tầng | Công nghệ / Thư viện | Vai trò & Mục đích |
| :--- | :--- | :--- |
| **Frontend Core** | React 18, TypeScript, Vite | Nền tảng SPA tốc độ cao, type-safe toàn diện |
| **State & Cache** | TanStack React Query v5 | Đồng bộ server-state, tự động invalidate cache phản ứng |
| **Styling & Icons** | Tailwind CSS, Lucide React | Hệ thống utility CSS chuẩn hóa và bộ icon hiện đại |
| **Motion & Visuals** | Motion (`motion`), Recharts | Động cơ hoạt họa mượt mà và trực quan hóa biểu đồ tài chính |
| **UI Components** | Sonner, CustomSelect, Portal Modals | Thông báo Toast phản hồi nhanh và hệ thống hộp thoại tương tác |
| **Backend Core** | Node.js (v20+ LTS), Express.js, TypeScript | Cấu trúc Modular Layered Architecture (Controller-Service-Route) |
| **ORM & Database** | Prisma ORM, PostgreSQL 17 (Supabase) | Tương tác dữ liệu type-safe, GIN tsvector FTS, PgBouncer Pooler |
| **Cache & Limit** | Redis 7, ioredis | Quản lý Token Blacklist, Distributed Rate Limiter |
| **Security & Auth** | Argon2, JWT, OTPLib, QRCode, Cloudflare Turnstile | Mã hóa mật khẩu, 2FA TOTP, Captcha và phiên làm việc |
| **Validation & Sanitize**| Zod, DOMPurify, JSDOM | Zero-trust input validation và chống Stored XSS |
| **Storage & Email** | AWS SDK S3, Multer, Nodemailer | Quản lý tệp tin tải lên qua Pre-signed URLs và gửi OTP qua Gmail |

---

## 📂 Cấu Trúc Dự Án (Project Structure)

```text
Flux/
├── client/                          # Mã nguồn ứng dụng Frontend React (Vite)
│   ├── public/                      # Tài nguyên tĩnh, favicon, âm thanh chuông báo
│   └── src/
│       ├── api/                     # Axios instance & cấu hình đánh chặn token (Interceptors)
│       ├── components/              # Các UI Components phân chia theo phân hệ
│       │   ├── auth/                # Giao diện đăng nhập, đăng ký, Google OAuth, 2FA
│       │   ├── brand/               # Logo và tài nguyên nhận diện thương hiệu Flux
│       │   ├── common/              # Modal portal, ColorPicker, CustomSelect, Tooltip
│       │   ├── finance/             # Giao diện ví tiền, giao dịch, chuyển khoản, biểu đồ
│       │   ├── layout/              # AppLayout, thanh điều hướng đáy, QuickActionModal
│       │   ├── motion/              # MagneticBox, PageTransition, ShinyText, StarBorder
│       │   ├── notes/               # Trình soạn thảo Markdown, NoteCard, TagSelect
│       │   ├── reminders/           # RingingReminderModal, Timeline, ReminderCard
│       │   └── tasks/               # KanbanCard, Subtasks, WeeklyPlannerView, TagModal
│       ├── contexts/                # AuthContext, ReminderAlertContext (Âm thanh & chuông)
│       ├── hooks/                   # useAutoSave, useDebounce, useHorizontalScroll
│       ├── lib/                     # audioNotifier, taskUtils, searchUtils, motionTokens
│       └── pages/                   # DashboardPage, FinancePage, TasksPage, NotesPage...
│
├── server/                          # Mã nguồn ứng dụng Backend Node.js (Express + TypeScript)
│   ├── prisma/
│   │   └── schema.prisma            # Định nghĩa Data Models (User, Wallet, Task, Reminder...)
│   └── src/
│       ├── config/                  # Biến môi trường Zod validation, Prisma client, Redis
│       ├── middlewares/             # Auth JWT, Distributed RateLimiter, Helmet, Turnstile
│       ├── modules/                 # Cấu trúc module khép kín (Controller - Routes - Service)
│       │   ├── auth/                # Xác thực, cấp phát token, 2FA TOTP, Google OAuth, OTP
│       │   ├── dashboard/           # Thống kê tổng hợp số dư, smart tasks, reminders
│       │   ├── finance/             # Nghiệp vụ ví, giao dịch ACID, danh mục, tính lại số dư
│       │   ├── notes/               # CRUD ghi chú, tìm kiếm tsvector, đính kèm file S3
│       │   ├── reminders/           # CRUD lịch nhắc hẹn, kiểm tra chuông báo, snooze
│       │   └── tasks/               # CRUD công việc, Kanban, Subtasks, Weekly Planner
│       ├── services/                # MailService (Nodemailer), CacheService, GoogleAuth
│       └── utils/                   # Hàm tiện ích gán bảng màu thẻ nhãn Pastel
│
├── docker-compose.yml               # Môi trường chạy PostgreSQL 16 & Redis 7 nội bộ
├── local_docs/                      # Tài liệu PRD, Task List, Kiến trúc và Bản thiết kế gốc
└── README.md                        # Tài liệu hướng dẫn chính thức của dự án
```

---

## 🚀 Hướng Dẫn Cài Đặt Cục Bộ (Local Development Setup)

### 1. Yêu cầu hệ thống
- **Node.js**: Phiên bản 18.x hoặc 20.x+ LTS
- **Package Manager**: `npm`, `yarn` hoặc `pnpm`
- **Cơ sở dữ liệu**: PostgreSQL 16/17 & Redis 7 (Có thể dùng Docker có sẵn hoặc Supabase Cloud)

### 2. Khởi chạy Database & Cache (Docker - Tùy chọn nhanh)
Nếu bạn muốn chạy database cục bộ thay vì kết nối Supabase Cloud:
```bash
# Khởi động PostgreSQL 16 và Redis 7 trong Docker
docker-compose up -d
```

### 3. Cài đặt và cấu hình Backend
```bash
# Di chuyển vào thư mục server
cd server

# Cài đặt các gói phụ thuộc
npm install

# Tạo tệp cấu hình môi trường từ mẫu
cp .env.example .env

# Chỉnh sửa file .env với chuỗi kết nối DATABASE_URL và các secret keys
# Sau đó đồng bộ cấu trúc database với Prisma:
npx prisma generate
npx prisma migrate dev

# Khởi chạy server ở chế độ phát triển (Hot reload qua tsx)
npm run dev
```

### 4. Cài đặt và cấu hình Frontend
```bash
# Di chuyển vào thư mục client
cd ../client

# Cài đặt các gói phụ thuộc
npm install

# Tạo tệp cấu hình môi trường từ mẫu
cp .env.example .env

# Khởi chạy máy chủ phát triển Vite
npm run dev
```

Ứng dụng sẽ khả dụng tại:
- **Giao diện người dùng (Frontend)**: `http://localhost:5173`
- **Giao diện API Backend**: `http://localhost:5000/api/v1`
- **Kiểm tra trạng thái (Health Check)**: `http://localhost:5000/health`

---

## 🔑 Cấu Hình Biến Môi Trường (Environment Variables)

### Backend (`server/.env`)
| Tên biến | Bắt buộc | Mô tả chi tiết |
| :--- | :---: | :--- |
| `DATABASE_URL` | Có | Chuỗi kết nối PostgreSQL (Ví dụ: Supabase Session Pooler URL) |
| `REDIS_URL` | Không | Địa chỉ Redis (`redis://localhost:6379` hoặc Upstash URL, fallback in-memory nếu vắng mặt) |
| `PORT` | Không | Cổng dịch vụ Backend (Mặc định: `5000`) |
| `CLIENT_ORIGIN` | Có | Địa chỉ nguồn Frontend cho phép qua CORS (Mặc định: `http://localhost:5173`) |
| `JWT_ACCESS_SECRET` | Có | Chuỗi bí mật ký Access Token (Tối thiểu 32 ký tự ngẫu nhiên) |
| `JWT_REFRESH_SECRET`| Có | Chuỗi bí mật ký Refresh Token (Tối thiểu 32 ký tự ngẫu nhiên) |
| `COOKIE_SECRET` | Có | Chuỗi bí mật dùng để ký và xác thực HttpOnly Cookies |
| `GMAIL_USER` | Không | Địa chỉ Gmail dùng để gửi mã xác minh OTP qua SMTP |
| `GMAIL_APP_PASSWORD`| Không | Mật khẩu ứng dụng 16 ký tự của tài khoản Google |
| `GOOGLE_CLIENT_ID` | Không | OAuth Client ID từ Google Cloud Console (Dùng cho Google SSO) |
| `GOOGLE_CLIENT_SECRET`| Không| OAuth Client Secret từ Google Cloud Console |
| `CLOUDFLARE_TURNSTILE_SECRET_KEY` | Không | Secret key xác minh Turnstile Captcha (Có sẵn dummy testing key) |

### Frontend (`client/.env`)
| Tên biến | Bắt buộc | Mô tả chi tiết |
| :--- | :---: | :--- |
| `VITE_API_BASE_URL` | Có | Đường dẫn API Backend cơ sở (Ví dụ: `http://localhost:5000/api/v1`) |
| `VITE_CLOUDFLARE_TURNSTILE_SITE_KEY` | Không | Site Key công khai hiển thị widget Turnstile trên giao diện Auth |

---

## ☁️ Hướng Dẫn Triển Khai Đám Mây (Cloud Deployment)

### 1. Frontend (Vercel / Cloudflare Pages)
- **Framework Preset**: `Vite`
- **Root Directory**: `client`
- **Build Command**: `npm run build`
- **Output Directory**: `dist`
- **SPA Routing**: Tệp `client/vercel.json` đã cấu hình sẵn quy tắc URL Rewrite phục vụ React Router.
- **Biến môi trường**:
  ```env
  VITE_API_BASE_URL="https://your-backend-domain.com/api/v1"
  VITE_CLOUDFLARE_TURNSTILE_SITE_KEY="your-production-site-key"
  ```

### 2. Backend (Render / Railway / Fly.io)
- **Root Directory**: `server`
- **Build Command**: `npm install && npx prisma generate && npm run build`
- **Start Command**: `npm start` (Thực thi `node dist/index.js`)
- **Health Check Path**: `/health`
- **Biến môi trường**: Cấu hình đầy đủ các biến môi trường Production (`DATABASE_URL`, `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET`, `COOKIE_SECRET`, `CLIENT_ORIGIN=https://your-frontend-domain.com`).

---

## 📜 Các Lệnh Khả Dụng (Available Scripts)

### Trong thư mục `server/`:
- `npm run dev`: Khởi chạy backend với cơ chế hot reload qua `tsx watch`.
- `npm run build`: Dọn dẹp thư mục `dist/` và biên dịch mã nguồn TypeScript (`tsc`).
- `npm start`: Khởi chạy ứng dụng backend đã biên dịch trong thư mục `dist/`.
- `npm run prisma:generate`: Sinh lại Prisma Client tương thích schema mới.
- `npm run prisma:migrate`: Áp dụng các migration cơ sở dữ liệu mới trong môi trường dev.
- `npm run prisma:studio`: Mở giao diện trực quan Prisma Studio để tra cứu dữ liệu.
- `npm run lint`: Kiểm tra chất lượng mã nguồn TypeScript qua ESLint.

### Trong thư mục `client/`:
- `npm run dev`: Khởi chạy máy chủ phát triển Vite với Hot Module Replacement (HMR).
- `npm run build`: Kiểm tra kiểu dữ liệu (`tsc -b`) và đóng gói tối ưu cho Production (`vite build`).
- `npm run preview`: Xem trước bản build Production tại máy cục bộ.
- `npm run lint`: Quét và báo cáo các lỗi cú pháp và tiêu chuẩn mã qua ESLint.

---

## 📄 Bản Quyền (License)
Dự án được xây dựng và phát hành theo các điều khoản của giấy phép mã nguồn mở [MIT License](LICENSE).
Mọi cá nhân và tổ chức đều được tự do sử dụng, chỉnh sửa và phân phối.
