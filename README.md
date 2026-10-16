# Flux — Personal Productivity & Financial Workspace

> Một nền tảng không gian làm việc cá nhân hợp nhất hiện đại: Quản lý Tài chính thông minh, Làm chủ Công việc (To-do & Kanban), và Trạm Ý tưởng ghi chú Markdown với kiến trúc đám mây bảo mật cao.

---

## 🌟 Tính Năng Nổi Bật

### 1. 💰 Quản Lý Tài Chính Cá Nhân (Personal Finance)
- **Theo dõi dòng tiền**: Thu nhập, chi phí và chuyển khoản với số dư tài khoản được tái tính toán theo chuẩn giao dịch ACID.
- **Quản lý danh mục & thẻ**: Đổi tên, xóa danh mục trên toàn bộ dữ liệu lịch sử giao dịch.
- **Thanh lọc nhanh**: Bộ lọc con lăn chuột mượt mà, phân loại theo danh mục và thời gian.
- **Hiệu năng cao**: Hỗ trợ phân trang mượt mà cho 1.000+ giao dịch mà không giật lag.

### 2. 🎯 Làm Chủ Tiến Độ & Công Việc (Tasks & Kanban)
- **Bảng Kanban kéo thả**: Drag-and-drop HTML5 đổi trạng thái (`Cần làm` ➔ `Đang làm` ➔ `Hoàn thành`) tức thì.
- **Bộ lọc 2 tầng độc lập**: Lọc đồng thời theo Trạng thái (Hôm nay, Quá hạn, Khẩn cấp, Đã xong) và Thẻ phân loại.
- **Chu kỳ lặp lại & Hạn chót**: Nhắc nhở theo ngày, tuần, tháng với độ ưu tiên trực quan.

### 3. 📝 Trạm Ý Tưởng & Ghi Chú (Notes & Markdown)
- **Soạn thảo Markdown phong phú**: Thanh công cụ chèn nhanh Tiêu đề (H1-H3), In đậm, Danh sách, Checkbox, Bảng biểu kèm tab Xem Trước trực tiếp.
- **Bộ hiển thị sạch sẽ**: Định dạng Markdown chuẩn, loại bỏ các ký tự thô hay thẻ HTML gây rối mắt.
- **Hệ thống nhãn đa màu sắc**: Bảng 12 màu Pastel sang trọng cùng bộ chọn màu RGB / Hex tùy chỉnh linh hoạt.
- **Tìm kiếm toàn văn (FTS)**: Tìm kiếm nhanh trên hàng nghìn ghi chú.

### 4. 🛡️ An Toàn & Bảo Mật Chuẩn Enterprise
- **Bảo mật xác thực**: JWT Access Token (in-memory) + HttpOnly Refresh Token Rotation (RTR).
- **Phòng vệ chủ động**: Helmet HTTP Security Headers, CORS nghiêm ngặt, Rate Limiter 600 req/min chống brute-force và DDoS.
- **Chống Bot tự động**: Tích hợp Cloudflare Turnstile CAPTCHA vô hình.

---

## 🛠️ Công Nghệ Sử Dụng

| Tầng | Công nghệ |
| :--- | :--- |
| **Frontend** | React 18, TypeScript, Vite, Tailwind CSS, Lucide React, Recharts, Sonner |
| **Backend** | Node.js, Express.js, TypeScript, Prisma ORM, Zod Validation, Argon2 |
| **Cơ sở dữ liệu** | PostgreSQL 17 (Supabase Cloud với PgBouncer Connection Pooler) |
| **Cache & Queue** | In-Memory Cache + Redis (Hỗ trợ Upstash Serverless) |
| **Bảo mật** | JWT, HttpOnly Cookies, Helmet, Express Rate Limit, Cloudflare Turnstile |

---

## 🚀 Hướng Dẫn Cài Đặt Cục Bộ (Local Development)

### 1. Yêu cầu hệ thống
- Node.js >= 18.x
- npm hoặc yarn / pnpm

### 2. Cài đặt Backend
```bash
cd server
npm install
cp .env.example .env
# Chỉnh sửa file .env với thông tin database của bạn
npx prisma generate
npm run dev
```

### 3. Cài đặt Frontend
```bash
cd client
npm install
cp .env.example .env
npm run dev
```

Ứng dụng sẽ khả dụng tại:
- Frontend: `http://localhost:5173`
- Backend API: `http://localhost:5000/api/v1`

---

## ☁️ Hướng Dẫn Triển Khai Đám Mây (Cloud Deployment)

### 1. Frontend (Vercel / Cloudflare Pages)
- **Framework Preset**: `Vite`
- **Root Directory**: `client`
- **Build Command**: `npm run build`
- **Output Directory**: `dist`
- **Environment Variable**: `VITE_API_BASE_URL="https://your-api-domain.com/api/v1"`

### 2. Backend (Render / Railway / Fly.io)
- **Root Directory**: `server`
- **Build Command**: `npm install && npx prisma generate && npm run build`
- **Start Command**: `npm start` (hoặc `node dist/index.js`)
- **Environment Variables**:
  - `NODE_ENV=production`
  - `PORT=5000`
  - `CLIENT_ORIGIN=https://your-frontend-domain.com`
  - `DATABASE_URL=postgresql://...` (Supabase connection pooler URL)
  - `JWT_ACCESS_SECRET=your_jwt_access_secret`
  - `JWT_REFRESH_SECRET=your_jwt_refresh_secret`
  - `COOKIE_SECRET=your_cookie_secret`

---

## 📄 Bản Quyền
Dự án được phân phối dưới giấy phép [MIT](LICENSE).
