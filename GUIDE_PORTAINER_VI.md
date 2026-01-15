# Hướng dẫn Deploy bằng Portainer trên NAS

Đây là cách đơn giản nhất để chạy ứng dụng trên NAS Synology/QNAP... thông qua giao diện Portainer, không cần dùng SSH dòng lệnh.

## Bước 1: Chuẩn bị Image (Tự động)

Mình đã cài đặt một con robot (GitHub Actions). Mỗi khi bạn đẩy code lên GitHub (`git push`), GitHub sẽ tự động:
1.  Đóng gói code thành Docker Image.
2.  Lưu Image đó lại.
3.  Bạn chỉ việc vào Portainer và kéo về dùng.

**Lưu ý quan trọng**:
Nếu Repository của bạn là **Private** (Riêng tư), bạn cần tạo "Token" để Portainer có quyền kéo Image về.
(Nếu Repo là Public thì bỏ qua bước tạo Token này).

### Cách tạo Token (Nếu Repo Private):
1.  Trên GitHub, ấn vào Avatar -> **Settings**.
2.  Kéo xuống dưới cùng chọn **Developer settings**.
3.  Chọn **Personal access tokens** -> **Tokens (classic)**.
4.  Generate new token (classic).
5.  Tích vào: `write:packages`, `read:packages`, `delete:packages` và `repo`.
6.  Copy đoạn mã Token đó lại.

---

## Bước 2: Cài đặt trên Portainer

1.  Đăng nhập vào **Portainer**.
2.  (Nếu cần đăng nhập GitHub Container Registry):
    *   Vào **Registries** -> **Add registry**.
    *   Chọn **Custom registry**.
    *   Name: `GitHub` (hoặc gì cũng được).
    *   Registry URL: `ghcr.io`
    *   Authentication: Bật lên.
    *   Username: `Tên-GitHub-Của-Bạn` (ví dụ: duongcamcute).
    *   Password: `Mã-Token-Vừa-Tạo-Ở-Bước-1` (hoặc mật khẩu GitHub nếu không dùng 2FA, nhưng khuyên dùng Token).
    *   Ấn **Add registry**.

3.  Vào **Stacks** -> **Add stack**.
4.  Đặt tên: `tech-gadget-manager`.
5.  Trong khung **Web editor**, copy nội dung dưới đây:

```yaml
version: '3.8'

services:
  app:
    # Thay đổi đường dẫn image bên dưới cho đúng user của bạn
    image: ghcr.io/duongcamcute/tech-gadget-manager:latest
    container_name: tech-gadget-manager
    restart: always
    ports:
      - "3000:3000"
    environment:
      # Database file
      - DATABASE_URL=file:/app/db/prod.db
      - NODE_ENV=production
    volumes:
      # QUAN TRỌNG: Sửa đường dẫn bên trái dấu hai chấm (:)
      # Trỏ đến thư mục bạn muốn lưu data trên NAS.
      # Ví dụ trên Synology: /volume1/docker/tech-gadget-manager/data:/app/db
      - /path/to/your/nas/data:/app/db
```

6.  Ấn **Deploy the stack**.

---

## Bước 3: Cập nhật khi có phiên bản mới

Khi bạn code thêm tính năng và đẩy lên GitHub xong:
1.  Vào Portainer -> Chọn Stack `tech-gadget-manager`.
2.  Chọn tab **Editor**.
3.  Ấn nút **Update the stack**.
4.  Tích chọn **"Re-pull image"** (Quan trọng để nó tải bản mới nhất về).
5.  Ấn **Update**.

Dữ liệu của bạn (file `prod.db`) nằm trong thư mục bạn map ở phần `volumes`, nên sẽ **không bị mất** khi update.
