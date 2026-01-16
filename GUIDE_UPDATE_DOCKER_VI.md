# Hướng Dẫn Cập Nhật Docker (Full Reset)

Tài liệu này hướng dẫn cách cập nhật ứng dụng lên phiên bản mới nhất, đảm bảo code sạch và không xung đột.

## Bước 1: Kéo Code Mới Nhất
Mở terminal (hoặc CMD/PowerShell) tại thư mục dự án và chạy:

```bash
git pull origin main
```

> **Lưu ý**: Nếu gặp lỗi xung đột (conflict), hãy backup file `.env` và database `prisma/dev.db` ra chỗ khác, sau đó xóa thư mục và clone lại từ đầu cho sạch.

## Bước 2: Build Lại Docker Image
Vì code đã thay đổi (thêm tính năng, sửa giao diện), bạn cần build lại image mới. Lệnh sau sẽ build lại toàn bộ mà KHÔNG dùng cache cũ để tránh lỗi vặt:

```bash
docker-compose build --no-cache
```

## Bước 3: Khởi Động Lại Ứng Dụng
Sau khi build xong, chạy lệnh sau để tái khởi động container:

```bash
docker-compose up -d
```

## Bước 4: Kiểm Tra
Truy cập lại vào: `http://localhost:3000` (hoặc IP server của bạn).
- Vào **Cài đặt hệ thống** -> **Hệ thống & API** -> **Nhập dữ liệu** (nếu bạn lỡ tay xóa database).

---

### 💡 Mẹo Xử Lý Sự Cố

**1. Nếu vẫn thấy giao diện cũ?**
- Nhấn `Ctrl + Shift + R` (hoặc `Cmd + Shift + R` trên Mac) để xóa cache trình duyệt.

**2. Nếu bị lỗi Database?**
- Vào container và đồng bộ lại schema:
```bash
docker exec -it tech-gadget-manager npx prisma db push
```
