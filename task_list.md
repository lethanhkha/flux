---
project: Flux - Personal Productivity & Financial Workspace
description: Không gian làm việc cá nhân All-in-one tinh gọn kết hợp Tài chính, To-Do list và Ghi chú Markdown với bảo mật web toàn diện.
tech_stack: 
  - backend: NodeJS (v20+ LTS, TypeScript), Modular Architecture, Prisma/Drizzle
  - frontend: ReactJS (TypeScript), Vite, TailwindCSS, shadcn/ui, TanStack Query
  - database: PostgreSQL 16 (ACID Transactions, Full-text Search tsvector, JSONB), Redis 7 (Cache, Token Blacklist, Rate Limiting)
  - storage: AWS S3 / Cloudflare R2 / MinIO (Pre-signed URLs)
  - security: Dual JWT + RTR, 2FA (TOTP RFC 6238), Argon2id/BCrypt, Zod, DOMPurify, Helmet, Rate Limiter
created_at: 2026-10-15
status: ready-for-development
version: 1.0
---

# Kế Hoạch Thực Hiện Dự Án FLUX (Development Roadmap)

Bảng công việc chi tiết được tổ chức theo 8 giai đoạn tuần tự, đảm bảo sản phẩm hoàn thiện với trải nghiệm cá nhân mượt mà và nền tảng an ninh web vững chắc.

---

## Bảng Task Chi Tiết

