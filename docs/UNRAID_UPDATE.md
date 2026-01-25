# Hướng dẫn Cập nhật trên Access/Unraid

Vì bạn đang sử dụng Unraid, bạn không cần chạy script thủ công. Hãy làm theo các bước sau trong giao diện Docker của Unraid hoặc Terminal:

## Cập nhật Biến Môi trường (Environment Variables)

Hãy thêm biến sau vào cấu hình container của bạn (Edit Container):

| Key | Value | Mô tả |
|-----|-------|-------|
| `PRISMA_SQLITE_WAL` | `true` | **Quan trọng**: Giúp app chạy nhanh hơn và tránh lỗi lock database |
| `DATABASE_URL` | `file:/app/db/prod.db` | Bắt buộc để dữ liệu không bị mất |

## Cách cập nhật (Update) an toàn

1. **Backup**: Vào thư mục appdata trên Unraid (thường là `/mnt/user/appdata/tech-gadget-manager/db`), copy file `prod.db` ra chỗ khác để dự phòng.

2. **Pull Image mới**:
   - Nếu dùng Docker Compose: Chạy `docker compose pull && docker compose up -d`
   - Nếu dùng Unraid UI: Bấm "Check for Updates" và "Apply Update".

> **Lưu ý**: Phiên bản mới `v1.5.1` đã được tối ưu sẵn trong code để tự động kích hoạt chế độ nhanh (WAL) nếu bạn set biến môi trường trên.
