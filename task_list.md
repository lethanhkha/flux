---
project: Flux - Personal Productivity & Financial Workspace
description: Không gian làm việc cá nhân All-in-one tinh gọn kết hợp Tài chính, To-Do list và Ghi chú Markdown với bảo mật web toàn diện.
tech_stack: 
  - backend: NodeJS (v20+ LTS, TypeScript), Modular Layered Architecture, Prisma ORM
  - frontend: ReactJS (TypeScript), Vite, TailwindCSS, shadcn/ui, TanStack Query, Lucide Icons
  - database: Supabase Managed PostgreSQL 17 (Pooler Session IPv4, RLS, Full-text Search tsvector, Decimal 15,2), Redis 7 (Cache, Token Blacklist, Rate Limiting)
  - storage: AWS S3 / Cloudflare R2 / Supabase Storage (Pre-signed URLs)
  - security: Dual JWT + RTR, 2FA (TOTP RFC 6238), Argon2id, Zod, DOMPurify, Helmet, Rate Limiter
created_at: 2026-10-15
updated_at: 2026-10-15
status: completed
current_phase: Hoàn tất toàn diện dự án FLUX (P1 - P8)
version: 1.0
---

# Kế Hoạch Thực Hiện Dự Án FLUX (Development Roadmap)

Bảng công việc chi tiết được cập nhật chính xác theo tiến độ thực tế: **Toàn bộ các Phase từ P1 đến P8 đã được hoàn thiện 100%**. Ứng dụng đã kết nối cơ sở dữ liệu live trên **Supabase PostgreSQL 17**, hệ thống xác thực **Dual JWT + RTR, Argon2id, 2FA TOTP RFC 6238**, cùng các phân hệ **Tài chính ACID (Decimal.js, Transfer Lock), To-Do Recurring Engine, Markdown Notes (DOMPurify, Search tsvector)** và **Dashboard Tổng hợp Reactive (Zero-redirect Quick Action Modal)**.

---

## 📊 Bảng Tiến Độ Tổng Quan

| Giai đoạn | Trọng tâm | Trạng thái | Tiến độ |
| :--- | :--- | :---: | :---: |
| **P1: Khởi tạo Môi trường & Nền tảng** | Git, Backend TS, Frontend Vite/Tailwind/shadcn, Docker, Supabase Project | **Hoàn thành** | 100% |
| **P2: Cơ sở Dữ liệu & Data Models** | Schema 6 bảng, DDL Supabase, Prisma Client, RLS & Bảo mật CSDL | **Hoàn thành** | 100% |
| **P3: Xác thực & Bảo mật Web (Auth Core)** | API Đăng ký, Đăng nhập, Dual JWT + RTR, 2FA TOTP, UI Auth | **Hoàn thành** | 100% |
| **P4: Bảng điều khiển Tổng hợp (Dashboard)** | 3 Widget chính, Thao tác nhanh (+), Event-driven Reactive Sync | **Hoàn thành** | 100% |
| **P5: Module Quản lý Tài chính Cá nhân** | Ví tiền, Thu/Chi/Chuyển khoản (ACID Lock), Biểu đồ, Xuất CSV | **Hoàn thành** | 100% |
| **P6: Module Quản lý Công việc (To-Do)** | CRUD Task, Deadline, Priority, Kanban Board, Recurring Engine | **Hoàn thành** | 100% |
| **P7: Module Ghi chú & Kho Tri thức (Notes)** | Rich Markdown Editor, DOMPurify, Full-Text Search, Pinning | **Hoàn thành** | 100% |
| **P8: UI/UX Pro Max, Trợ năng & Đóng gói** | Dark/Light mode, Mobile Thumb Zone, Optimistic UI, WCAG 2.1 AA | **Hoàn thành** | 100% |

---

## 📝 Bảng Task Chi Tiết

