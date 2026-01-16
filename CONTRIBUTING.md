# Hướng Dẫn Phát Triển (Developer Guide)

Chào mừng bạn đến với **Tech Gadget Manager**! Tài liệu này sẽ giúp bạn thiết lập môi trường để phát triển tính năng mới cho dự án.

## 🛠️ Công Nghệ Sử Dụng

-   **Framework**: Next.js 16 (App Router)
-   **Database**: SQLite + Prisma ORM
-   **State Management**: Zustand
-   **Styling**: Tailwind CSS
-   **UI Components**: Shadcn UI + Lucide React
-   **PWA**: `next-pwa`

## 🚀 Cài Đặt Môi Trường (Local Dev)

### 1. Yêu cầu
-   Node.js 18+
-   Git

### 2. Clone dự án

```bash
git clone https://github.com/duongcamcute/tech-gadget-manager.git
cd tech-gadget-manager
```

### 3. Cài đặt dependencies

```bash
npm install
```

### 4. Khởi tạo Database

Dự án sử dụng SQLite nên không cần cài đặt database server riêng.

```bash
# Tạo file .env (nếu chưa có)
echo 'DATABASE_URL="file:./dev.db"' > .env

# Chạy migration để tạo bảng
npx prisma migrate dev
```

### 5. Chạy ứng dụng

```bash
npm run dev
```
Truy cập: `http://localhost:3000`

---

## 🏗️ Cấu Trúc Thư Mục

-   `src/app`: Chứa các Pages (Next.js App Router).
-   `src/components`: Các UI component nhỏ (Button, Input...).
-   `src/features`: Các module chức năng lớn (InventoryManager, Sidebar...).
-   `src/store`: Quản lý state toàn cục (useAuthStore...).
-   `src/lib`: Các hàm tiện ích (utils) và constants.
-   `prisma`: Schema database và file `dev.db`.

## 📦 Đóng Gói (Build)

Để kiểm tra bản build production:

```bash
npm run build
npm start
```

## 🐳 Docker Build

Nếu bạn muốn test build Docker image tại máy:

```bash
docker build -t tech-gadget-manager .
docker run -p 3000:3000 tech-gadget-manager
```

---

**Chúc bạn code vui vẻ!** Nếu có thắc mắc, hãy tạo Issue trên Github.
