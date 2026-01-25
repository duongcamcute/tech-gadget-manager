# Hướng dẫn Kiểm tra Vị trí Database trong Docker

Bạn làm theo các bước sau để tìm chính xác file database đang nằm ở đâu và tại sao nó không hiện ra ngoài:

## Bước 1: Truy cập Console của Container
1. Trên giao diện Unraid, bấm vào icon của container **tech-gadget-manager**.
2. Chọn **Console**. (Cửa sổ dòng lệnh đen sẽ hiện ra).

## Bước 2: Kiểm tra file trong Container
Gõ lần lượt các lệnh sau và quan sát kết quả:

1. **Kiểm tra thư mục /app/db (Nơi chúng ta nghĩ là DB ở đó):**
   ```bash
   ls -la /app/db
   ```
   -> Nếu thấy file `prod.db`, nghĩa là DB nằm đúng chỗ. Vấn đề là Volume Mapping chưa ăn.

2. **Kiểm tra thư mục hiện tại của ứng dụng:**
   ```bash
   pwd
   ls -la db/
   ```
   -> Để chắc chắn DB không nằm ở một đường dẫn tương đối khác.

3. **Kiểm tra biến môi trường thực tế đang chạy:**
   ```bash
   env | grep DATABASE_URL
   ```
   -> Xem giá trị `DATABASE_URL` thực sự là gì. Nếu nó là `file:./dev.db` (mặc định) thay vì `file:/app/db/prod.db`, thì đây là nguyên nhân! (Nó đang lưu vào file `dev.db` ở thư mục gốc `/app/dev.db` chứ không phải trong folder `db`).

## Bước 3: Kiểm tra Quyền Ghi (Permissions)
Gõ lệnh:
```bash
ls -ld /app/db
```
Xem owner là `nextjs` hay `root`.

---
**Hãy chụp ảnh màn hình kết quả các lệnh trên gửi cho tôi.**
Tôi nghi ngờ biến `DATABASE_URL` có thể chưa được nhận đúng, khiến App dùng file mặc định (`dev.db`) thay vì file trong volume.