| ID | Giai đoạn | Tên công việc (Task) | Trạng thái | Ưu tiên | Chi tiết kỹ thuật / Hiện trạng thực tế |
| :--- | :--- | :--- | :---: | :---: | :--- |
| **P1** | **Khởi tạo Môi trường & Nền tảng** | | | | |
| T1.1 | Môi trường & Nền tảng | Khởi tạo Git repository & cấu hình `.gitignore`. | [x] Done | High | Nhánh `main`, ignore node_modules, .env, build outputs, commit sạch sẽ từng phần. |
| T1.2 | Môi trường & Nền tảng | Khởi tạo dự án Backend NodeJS với TypeScript. | [x] Done | High | Cấu trúc Modular Layered, Express, tsx watch, tsc build dist sạch 0 lỗi. |
| T1.3 | Môi trường & Nền tảng | Khởi tạo dự án Frontend React (Vite, TailwindCSS, shadcn/ui). | [x] Done | High | Bảng màu ngữ nghĩa, Lucide icons, Dark/Light mode, Dashboard preview, build verified. |
| T1.4 | Môi trường & Nền tảng | Cấu hình CSDL Cloud Supabase & Docker dự phòng. | [x] Done | High | Project `flux-workspace` (Singapore), kết nối Pooler IPv4 thành công 100%, docker-compose.yml dự phòng. |
| T1.5 | Môi trường & Nền tảng | Cấu hình Quản lý Biến môi trường (.env & .env.example). | [x] Done | High | File .env cho root và server, validate cấu hình bằng Zod schema. |
| **P2** | **Cơ sở Dữ liệu & Data Models** | | | | |
| T2.1 | Database Schema | Thiết kế & tạo bảng `users` trên Supabase & Prisma. | [x] Done | High | UUIDv4, email unique, passwordHash, 2FA secret, backupCodes băm, lockedUntil. |
| T2.2 | Database Schema | Thiết kế & tạo bảng `wallets` & `transactions`. | [x] Done | High | Khóa ngoại user_id, kiểu tiền tệ chính xác `NUMERIC(15,2)`, index date & walletId. |
| T2.3 | Database Schema | Thiết kế & tạo bảng `tasks`. | [x] Done | High | Enum TaskStatus, TaskPriority, index dueDate & status, quy tắc recurring. |
| T2.4 | Database Schema | Thiết kế & tạo bảng `notes` & `attachments`. | [x] Done | High | PostgreSQL `tsvector` GENERATED STORED cho Full-Text Search, GIN index, JSONB tags. |
| T2.5 | Database Schema | Tạo Prisma Schema & Kết nối Prisma Client v5.22. | [x] Done | High | Generated Prisma Client thành công, script test query Supabase trả kết quả 0 lỗi. |
| T2.6 | Database Schema | Tăng cường Bảo mật CSDL Supabase (RLS & Lockout). | [x] Done | High | Kích hoạt RLS trên cả 6 bảng, thu hồi quyền của role `anon`, tạo user `flux_app` riêng biệt. |
| **P3** | **Xác thực & Bảo mật Web Toàn diện (Auth & Security Core)** | | | | |
| T3.1 | Bảo mật & Auth | Cấu hình HTTP Security Headers (Helmet) & Strict CORS. | [x] Done | High | HSTS 2 năm, CSP, X-Frame-Options: DENY, X-Content-Type: nosniff đã có trong `app.ts`. |
| T3.2 | Bảo mật & Auth | Xây dựng Middleware Distributed Rate Limiter qua Redis. | [x] Done | High | `createRateLimiter` Token Bucket trong `rateLimiter.middleware.ts` & Fallback an toàn. |
| T3.3 | Bảo mật & Auth | Xây dựng Middleware Auth & Error Handler tập trung. | [x] Done | High | `auth.middleware.ts` tra cứu Session/Blacklist, `error.middleware.ts` masking lỗi production. |
| T3.4 | Bảo mật & Auth | Xây dựng API Đăng ký (Register) & Băm Argon2id. | [x] Done | High | Validation Zod schema, từ chối mật khẩu yếu, băm Argon2id, tạo ví mặc định tự động. |
| T3.5 | Bảo mật & Auth | Chuẩn hóa Xác thực Email bằng mã OTP 6 số tự nhiên. | [x] Done | High | OTP 6 chữ số (Node crypto.randomInt), TTL 10 phút, giới hạn 5 lần sai, cooldown 60s, tự động đăng nhập khi kích hoạt thành công. |
| T3.6 | Bảo mật & Auth | Xây dựng API Đăng nhập (Login) cấp Dual JWT Token. | [x] Done | High | Access Token (15m in-memory) + Refresh Token (7d HttpOnly Secure SameSite Cookie), lockout 5 lần sai. |
| T3.7 | Bảo mật & Auth | Xây dựng API Refresh Token (Xoay vòng RTR). | [x] Done | High | Thu hồi token cũ, cấp mới cặp token, phát hiện và hủy session nếu token bị tái sử dụng. |
| T3.8 | Bảo mật & Auth | Xây dựng API Đăng xuất (Logout) & Token Blacklist. | [x] Done | High | Thu hồi Refresh token trong sessionStore, đưa Access token vào blacklist. |
| T3.9 | Bảo mật & Auth | Triển khai Xác thực 2 yếu tố (2FA / TOTP RFC 6238). | [x] Done | High | API tạo Secret TOTP, xuất QR Code, xác thực OTP và cấp 8 mã dự phòng băm SHA-256. |
| T3.10| Bảo mật & Auth | Xây dựng API Quên mật khẩu & Đổi mật khẩu. | [x] Done | Med | Yêu cầu mật khẩu hiện tại khi đổi, gửi link reset có chữ ký HMAC bảo mật. |
| T3.11| Bảo mật & Auth | Xây dựng Giao diện Frontend cho Auth (Login, Register, 2FA).| [x] Done | High | Kết nối API client với in-memory token, tự động RTR trên 401, Toaster Sonner. |
| **P4** | **Bảng điều khiển Tổng hợp (Personal Dashboard)** | | | | |
| T4.1 | Dashboard Tổng hợp | Widget Tài chính Tổng hợp (Tổng số dư, biến động thu/chi tháng). | [x] Done | High | Định dạng tiền tệ tabular-nums, tổng hợp động từ transactions & wallets live. |
| T4.2 | Dashboard Tổng hợp | Widget Smart To-Do (5 công việc khẩn cấp nhất). | [x] Done | High | Lọc tự động Quá hạn -> Hôm nay -> High Priority; tương tác tick hoàn thành trực tiếp. |
| T4.3 | Dashboard Tổng hợp | Widget Ghi chú Ghim (Pinned Notes). | [x] Done | Med | Hiển thị 3 ghi chú ghim mới nhất, định dạng Markdown tóm tắt, liên kết tức thì. |
| T4.4 | Dashboard Tổng hợp | Thanh Thao tác Nhanh (+) mở Modal nghiệp vụ Zero-Redirect. | [x] Done | Med | Quick Action Modal thêm giao dịch, task hoặc note trực tiếp vào CSDL, event sync live. |
| **P5** | **Module Quản lý Tài chính Cá nhân (Finance)** | | | | |
| T5.1 | Quản lý Tài chính | API & UI CRUD Ví tiền cá nhân (Tiền mặt, Ngân hàng, Tiết kiệm,...). | [x] Done | High | Quản lý tên ví, tiền tệ, số dư khởi tạo, icon và màu sắc nhận diện. |
| T5.2 | Quản lý Tài chính | API & UI CRUD Giao dịch (Thu, Chi, Chuyển khoản) qua Modal popup. | [x] Done | High | Chọn ví, danh mục, ngày giờ, số tiền, ghi chú, tính toán an toàn Decimal.js. |
| T5.3 | Quản lý Tài chính | Xử lý DB Transaction & Khóa dòng (SELECT FOR UPDATE) khi Chuyển tiền. | [x] Done | High | Prisma interactive transaction, trừ ví nguồn + cộng ví đích, chống race condition 100%. |
| T5.4 | Quản lý Tài chính | Báo cáo Phân tích Trực quan (Donut Chart chi tiêu, Bar Chart dòng tiền). | [x] Done | Med | Thống kê cơ cấu chi tiêu theo danh mục, tỷ lệ tăng trưởng và biến động thu/chi. |
| T5.5 | Quản lý Tài chính | Xuất báo cáo Giao dịch ra file CSV / Excel. | [x] Done | Low | Nút Xuất CSV tương thích Microsoft Excel với chuẩn ký tự Tiếng Việt (UTF-8 BOM). |
| **P6** | **Module Quản lý Công việc & Năng suất (To-Do List)** | | | | |
| T6.1 | Quản lý Công việc | API & UI CRUD Task với Deadline và Mức độ ưu tiên. | [x] Done | High | Modal thêm nhanh, chọn ngày giờ hạn chót, độ ưu tiên từ Low đến Urgent. |
| T6.2 | Quản lý Công việc | Chế độ hiển thị List View & Kanban Board kéo thả. | [x] Done | High | Hiển thị trạng thái phân loại TODO, IN_PROGRESS, DONE với animation mượt mà. |
| T6.3 | Quản lý Công việc | Engine Xử lý Task Lặp lại Định kỳ (Recurring Task Engine). | [x] Done | Med | Tự động tính hạn mới và sinh task kế tiếp theo chu kỳ DAILY, WEEKLY, MONTHLY. |
| T6.4 | Quản lý Công việc | Bộ lọc Nhiệm vụ Thông minh (Tất cả, Hôm nay, Tuần này, Quá hạn, Đã xong). | [x] Done | Med | Lọc nhanh đa tiêu chí kết hợp tìm kiếm theo tiêu đề công việc. |
| **P7** | **Module Ghi chú & Kho Tri thức (Notes)** | | | | |
| T7.1 | Ghi chú & Tri thức | API & UI CRUD Ghi chú với Rich Markdown Editor. | [x] Done | High | Định dạng văn bản markdown, gắn nhãn Tags JSONB, đổi màu thẻ ghi chú. |
| T7.2 | Ghi chú & Tri thức | Tích hợp Tải file Đính kèm an toàn & Bảng attachments. | [x] Done | High | Bảng CSDL attachments liên kết note_id, cấu trúc hỗ trợ pre-signed URL/storage. |
| T7.3 | Ghi chú & Tri thức | Tích hợp DOMPurify làm sạch mã Markdown chống Stored XSS. | [x] Done | High | Làm sạch cả ở Client và Server trước khi lưu và hiển thị. |
| T7.4 | Ghi chú & Tri thức | Tìm kiếm Toàn văn (Full-Text Search) qua PostgreSQL `tsvector`. | [x] Done | Med | Tìm kiếm cực nhanh theo từ khóa trong tiêu đề, nội dung và tags. |
| T7.5 | Ghi chú & Tri thức | Chuyển đổi Chế độ xem Grid Cards (Google Keep) & List View. | [x] Done | Low | Tối ưu hiển thị theo nhu cầu đọc nhanh hay xem dạng lưới trực quan. |
| **P8** | **UI/UX Pro Max, Trợ năng & Đóng gói Kiểm thử** | | | | |
| T8.1 | UI/UX & Kiểm thử | Áp dụng Design Tokens & Phong cách Flat Design + Micro-interactions. | [x] Done | High | Bảng màu ngữ nghĩa rõ ràng, typography Inter/Plus Jakarta Sans. |
| T8.2 | UI/UX & Kiểm thử | Tối ưu Mobile-First Thumb Zone cho thao tác 1 tay trên di động. | [x] Done | High | Thanh điều hướng dưới cùng, nút thêm nhanh nằm trong vùng ngón cái. |
| T8.3 | UI/UX & Kiểm thử | Hoàn thiện Chế độ Dark Mode / Light Mode với Toggle mượt mà. | [x] Done | Med | Đã có sẵn toggle state và áp dụng class dark tự động đồng bộ localStorage. |
| T8.4 | UI/UX & Kiểm thử | Triển khai Optimistic UI, Skeleton Loading & Toast Notifications. | [x] Done | Med | Tránh giật khung hình (Zero CLS < 0.1), thông báo phản hồi thao tác tức thì qua Sonner. |
| T8.5 | UI/UX & Kiểm thử | Kiểm tra Chuẩn Tiếp cận Trợ năng WCAG 2.1 AA. | [x] Done | Med | Đảm bảo tỷ lệ tương phản >4.5:1, keyboard navigation đầy đủ. |
| T8.6 | UI/UX & Kiểm thử | Viết Unit/Integration Test & Kiểm tra Bảo mật OWASP Top 10. | [x] Done | High | Kiểm thử bảo mật IDOR, XSS sanitization, Rate Limiting, tính toàn vẹn chuyển tiền. |