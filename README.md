# 📦 Tech Gadget Manager

**Quản lý kho thiết bị công nghệ cá nhân - Đơn giản, Hiệu quả, Hiện đại.**

![Dashboard](https://raw.githubusercontent.com/duongcamcute/tech-gadget-manager/main/public/screenshots/dashboard.png)

## ✨ Giới Thiệu

Tech Gadget Manager là ứng dụng web giúp bạn tổ chức và quản lý tài sản công nghệ của mình.

### Tính Năng Nổi Bật
*   📱 **Giao diện hiện đại**: Tối ưu cho Mobile & Desktop (PWA).
*   🏷️ **Quản lý Vị trí (Bag Mode)**: Biết chính xác món đồ đang ở túi nào.
*   ⚡ **Tra cứu nhanh**: Lọc theo công suất, độ dài, màu sắc...
*   🤝 **Cho mượn**: Theo dõi ai mượn, ngày trả.
*   🖨️ **QR Code**: In tem quản lý tài sản chuyên nghiệp.

![Mobile](https://raw.githubusercontent.com/duongcamcute/tech-gadget-manager/main/public/screenshots/mobile_dashboard.png)

---

## 🚀 Cài Đặt (Docker)

Bạn có thể tự build và chạy Docker container từ source code này:

1. **Build Image**:
   ```bash
   docker build -t tech-gadget-manager .
   ```

2. **Chạy Container**:
   ```bash
   docker run -d \
     --name tech-gadget-manager \
     -p 3000:3000 \
     -v $(pwd)/db:/app/db \
     -e DATABASE_URL="file:./db/prod.db" \
     tech-gadget-manager
   ```

3. **Truy cập**: `http://localhost:3000` (Tài khoản: `admin` / `admin`)

---

## 💻 Hướng Dẫn Dev (Phát Triển)

Để chạy dự án trên máy tính cá nhân để chỉnh sửa code:

### Yêu Cầu
*   Node.js 20+
*   Git

### Các Bước
1.  **Clone Source**:
    ```bash
    git clone https://github.com/duongcamcute/tech-gadget-manager.git
    cd tech-gadget-manager
    ```

2.  **Cài Đặt Library**:
    ```bash
    npm install
    ```

3.  **Khởi tạo Database**:
    ```bash
    npx prisma migrate dev
    ```

4.  **Chạy Localhost**:
    ```bash
    npm run dev
    ```
    Web sẽ chạy tại: `http://localhost:3000`

---
*Project by DuongCamCute*
