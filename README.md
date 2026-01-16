# 📦 Tech Gadget Manager

**Quản lý kho thiết bị công nghệ cá nhân - Đơn giản, Hiệu quả, Hiện đại.**

![Dashboard](https://raw.githubusercontent.com/duongcamcute/tech-gadget-manager/main/public/screenshots/dashboard.png)

## 🌐 Web Demo

Trải nghiệm ngay phiên bản Demo trực tuyến tại đây: (admin/admin)
👉 **[Live Demo](https://tech-gadget-manager.vercel.app)**

> **⚠️ Lưu ý Web Demo**:
> *   Dữ liệu mẫu có thể được reset định kỳ.
> *   **Chế độ Read-Only**: Các tính năng Thêm/Sửa/Xóa sẽ bị khóa để đảm bảo an toàn.
> *   Tốc độ có thể chậm hơn bản tự host do giới hạn của gói Free.

---

## ✨ Giới Thiệu

Tech Gadget Manager là giải pháp tự-host (self-hosted) giúp bạn kiểm soát toàn bộ tài sản công nghệ.

### Tính Năng Nổi Bật
*   📱 **Mobile First**: Giao diện ứng dụng PWA mượt mà trên điện thoại.
*   🏷️ **Bag Mode**: Quản lý đồ đạc theo từng Vị trí (Túi, Balo, Ngăn kéo).
*   ⚡ **Tra cứu**: Tìm kiếm theo thông số (W, mm, mAh), màu sắc.
*   🤝 **Mượn/Trả**: Quản lý lịch sử cho mượn đồ.
*   🖨️ **QR Code**: In tem định danh tài sản.
*   🔐 **Bảo mật**: Admin an toàn, tự động khóa setup.

![Mobile View](https://raw.githubusercontent.com/duongcamcute/tech-gadget-manager/main/public/screenshots/mobile_dashboard.png)

---

## 🚀 Cài Đặt (Docker)

Chạy 1 lệnh duy nhất để khởi tạo server:

```bash
docker run -d \
  --name tech-gadget-manager \
  --restart unless-stopped \
  -p 3000:3000 \
  -v $(pwd)/db:/app/db \
  -e DATABASE_URL="file:./db/prod.db" \
  ghcr.io/duongcamcute/tech-gadget-manager:latest
```

*   **Truy cập**: `http://localhost:3000`
*   **Tài khoản**: `admin` / `admin`

---

## 💻 Hướng Dẫn Dev

1.  **Clone Source**:
    ```bash
    git clone https://github.com/duongcamcute/tech-gadget-manager.git
    cd tech-gadget-manager
    ```

2.  **Cài Đặt**:
    ```bash
    npm install
    npx prisma migrate dev
    ```

3.  **Chạy Local**:
    ```bash
    npm run dev
    ```
    Truy cập: `http://localhost:3000`

---
*Created by [DuongCamCute](https://github.com/duongcamcute)*
