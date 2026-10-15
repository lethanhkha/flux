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
status: in-progress
current_phase: P3 - Xác thực & Bảo mật Web Toàn diện (Auth Core)
version: 1.0
---

# Kế Hoạch Thực Hiện Dự Án FLUX (Development Roadmap)

Bảng công việc chi tiết được cập nhật chính xác theo tiến độ thực tế: **Phase 1 và Phase 2 đã hoàn thành 100%**, cơ sở dữ liệu đã live trên **Supabase**, và giai đoạn tiếp theo là triển khai **Hệ thống Xác thực (Auth Core) & Giao diện Auth**.

---

## 📊 Bảng Tiến Độ Tổng Quan

| Giai đoạn | Trọng tâm | Trạng thái | Tiến độ |
| :--- | :--- | :---: | :---: |
| **P1: Khởi tạo Môi trường & Nền tảng** | Git, Backend TS, Frontend Vite/Tailwind/shadcn, Docker, Supabase Project | **Hoàn thành** | 100% |
| **P2: Cơ sở Dữ liệu & Data Models** | Schema 6 bảng, DDL Supabase, Prisma Client, RLS & Bảo mật CSDL | **Hoàn thành** | 100% |
| **P3: Xác thực & Bảo mật Web (Auth Core)** | API Đăng ký, Đăng nhập, Dual JWT + RTR, 2FA TOTP, UI Auth | **Đang thực hiện (Tiếp theo)** | 25% |
| **P4: Bảng điều khiển Tổng hợp (Dashboard)** | 3 Widget chính, Thao tác nhanh (+), TanStack Query | Chưa bắt đầu | 0% |
| **P5: Module Quản lý Tài chính Cá nhân** | Ví tiền, Thu/Chi/Chuyển khoản (DB Lock), Biểu đồ dòng tiền | Chưa bắt đầu | 0% |
| **P6: Module Quản lý Công việc (To-Do)** | CRUD Task, Deadline, Priority, Kanban Board, Recurring | Chưa bắt đầu | 0% |
| **P7: Module Ghi chú & Kho Tri thức (Notes)** | Rich Markdown Editor, DOMPurify, S3 Pre-signed, Full-Text Search | Chưa bắt đầu | 0% |
| **P8: UI/UX Pro Max, Trợ năng & Đóng gói** | Dark/Light mode, Mobile Thumb Zone, Optimistic UI, Security Audit | Chưa bắt đầu | 20% |

---

## 📝 Bảng Task Chi Tiết

