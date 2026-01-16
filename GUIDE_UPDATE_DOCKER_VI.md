# Hướng Dẫn Cập Nhật Ứng Dụng (cho NAS / Unraid)

Hệ thống đã được cấu hình **CI/CD tự động**. Mỗi khi có bản cập nhật mới, Docker Image sẽ tự động được build và đẩy lên Github Container Registry (GHCR).

## 1. Cấu hình Tự động (Đã có sẵn)
- **Github Actions**: File `.github/workflows/docker-publish.yml` sẽ tự động build image khi code được push vào nhánh `main`.
- **Registry**: `ghcr.io/<username>/tech-gadget-manager:latest`

## 2. Cách Cập Nhật trên Unraid OS

Bạn KHÔNG CẦN phải chạy lệnh thủ công hay build lại code. Chỉ cần làm như sau:

1.  Truy cập trang quản lý **Docker** trên Unraid.
2.  Tìm container **tech-gadget-manager**.
3.  Click vào biểu tượng **Update** (hoặc check "Basic View" -> "Check for Updates").
4.  Nếu không thấy nút Update, chọn **"Force Update"** (Update cưỡng bức):
    - Click vào icon Container -> Chọn **Advanced View** (nếu cần).
    - Chọn **Force Update**.
    - Hệ thống sẽ tự động:
        - Pull image mới nhất từ GHCR.
        - Xóa container cũ.
        - Tạo container mới với giữ nguyên dữ liệu (nếu đã map volume `/app/prisma`).

## 3. Lưu ý Quan Trọng
- **Database**: Đảm bảo đường dẫn `/app/prisma` trong Docker Template đã được map ra thư mục trên NAS (ví dụ: `/mnt/user/appdata/tech-manager/db`) để không bị mất dữ liệu khi update.
- **Cache**: Sau khi update, nếu giao diện web vẫn cũ, hãy nhấn `Ctrl + Shift + R` để xóa cache trình duyệt.

---
*Phiên bản hiện tại: v1.1.0*