| ID | Giai đoạn | Tên công việc (Task) | Trạng thái | Ưu tiên | Ghi chú kỹ thuật / Chi tiết bảo mật |
| :--- | :--- | :--- | :---: | :---: | :--- |
| **P1** | **Khởi tạo Môi trường & Nền tảng** | | | | |
| T1.1 | Môi trường & Nền tảng | Khởi tạo Git repository & cấu hình `.gitignore`. | [x] Done | High | Thiết lập nhánh `main`, commit khởi tạo hoàn chỉnh. |
| T1.2 | Môi trường & Nền tảng | Khởi tạo dự án Backend NodeJS với TypeScript. | [x] Done | High | Cấu trúc Modular Layered, Helmet, CORS, Rate Limiter, Error Masking. |
| T1.3 | Môi trường & Nền tảng | Khởi tạo dự án Frontend React (TypeScript, Vite, TailwindCSS, shadcn/ui). | [x] Done | High | Tích hợp Lucide icons, Dark/Light mode, Semantic Palette, Dashboard layout. |
| T1.4 | Môi trường & Nền tảng | Cấu hình Docker Compose cho PostgreSQL 16 & Redis 7. | [x] Done | High | Đã tạo docker-compose.yml có health checks và persistent volumes. |
| T1.5 | Môi trường & Nền tảng | Cấu hình Lưu trữ Tệp tin (S3 / Cloudflare R2 / MinIO). | [ ] Todo | High | Chuẩn bị bucket bảo mật, cấu hình CORS chỉ phục vụ Pre-signed URLs. |
| **P2** | **Cơ sở Dữ liệu & Data Models** | | | | |
| T2.1 | Database Schema | Thiết kế bảng `users` & quản lý định danh. | [ ] Todo | High | UUIDv4, băm mật khẩu, 2FA secret, backup codes băm, login lock timestamp. |
| T2.2 | Database Schema | Thiết kế bảng `wallets` & `transactions`. | [ ] Todo | High | Khóa ngoại `user_id`, kiểu tiền `NUMERIC(15,2)`, index `transaction_date`. |
| T2.3 | Database Schema | Thiết kế bảng `tasks`. | [ ] Todo | High | Trạng thái, độ ưu tiên, deadline, quy tắc lặp lại (recurrence), index `due_date`. |
| T2.4 | Database Schema | Thiết kế bảng `notes` & `attachments`. | [ ] Todo | High | PostgreSQL `tsvector` cho Full-text search, JSONB tags, bảng tệp đính kèm. |
| T2.5 | Database Schema | Viết Prisma Schema & chạy Database Migration ban đầu. | [ ] Todo | High | Thiết lập quan hệ khóa ngoại, cascading delete an toàn. |
| **P3** | **Xác thực & Bảo mật Web Toàn diện (Auth & Security Core)** | | | | |
| T3.1 | Bảo mật & Auth | Xây dựng API Đăng ký tài khoản & Băm mật khẩu (Argon2id/BCrypt). | [ ] Todo | High | Cost factor = 12, kiểm tra độ phức tạp và từ chối mật khẩu rò rỉ phổ biến. |
| T3.2 | Bảo mật & Auth | Xác thực Email qua Signed HMAC Token với hạn dùng 15 phút. | [ ] Todo | High | Kích hoạt tài khoản an toàn, chống enumeration email. |
| T3.3 | Bảo mật & Auth | Xây dựng kiến trúc Dual JWT Token (Access Token + Refresh Token Cookie). | [ ] Todo | High | Access Token 15m (in-memory); Refresh Token 7d (HttpOnly, Secure, SameSite=Strict). |
| T3.4 | Bảo mật & Auth | Cơ chế Xoay vòng Refresh Token (RTR) & Phát hiện lộ token. | [ ] Todo | High | Tự động hủy token cũ, thu hồi phiên nếu phát hiện token bị tái sử dụng. |
| T3.5 | Bảo mật & Auth | Tích hợp Redis Token Blacklist khi Đăng xuất & Đổi mật khẩu. | [ ] Todo | High | Thu hồi hiệu lực token tức thì trên toàn hệ thống. |
| T3.6 | Bảo mật & Auth | Tích hợp Xác thực 2 yếu tố (2FA / TOTP RFC 6238). | [ ] Todo | High | Cấp QR code kích hoạt, xác thực TOTP qua authenticator app, cấp mã dự phòng. |
| T3.7 | Bảo mật & Auth | Redis Distributed Rate Limiter & Chống Brute-force. | [ ] Todo | High | Khóa tài khoản 15 phút sau 5 lần sai pass, giới hạn 5 req/phút ở `/auth`. |
| T3.8 | Bảo mật & Auth | Cấu hình HTTP Security Headers (Helmet: HSTS, CSP, X-Frame-Options: DENY). | [ ] Todo | High | Chặn clickjacking, MIME sniffing, và inline script không an toàn. |
| T3.9 | Bảo mật & Auth | Cấu hình CORS chặt chẽ & Zero-Trust Validation (Zod). | [ ] Todo | High | Chỉ cho phép whitelist domain FE, loại bỏ trường thừa chống mass assignment. |
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
| T7.2 | Ghi chú & Tri thức | Tích hợp Tải file Đính kèm an toàn qua S3 Pre-signed URLs. | [ ] Todo | High | Xác thực Magic Bytes nhị phân (ảnh/pdf), giới hạn 5MB/file, đặt tên UUIDv4. |
| T7.3 | Ghi chú & Tri thức | Tích hợp DOMPurify làm sạch mã Markdown chống Stored XSS. | [ ] Todo | High | Làm sạch cả ở Client và Server trước khi lưu và hiển thị. |
| T7.4 | Ghi chú & Tri thức | Tìm kiếm Toàn văn (Full-Text Search) qua PostgreSQL `tsvector`. | [ ] Todo | Med | Tìm kiếm cực nhanh theo từ khóa trong tiêu đề, nội dung và tags. |
| T7.5 | Ghi chú & Tri thức | Chuyển đổi Chế độ xem Grid Cards (Google Keep) & List View. | [ ] Todo | Low | Tối ưu hiển thị theo nhu cầu đọc nhanh hay xem dạng lưới trực quan. |
| **P8** | **UI/UX Pro Max, Trợ năng & Đóng gói Kiểm thử** | | | | |
| T8.1 | UI/UX & Kiểm thử | Áp dụng Design Tokens & Phong cách Flat Design + Micro-interactions. | [ ] Todo | High | Bảng màu ngữ nghĩa rõ ràng, typography Inter/Plus Jakarta Sans. |
| T8.2 | UI/UX & Kiểm thử | Tối ưu Mobile-First Thumb Zone cho thao tác 1 tay trên di động. | [ ] Todo | High | Thanh điều hướng dưới cùng, nút thêm nhanh nằm trong vùng ngón cái. |
| T8.3 | UI/UX & Kiểm thử | Hoàn thiện Chế độ Dark Mode / Light Mode với Toggle mượt mà. | [ ] Todo | Med | Hỗ trợ chuyển đổi tự động theo hệ điều hành hoặc lưu tùy chọn người dùng. |
| T8.4 | UI/UX & Kiểm thử | Triển khai Optimistic UI, Skeleton Loading & Toast Notifications. | [ ] Todo | Med | Tránh giật khung hình (Zero CLS < 0.1), thông báo phản hồi thao tác tức thì. |
| T8.5 | UI/UX & Kiểm thử | Kiểm tra Chuẩn Tiếp cận Trợ năng WCAG 2.1 AA. | [ ] Todo | Med | Đảm bảo tỷ lệ tương phản >4.5:1, keyboard navigation đầy đủ. |
| T8.6 | UI/UX & Kiểm thử | Viết Unit/Integration Test & Kiểm tra Bảo mật OWASP Top 10. | [ ] Todo | High | Kiểm thử tự động IDOR, XSS, SQLi, Rate Limiting, tính toàn vẹn chuyển tiền. |