# 🐳 Hướng dẫn Docker & Bảo vệ Dữ liệu (Quan Trọng)

File này chứa hướng dẫn vận hành và update Docker an toàn cho Tech Gadget Manager.

## 🛑 BẢO VỆ DỮ LIỆU (Đọc kỹ)
Để tránh mất dữ liệu khi cập nhật phiên bản mới, hệ thống đã được cấu hình an toàn hơn:

1.  **Cơ chế An toàn:** Script khởi động (`docker-entrypoint.sh`) đã **BỎ** cờ `--accept-data-loss`.
    - **Trước đây:** Nếu cấu trúc DB thay đổi ảnh hưởng dữ liệu cũ -> Tự động XÓA dữ liệu cũ để chạy tiếp.
    - **Hiện tại:** Nếu cấu trúc DB thay đổi ảnh hưởng dữ liệu cũ -> **BÁO LỖI và DỪNG LẠI**. Container sẽ không khởi động được. Dữ liệu cũ được **GIỮ NGUYÊN AN TOÀN**.

2.  **Cách xử lý khi update bị lỗi DB:**
    - Nếu container báo lỗi liên quan đến DB migration, bạn cần backup file `prod.db` (trong thư mục `db/`) ra chỗ khác.
    - Sau đó xóa file `prod.db` cũ đi (hoặc move đi) để app tạo DB mới với cấu trúc mới.
    - Dùng tính năng **Import/Export** trong phần Cài đặt của App để chuyển dữ liệu cũ sang mới (nếu có thể).

## 🚀 Cách Update phiên bản mới
Mỗi khi có thông báo code mới đã được push lên GitHub:

```bash
# 1. Tải ảnh mới nhất về
docker-compose pull

# 2. Khởi động lại (dữ liệu nằm ngoài container nên vẫn còn)
docker-compose up -d
```

## 📂 Cấu trúc thư mục
- `./db/prod.db`: File Database chính. **TUYỆT ĐỐI KHÔNG XÓA** trừ khi đã backup.
- `./uploads/`: File ảnh đã upload.

## 🛠️ Backup Thủ công
Khuyên dùng trước mỗi lần update lớn:
```bash
# Copy file db ra file backup có ngày giờ
cp db/prod.db db/prod.db.bak.$(date +%F)
```
