# Hướng Dẫn Deploy Tech Gadget Manager trên Unraid (Từ Đầu)

Tài liệu này hướng dẫn chi tiết cách cài đặt ứng dụng lên Unraid OS, đảm bảo môi trường hoạt động tốt nhất và ổn định nhất.

---

## 🚀 1. Chuẩn Bị
Trước khi bắt đầu, hãy đảm bảo bạn đã có:
- **Unraid OS** đang chạy.
- **Docker** service đã bật.
- Cài đặt plugin **Community Applications** (App Store của Unraid).
- Đã tạo một thư mục để lưu database (ví dụ: `/mnt/user/appdata/tech-manager`).

---

## 🛠️ 2. Cài Đặt (Add Container)

Vì ứng dụng này chưa có sẵn trên Community App Store công khai, bạn sẽ thêm nó thủ công (nhưng rất dễ).

1. Vào tab **Docker** trên Unraid.
2. Kéo xuống dưới cùng, chọn **[Add Container]**.
3. Điền thông tin cấu hình như sau:

| Trường (Field) | Giá Trị (Value) | Ghi chú |
| :--- | :--- | :--- |
| **Name** | `tech-gadget-manager` | Tên container |
| **Repository** | `ghcr.io/duongcamcute/tech-gadget-manager:latest` | Đường dẫn image |
| **Network Type** | `Bridge` | Để mặc định |
| **Console Shell Command** | `Shell` | |
| **Privileged** | `Off` | Không cần quyền root cao nhất |
| **Icon URL** | `https://raw.githubusercontent.com/duongcamcute/tech-gadget-manager/main/public/icons/icon-512.png` | Icon ứng dụng đẹp |
| **WebUI** | `http://[IP]:[PORT:3000]/` | Để bấm vào icon là mở web |


### Thêm Port (Cổng truy cập)
- Nhấn **Add another Path, Port, Variable, Label or Device**.
- Chọn Config Type: **Port**.
- **Container Port**: `3000` (BẮT BUỘC)
- **Host Port**: `3000` (Hoặc số khác tùy bạn, ví dụ 3030 nếu 3000 đã dùng)
- Nhấn **SAVE**.

### Thêm Volume (Lưu trữ Dữ liệu - QUAN TRỌNG)
Để không mất dữ liệu khi update, bạn cần map thư mục database.
- Nhấn **Add another Path, Port, Variable, Label or Device**.
- Chọn Config Type: **Path**.
- **Container Path**: `/app/db` (BẮT BUỘC ĐÚNG)
- **Host Path**: `/mnt/user/appdata/tech-manager/db` (Trỏ đến thư mục bạn đã tạo ở bước 1)
- **Access Mode**: `Read/Write`
- Nhấn **SAVE**.

### Thêm Biến Môi Trường (Environment Variables)
- Nhấn **Add another Path, Port, Variable, Label or Device**.
- Chọn Config Type: **Variable**.
- **Key**: `DATABASE_URL`
- **Value**: `file:./db/prod.db`
- Nhấn **SAVE**.

*(Tùy chọn) Nếu muốn tắt chế độ Demo (để dùng thật):*
- Thêm Variable: Key=`NEXT_PUBLIC_DEMO_MODE`, Value=`false`.

---

## ▶️ 3. Khởi Chạy
1. Nhấn **APPLY** ở cuối trang.
2. Unraid sẽ tải image và khởi động container.
3. Chờ khoảng 15-30 giây để database khởi tạo.
4. Truy cập web tại: `http://<IP-Unraid>:<Port>` (Ví dụ: `http://192.168.1.10:3000`).

---

## 🔄 4. Cập Nhật Phiên Bản Mới

Khi có update mới từ mình (dev), bạn làm như sau:
1. Vào tab **Docker**.
2. Tìm `tech-gadget-manager`.
3. Bấm vào icon, chọn **Check for Updates**.
4. Nếu có update -> Bấm **Update**.

*Nếu Unraid không thấy update (do cache):*
1. Bấm vào icon -> Chọn **Advanced View** (góc trên phải nếu cần).
2. Chọn **Force Update**.

---

## ❓ Xử Lý Lỗi Thường Gặp

**1. Lỗi "Database is read-only" hoặc không lưu được dữ liệu**
- Kiểm tra lại phần **Host Path** ở bước 2. Đảm bảo thư mục trên Unraid có quyền ghi (User `nobody` hoặc quyền rộng `chmod 777`).

**2. Web trắng trang hoặc lỗi lạ sau khi update**
- Nhấn `Ctrl + Shift + R` trên trình duyệt để xóa cache cũ.
- Vào logs container xem có lỗi gì không (Bấm icon -> Logs).

**3. Vercel Build**
- Hiện tại mình đã tắt tự động build trên Vercel để tránh spam. Bạn cứ yên tâm dùng Docker nhé.

---
*Chúc bạn quản lý thiết bị vui vẻ!*