| ID | Giai đoạn | Tên công việc (Task) | Trạng thái | Ưu tiên | Chi tiết kỹ thuật / Hiện trạng thực tế |
| :--- | :--- | :--- | :---: | :---: | :--- |
| **P1** | **Khởi tạo Môi trường & Nền tảng** | | | | |
| T1.1 | Môi trường & Nền tảng | Khởi tạo Git repository & cấu hình `.gitignore`. | [x] Done | High | Nhánh `main`, ignore node_modules, .env, build outputs, commit sạch sẽ. |
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
| T3.2 | Bảo mật & Auth | Xây dựng Middleware Distributed Rate Limiter qua Redis. | [x] Done | High | `createRateLimiter` Token Bucket trong `rateLimiter.middleware.ts`. |
| T3.3 | Bảo mật & Auth | Xây dựng Middleware Auth & Error Handler tập trung. | [x] Done | High | `auth.middleware.ts` tra cứu Redis Blacklist, `error.middleware.ts` masking lỗi production. |
| T3.4 | Bảo mật & Auth | **[TIẾP THEO]** Xây dựng API Đăng ký (Register) & Băm Argon2id. | [ ] Todo | High | Validation Zod schema, từ chối mật khẩu yếu/lộ, băm Argon2id an toàn. |
| T3.5 | Bảo mật & Auth | **[TIẾP THEO]** Xây dựng Luồng Xác thực Email qua Signed HMAC Token. | [ ] Todo | High | Gửi token xác nhận tài khoản 15 phút, chống enumeration email. |
| T3.6 | Bảo mật & Auth | **[TIẾP THEO]** Xây dựng API Đăng nhập (Login) cấp Dual JWT Token. | [ ] Todo | High | Access Token (15m in-memory) + Refresh Token (7d HttpOnly Secure SameSite Cookie). |
| T3.7 | Bảo mật & Auth | **[TIẾP THEO]** Xây dựng API Refresh Token (Xoay vòng RTR). | [ ] Todo | High | Thu hồi token cũ, cấp mới cặp token, phát hiện và hủy session nếu token bị tái sử dụng. |
| T3.8 | Bảo mật & Auth | **[TIẾP THEO]** Xây dựng API Đăng xuất (Logout) & Redis Token Blacklist. | [ ] Todo | High | Thu hồi Refresh token trong DB, đưa Access token vào Redis blacklist. |
| T3.9 | Bảo mật & Auth | **[TIẾP THEO]** Triển khai Xác thực 2 yếu tố (2FA / TOTP RFC 6238). | [ ] Todo | High | API tạo Secret TOTP, xuất QR Code, xác thực OTP và cấp 8 mã dự phòng băm SHA-256. |
| T3.10| Bảo mật & Auth | **[TIẾP THEO]** Xây dựng API Quên mật khẩu & Đổi mật khẩu. | [ ] Todo | Med | Yêu cầu mật khẩu hiện tại khi đổi, gửi link reset có chữ ký bảo mật. |
| T3.11| Bảo mật & Auth | **[TIẾP THEO]** Xây dựng Giao diện Frontend cho Auth (Login, Register, 2FA).| [ ] Todo | High | Form nhập liệu mượt mà, validate client-side bằng React Hook Form + Zod, Toast thông báo. |
| **P4** | **Bảng điều khiển Tổng hợp (Personal Dashboard)** | | | | |
| T4.1 | Dashboard Tổng hợp | Widget Tài chính Tổng hợp (Tổng số dư, biến động thu/chi tháng). | [ ] Todo | High | Định dạng tiền tệ tabular-nums, biểu đồ so sánh dòng tiền nhỏ gọn. |
| T4.2 | Dashboard Tổng hợp | Widget Smart To-Do (5 công việc khẩn cấp nhất). | [ ] Todo | High | Tự động lọc Quá hạn -> Hôm nay -> High Priority; tick hoàn thành ngay tại widget. |
| T4.3 | Dashboard Tổng hợp | Widget Ghi chú Ghim (Pinned Notes). | [ ] Todo | Med | Hiển thị 3 ghi chú ghim mới nhất, click mở modal xem/chỉnh sửa tức thì. |
| T4.4 | Dashboard Tổng hợp | Thanh Thao tác Nhanh (+) mở Modal nghiệp vụ. | [ ] Todo | Med | Nút nổi cho phép thêm giao dịch, task hoặc note mà không rời trang. |
| **P5** | **Module Quản lý Tài chính Cá nhân (Finance)** | | | | |
| T5.1 | Quản lý Tài chính | API & UI CRUD Ví tiền cá nhân (Tiền mặt, Ngân hàng, Tiết kiệm,...). | [ ] Todo | High | Quản lý tên ví, tiền tệ, số dư khởi tạo, icon và màu sắc nhận diện. |
| T5.2 | Quản lý Tài chính | API & UI CRUD Giao dịch (Thu, Chi, Chuyển khoản) qua Modal popup. | [ ] Todo | High | Chọn ví, danh mục, ngày giờ, số tiền, ghi chú, đính kèm ảnh hóa đơn. |
| T5.3 | Quản lý Tài chính | Xử lý DB Transaction & Khóa dòng (SELECT FOR UPDATE) khi Chuyển tiền. | [ ] Todo | High | Đảm bảo tính toàn vẹn số dư ví, chống race condition dữ liệu. |
| T5.4 | Quản lý Tài chính | Báo cáo Phân tích Trực quan (Donut Chart chi tiêu, Bar Chart dòng tiền). | [ ] Todo | Med | Thống kê cơ cấu chi tiêu theo danh mục và so sánh thu/chi qua các tháng. |
| T5.5 | Quản lý Tài chính | Xuất báo cáo Giao dịch ra file CSV / Excel. | [ ] Todo | Low | Hỗ trợ lưu trữ và đối soát tài chính cá nhân ngoại tuyến. |
| **P6** | **Module Quản lý Công việc & Năng suất (To-Do List)** | | | | |
| T6.1 | Quản lý Công việc | API & UI CRUD Task với Deadline và Mức độ ưu tiên. | [ ] Todo | High | Modal thêm nhanh, chọn ngày giờ hạn chót, độ ưu tiên từ Low đến Urgent. |
| T6.2 | Quản lý Công việc | Chế độ hiển thị List View & Kanban Board kéo thả. | [ ] Todo | High | Kéo thả card giữa các cột To-Do, In Progress, Done với animation mượt mà. |
| T6.3 | Quản lý Công việc | Engine Xử lý Task Lặp lại Định kỳ (Recurring Task Engine). | [ ] Todo | Med | Tự động sinh task mới theo chu kỳ Hàng ngày / Hàng tuần / Hàng tháng. |
| T6.4 | Quản lý Công việc | Bộ lọc Nhiệm vụ Thông minh (Hôm nay, 7 ngày tới, Quá hạn, Đã xong). | [ ] Todo | Med | Lọc nhanh đa tiêu chí kết hợp tìm kiếm theo tiêu đề công việc. |
| **P7** | **Module Ghi chú & Kho Tri thức (Notes)** | | | | |
| T7.1 | Ghi chú & Tri thức | API & UI CRUD Ghi chú với Rich Markdown Editor. | [ ] Todo | High | Định dạng văn bản đầy đủ, gắn nhãn Tags JSONB, đổi màu thẻ ghi chú. |
| T7.2 | Ghi chú & Tri thức | Tích hợp Tải file Đính kèm an toàn qua Pre-signed URLs. | [ ] Todo | High | Xác thực Magic Bytes nhị phân (ảnh/pdf), giới hạn 5MB/file, đặt tên UUIDv4. |
| T7.3 | Ghi chú & Tri thức | Tích hợp DOMPurify làm sạch mã Markdown chống Stored XSS. | [ ] Todo | High | Làm sạch cả ở Client và Server trước khi lưu và hiển thị. |
| T7.4 | Ghi chú & Tri thức | Tìm kiếm Toàn văn (Full-Text Search) qua PostgreSQL `tsvector`. | [ ] Todo | Med | Tìm kiếm cực nhanh theo từ khóa trong tiêu đề, nội dung và tags. |
| T7.5 | Ghi chú & Tri thức | Chuyển đổi Chế độ xem Grid Cards (Google Keep) & List View. | [ ] Todo | Low | Tối ưu hiển thị theo nhu cầu đọc nhanh hay xem dạng lưới trực quan. |
| **P8** | **UI/UX Pro Max, Trợ năng & Đóng gói Kiểm thử** | | | | |
| T8.1 | UI/UX & Kiểm thử | Áp dụng Design Tokens & Phong cách Flat Design + Micro-interactions. | [x] Done | High | Bảng màu ngữ nghĩa rõ ràng, typography Inter/Plus Jakarta Sans. |
| T8.2 | UI/UX & Kiểm thử | Tối ưu Mobile-First Thumb Zone cho thao tác 1 tay trên di động. | [x] Done | High | Thanh điều hướng dưới cùng, nút thêm nhanh nằm trong vùng ngón cái. |
| T8.3 | UI/UX & Kiểm thử | Hoàn thiện Chế độ Dark Mode / Light Mode với Toggle mượt mà. | [x] Done | Med | Đã có sẵn toggle state và áp dụng class dark trong App.tsx. |
| T8.4 | UI/UX & Kiểm thử | Triển khai Optimistic UI, Skeleton Loading & Toast Notifications. | [ ] Todo | Med | Tránh giật khung hình (Zero CLS < 0.1), thông báo phản hồi thao tác tức thì. |
| T8.5 | UI/UX & Kiểm thử | Kiểm tra Chuẩn Tiếp cận Trợ năng WCAG 2.1 AA. | [ ] Todo | Med | Đảm bảo tỷ lệ tương phản >4.5:1, keyboard navigation đầy đủ. |
| T8.6 | UI/UX & Kiểm thử | Viết Unit/Integration Test & Kiểm tra Bảo mật OWASP Top 10. | [ ] Todo | High | Kiểm thử tự động IDOR, XSS, SQLi, Rate Limiting, tính toàn vẹn chuyển tiền. |