# Release Notes v1.2.0 🚀

**Ngày phát hành:** 24/01/2026
**Phiên bản:** 1.2.0 (Stable)

---

## 🌟 Tính Năng Mới (Features)

### 1. Thống Kê Thiết Bị Chưa Phân Loại
- Thêm thẻ **Unsorted (Chưa phân loại)** vào Dashboard.
- Giúp nhanh chóng lọc ra các thiết bị chưa được gán vị trí (`Location`).
- Hiển thị trực quan số lượng cần xử lý.

### 2. Hệ Thống Docker & CI/CD Tự Động
- **Github Actions**: Tự động build và push Docker Image lên GHCR khi có tag release (`v*`).
- **Docker Compose**: File cấu hình chuẩn cho Production, hỗ trợ persistent data volume.

### 3. Nâng Cấp Bảo Mật (Security Hardening)
- Chuyển đổi Authentication sang **HttpOnly Cookies** & **JWT**.
- Mã hóa mật khẩu người dùng (Bcrypt).
- Ngăn chặn XSS và Session Hijacking tốt hơn so với version cũ.

---

## 🛠️ Sửa Lỗi (Bug Fixes)

- **Logout Loop**: Sửa lỗi vòng lặp chuyển hướng khi đăng xuất (do cookie không đồng bộ).
- **Chart UI Warning**: Khắc phục các cảnh báo `width(-1)` của thư viện Recharts trên Dashboard.
- **Type Safety**: Loại bỏ `any` và sửa lỗi duplicate code trong `actions.ts`.

---

## 📦 Hướng Dẫn Cập Nhật (Update Guide)

### Dành cho Docker/Unraid
1. Update `docker-compose.yml`:
   ```yaml
   image: ghcr.io/<your-github-username>/tech-gadget-manager:latest
   ```
2. Pull image mới:
   ```bash
   docker compose pull
   docker compose up -d
   ```
   *(Hệ thống sẽ tự động migrate database khi khởi động)*

### Dành cho Dev
```bash
git pull
npm install
npx prisma generate
npm run dev
```

---

*Cảm ơn bạn đã sử dụng Tech Gadget Manager!*
