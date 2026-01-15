# Hướng dẫn Deploy & Backup (Dành cho người mới bắt đầu)

Tài liệu này sẽ hướng dẫn bạn cách lưu trữ mã nguồn lên GitHub và chạy ứng dụng bằng Docker trên NAS/Server.

---

## Phần 1: Lưu trữ mã nguồn lên GitHub

Bạn chưa cài Git hoặc chưa định cấu hình, hãy làm theo các bước sau:

### 1. Cài đặt Git (nếu chưa có)
- Tải và cài đặt [Git for Windows](https://git-scm.com/download/win).
- Khi cài đặt, cứ để mặc định (Next > Next) là được.

### 2. Tạo Repository trên GitHub
1. Đăng nhập [GitHub](https://github.com).
2. Bấm dấu **+** ở góc phải trên cùng -> **New repository**.
3. Đặt tên (ví dụ: `tech-gadget-manager`).
4. Chọn **Private** (nếu muốn bảo mật) hoặc **Public**.
5. Bấm **Create repository**.

### 3. Đẩy code lên GitHub
Mở Terminal (hoặc CMD/PowerShell) tại thư mục dự án (`tech-gadget-manager`) và chạy lần lượt các lệnh sau:

```bash
# 1. Khởi tạo Git
git init

# 2. Thêm tất cả file vào Git
git add .

# 3. Lưu mốc lịch sử đầu tiên
git commit -m "First commit: Done project"

# 4. Đổi tên nhánh chính thành main
git branch -M main

# 5. Liên kết với GitHub (Thay YOUR_NAME và REPO_LINK bằng link bạn vừa tạo)
# Ví dụ: git remote add origin https://github.com/duong/tech-gadget-manager.git
git remote add origin <LINK_GITHUB_CUA_BAN>

# 6. Đẩy code lên (Sẽ yêu cầu đăng nhập)
git push -u origin main
```

---

## Phần 2: Chạy ứng dụng bằng Docker (trên NAS/Server)

Mình đã tạo sẵn 3 file quan trọng cho bạn:
1. `Dockerfile`: Công thức đóng gói ứng dụng.
2. `docker-compose.yml`: File cấu hình để chạy ứng dụng dễ dàng.
3. `docker-entrypoint.sh`: Script tự động khởi tạo database khi chạy.

### Cấu trúc thư mục trên NAS
Bạn chỉ cần copy toàn bộ thư mục code này lên NAS, hoặc dùng git clone về NAS.
Cấu trúc sẽ như thế này:
```
tech-gadget-manager/
├── docker-compose.yml
├── Dockerfile
├── docker-entrypoint.sh
├── src/
├── public/
├── prisma/
├── package.json
└── ... các file khác
```

### Cách chạy (Lần đầu & Sau này)

1. **Mở Terminal/SSH vào thư mục dự án trên NAS**.
2. **Chạy lệnh sau để khởi động**:

```bash
docker-compose up -d --build
```

- `up`: Dựng container.
- `-d`: Chạy ngầm (detach), không chiếm màn hình console.
- `--build`: Bắt buộc xây dựng lại image từ code (quan trọng khi mới copy code mới).

### Dữ liệu được lưu ở đâu?
- Database sẽ được lưu tại thư mục `data` nằm ngay trong thư mục dự án (`./data/prod.db`).
- Nhờ cấu hình trong `docker-compose.yml`, dù bạn có xóa container hay update image, file `prod.db` trong thư mục `data` vẫn còn nguyên. Tuyệt đối **không xóa thư mục data** này.

### Cách update khi có code mới (Quy trình chuẩn)

1. Code sửa xong ở máy tính -> Đẩy lên GitHub (`git push`).
2. Trên NAS -> Kéo code về (`git pull`).
3. Chạy lại lệnh docker compose để build lại image mới:
   ```bash
   docker-compose up -d --build
   ```
   *Docker sẽ tự thay thế container cũ bằng cái mới, dữ liệu DB vẫn giữ nguyên.*

---

## Lưu ý quan trọng
- **Database**: Ứng dụng dùng SQLite file (`prod.db`). File này nằm ở folder `data` trên NAS. Bạn có thể copy file này ra chỗ khác để backup thủ công nếu muốn.
- **Port**: Ứng dụng chạy ở port `3000`. Truy cập: `http://<IP-NAS>:3000`.
