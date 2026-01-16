# 📦 Tech Gadget Manager

![Docker Image Version (latest by date)](https://img.shields.io/github/v/release/duongcamcute/tech-gadget-manager?label=version)
![Docker Pulls](https://img.shields.io/docker/pulls/duongcamcute/tech-gadget-manager?logo=docker)
![License](https://img.shields.io/github/license/duongcamcute/tech-gadget-manager)

**Tech Gadget Manager** là ứng dụng quản lý kho đồ công nghệ cá nhân (Homelab Inventory), giúp bạn theo dõi, phân loại và quản lý các thiết bị, dây cáp, sạc dự phòng... một cách trực quan và khoa học.

![App Screenshot](https://raw.githubusercontent.com/duongcamcute/tech-gadget-manager/main/public/screenshots/demo.png)
*(Lưu ý: Bạn cần thay link ảnh demo thực tế)*

## ✨ Tính Năng Nổi Bật

-   📦 **Quản lý kho đồ**: Lưu trữ thông tin chi tiết (Tên, Loại, Thương hiệu, Thông số kỹ thuật, Vị trí...).
-   🔍 **Tìm kiếm & Lọc**: Tìm nhanh món đồ thất lạc chỉ trong vài giây.
-   📱 **Giao diện Mobile-First**: Tối ưu hoàn toàn cho điện thoại, hỗ trợ cài đặt như App (PWA).
-   📷 **QR Code**: Tạo và quét mã QR để xem nhanh thông tin thiết bị.
-   🌓 **Dark Mode**: Giao diện tối hiện đại, dịu mắt.
-   🐳 **Docker Ready**: Triển khai dễ dàng trên mọi nền tảng (Synology, Unraid, Portainer...).

---

## 🚀 Cài Đặt Nhanh (Docker Compose)

Cách đơn giản nhất để chạy ứng dụng là sử dụng Docker Compose.

### 1. Tạo file `docker-compose.yml`

```yaml
version: '3.8'

services:
  app:
    container_name: tech-gadget-manager
    image: ghcr.io/duongcamcute/tech-gadget-manager:latest
    restart: always
    ports:
      - "3000:3000"
    environment:
      - DATABASE_URL=file:/app/db/prod.db
      - NODE_ENV=production
    volumes:
      - ./data:/app/db
```

### 2. Khởi chạy

```bash
docker-compose up -d
```
Truy cập: `http://localhost:3000`

---

## 🐳 Hướng Dẫn Cho Unraid

Ứng dụng đã được tối ưu cho Unraid (tự động xử lý quyền truy cập volume).

1.  **Add Container** > Bật **Advanced View**.
2.  **Thông số**:
    *   **Repository**: `ghcr.io/duongcamcute/tech-gadget-manager:latest`
    *   **Network**: Bridge
    *   **WebUI**: `http://[IP]:[PORT:3000]`
3.  **Port Mappings**:
    *   Container Port: `3000` <-> Host Port: `3000` (hoặc tùy chọn).
4.  **Path Mappings** (Quan trọng):
    *   Container Path: `/app/db`
    *   Host Path: `/mnt/user/appdata/tech-gadget-manager`
5.  **Environment Variables**:
    *   Key: `DATABASE_URL` | Value: `file:/app/db/prod.db`
    *   Key: `NODE_ENV` | Value: `production`

---

## 🛠️ Cập Nhật (Update)

Để cập nhật lên phiên bản mới nhất:

```bash
# 1. Kéo image mới
docker-compose pull

# 2. Tái tạo container
docker-compose up -d
```

*(Với Unraid: Chọn "Check for Updates" hoặc "Force Update" trong menu Docker)*

---

## ⚙️ Biến Môi Trường (Environment Variables)

| Biến | Mặc định | Mô tả |
| :--- | :--- | :--- |
| `DATABASE_URL` | `file:/app/db/prod.db` | Đường dẫn kết nối database (SQLite). Nên giữ nguyên để map volume. |
| `NODE_ENV` | `production` | Môi trường chạy ứng dụng. |

---

## 📝 License

Dự án được phát hành dưới giấy phép [MIT License](LICENSE).
Copyright © 2024 DuongCam.
