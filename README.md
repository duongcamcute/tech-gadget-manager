# 📦 Tech Gadget Manager (TGM)

![Docker Build](https://github.com/duongcamcute/tech-gadget-manager/actions/workflows/docker-publish.yml/badge.svg)
![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Version](https://img.shields.io/badge/version-1.1.0-green.svg)

**Tech Gadget Manager** là ứng dụng quản lý kho thiết bị cá nhân/gia đình hiện đại, giúp bạn theo dõi tài sản công nghệ, quản lý cho mượn và sắp xếp khoa học. Được thiết kế tối ưu cho **NAS Synology / Unraid** hoặc bất kỳ máy chủ Docker nào.

![Screenshot](https://raw.githubusercontent.com/duongcamcute/tech-gadget-manager/main/public/screenshots/dashboard-preview.png)
*(Lưu ý: Bạn cần thay link ảnh này bằng ảnh thực tế nếu có)*

## ✨ Tính Năng Nổi Bật

*   **⚡ Quản lý Kho**: Theo dõi thiết bị theo Vị trí (Túi, Tủ, Phòng), Hãng, Loại (Phone, Laptop, Cable...).
*   **🔍 Tìm kiếm & Lọc**: Tìm nhanh theo tên, thông số kỹ thuật (W, GB, mm...), màu sắc.
*   **🤝 Quản lý Cho Mượn**: Ghi nhận ai đang mượn, ngày trả dự kiến. Tự động lưu danh bạ người mượn.
*   **🏷️ QR Code**: Tạo và in thẻ QR Code cho từng món đồ hoặc từng túi (Bag Mode).
*   **📱 PWA & Mobile First**: Giao diện ứng dụng như App thật trên điện thoại.
*   **🔐 Bảo mật**: Hỗ trợ đăng nhập, phân quyền cơ bản. Chế độ **Admin Secure** (Tự khóa admin mặc định khi có user mới).
*   **🚀 Hiệu năng cao**: Chạy cực nhẹ trên Docker (Alpine Linux), hỗ trợ nén ảnh tự động (Sharp).

## 🚀 Cài Đặt Nhanh (Docker)

Cách đơn giản nhất là dùng lệnh sau:

```bash
docker run -d \
  --name tech-gadget-manager \
  -p 3000:3000 \
  -v $(pwd)/db:/app/db \
  -e DATABASE_URL="file:./db/prod.db" \
  ghcr.io/duongcamcute/tech-gadget-manager:latest
```

Truy cập: `http://localhost:3000`
Tài khoản mặc định: `admin` / `admin` (Hãy đổi ngay sau khi đăng nhập!)

## 📖 Hướng Dẫn Chi Tiết

*   **[Hướng dẫn cho Unraid OS](./GUIDE_DEPLOY_UNRAID_FINAL.md)** (Chi tiết từ A-Z)
*   [Hướng dẫn Cập nhật](./GUIDE_DEPLOY_UNRAID_FINAL.md#cập-nhật-phiên-bản-mới)

## 🛠️ Phát Triển (Dev)

Yêu cầu: Node.js 20+, Docker (tùy chọn).

```bash
# 1. Clone repo
git clone https://github.com/duongcamcute/tech-gadget-manager.git

# 2. Cài dependency
npm install

# 3. Chạy DB local
npx prisma migrate dev

# 4. Start App
npm run dev
```

## 🤝 Đóng Góp

Mọi đóng góp (Pull Request, Issue) đều được hoan nghênh!

---
*Created by [DuongCamCute](https://github.com/duongcamcute)*
