# Hướng dẫn Triển khai Docker - Tech Gadget Manager

Tài liệu này giúp bạn triển khai ứng dụng bằng Docker một cách an toàn, tránh các lỗi phổ biến về dữ liệu.

---

## Yêu cầu

- Docker và Docker Compose đã được cài đặt
- Khoảng 500MB dung lượng đĩa

---

## Triển khai Nhanh

### 1. Tải docker-compose.yml

```bash
mkdir tech-gadget-manager && cd tech-gadget-manager
curl -O https://raw.githubusercontent.com/duongcamcute/tech-gadget-manager/main/docker-compose.yml
```

### 2. Tạo thư mục dữ liệu

```bash
mkdir -p db uploads
```

### 3. Khởi chạy

```bash
docker compose up -d
```

### 4. Truy cập

Mở trình duyệt: `http://localhost:3000`

**Tài khoản mặc định**: `admin` / `admin`

---

## Cấu hình Quan trọng

### ⚠️ DATABASE_URL (BẮT BUỘC)

`DATABASE_URL` là biến môi trường **BẮT BUỘC** cho Docker. Nếu thiếu, ứng dụng sẽ báo lỗi.

```yaml
environment:
  - DATABASE_URL=file:/app/db/prod.db  # ✅ BẮT BUỘC
```

### Volumes (Lưu trữ dữ liệu)

```yaml
volumes:
  - ./db:/app/db          # Database SQLite
  - ./uploads:/app/public/uploads  # Ảnh upload
```

> **Lưu ý**: Thư mục `./db` trên máy host sẽ chứa database. KHÔNG XÓA thư mục này.

---

## Cập nhật Phiên bản Mới

### Bước 1: Backup dữ liệu (QUAN TRỌNG!)

```bash
cp -r ./db ./db_backup_$(date +%Y%m%d)
```

### Bước 2: Kéo image mới

```bash
docker compose pull
```

### Bước 3: Khởi động lại

```bash
docker compose up -d
```

> **Dữ liệu sẽ được giữ nguyên** vì được lưu trong thư mục `./db` trên máy host.

---

## Khắc phục Sự cố

### Lỗi: "DATABASE_URL is required in production"

**Nguyên nhân**: Thiếu biến `DATABASE_URL` trong docker-compose.yml

**Giải pháp**: Thêm dòng sau vào phần `environment`:
```yaml
- DATABASE_URL=file:/app/db/prod.db
```

### Lỗi: Dữ liệu bị mất sau khi update

**Nguyên nhân có thể**:
1. Chưa map volume `./db:/app/db`
2. Xóa thư mục `./db` trước khi update

**Cách phòng tránh**:
- Luôn backup trước khi update
- KHÔNG xóa thư mục `./db`

### Lỗi: Permission denied trên database

```bash
sudo chown -R 1001:1001 ./db
```

---

## Cấu hình Nâng cao

### Thay đổi JWT Secret (Khuyến nghị)

```yaml
- JWT_SECRET=thay_bang_chuoi_ngau_nhien_dai_32_ky_tu
```

### Bật HTTPS (Reverse Proxy)

Nếu dùng với Nginx/Traefik có SSL:
```yaml
- DISABLE_SECURE_COOKIES=false
```

### Demo Mode

```yaml
- NEXT_PUBLIC_DEMO_MODE=true  # Chặn thao tác ghi dữ liệu
```

---

## Backup & Restore

### Backup thủ công

```bash
# Backup database
cp ./db/prod.db ./backup_$(date +%Y%m%d).db

# Hoặc dùng tính năng Export trong app (Settings > Hệ thống > Xuất dữ liệu)
```

### Restore

```bash
# Dừng container
docker compose down

# Thay thế database
cp ./backup_20260125.db ./db/prod.db

# Khởi động lại
docker compose up -d
```

---

## Thông tin Kỹ thuật

| Thành phần | Chi tiết |
|------------|----------|
| Base Image | `node:20-alpine` |
| Database | SQLite (file-based) |
| Port | 3000 |
| User trong container | `nextjs` (UID 1001) |

---

## Hỗ trợ

- GitHub Issues: [Link to repo]
- Telegram: @your_handle

---

*Cập nhật: 25/01/2026*
