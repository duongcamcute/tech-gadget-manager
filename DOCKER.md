# 🐳 Docker Deployment Guide

> **Hướng dẫn triển khai Tech Gadget Manager trên Docker / Unraid / NAS**

---

## ⚠️ CẢNH BÁO QUAN TRỌNG

### Data Loss với `--accept-data-loss`

File `docker-entrypoint.sh` sử dụng:
```bash
npx prisma db push --accept-data-loss --skip-generate
```

**Điều này có nghĩa:**
- Mỗi khi schema Prisma thay đổi (thêm/xóa field, đổi type), Prisma **CÓ THỂ XÓA DỮ LIỆU**
- User, Items, Locations **SẼ BỊ MẤT** nếu schema không tương thích

### 🛡️ BACKUP TRƯỚC KHI UPDATE

```bash
# Trên Unraid/NAS, backup file database trước khi update:
cp ./db/prod.db ./db/prod.db.backup.$(date +%Y%m%d)
```

---

## 📦 Cấu Trúc Files

```
├── Dockerfile              # Multi-stage build
├── docker-compose.yml      # Compose config cho Unraid
├── docker-entrypoint.sh    # Startup script (migration + start)
└── src/lib/db.ts           # Database connection logic
```

---

## 🔧 Cách Hoạt Động

### 1. Database Connection (`src/lib/db.ts`)

```typescript
// PRIORITY 1: Use DATABASE_URL from environment (Docker)
if (process.env.DATABASE_URL) {
    return new PrismaClient();  // Uses env var directly
}

// PRIORITY 2: Vercel /tmp strategy (Read-only filesystem)
// Copy dev.db to /tmp

// PRIORITY 3: Development mode
```

**Quan trọng:** Khi `DATABASE_URL` được set (trong docker-compose.yml), Prisma sẽ dùng path đó trực tiếp.

### 2. Docker Compose (`docker-compose.yml`)

```yaml
services:
  app:
    image: ghcr.io/duongcamcute/tech-gadget-manager:latest
    environment:
      - DATABASE_URL=file:/app/db/prod.db  # ← Path TRONG container
      - NODE_ENV=production
      - DISABLE_SECURE_COOKIES=true        # ← Cho HTTP (không có SSL)
      - JWT_SECRET=your_secret_here         # ← ĐỔI THÀNH RANDOM STRING
    volumes:
      - ./db:/app/db          # ← Data persist qua restart/update
      - ./uploads:/app/public/uploads
```

### 3. Entrypoint (`docker-entrypoint.sh`)

1. Fix permissions cho `/app/db` volume
2. Chạy `prisma db push` để sync schema
3. Start `node server.js`

---

## 🚀 Triển Khai

### Option 1: Docker Run (Đơn giản)

```bash
docker run -d \
  --name tech-gadget-manager \
  --restart unless-stopped \
  -p 3000:3000 \
  -v $(pwd)/db:/app/db \
  -e DATABASE_URL="file:/app/db/prod.db" \
  -e JWT_SECRET="change_this_to_random_string" \
  -e DISABLE_SECURE_COOKIES=true \
  ghcr.io/duongcamcute/tech-gadget-manager:latest
```

### Option 2: Docker Compose (Khuyến nghị)

```bash
# Clone hoặc tạo docker-compose.yml
wget https://raw.githubusercontent.com/duongcamcute/tech-gadget-manager/main/docker-compose.yml

# Khởi chạy
docker-compose up -d

# Xem logs
docker-compose logs -f
```

### Option 3: Unraid Community Applications

1. Tìm "Tech Gadget Manager" trong Community Apps
2. Cấu hình paths và variables
3. Apply

---

## 🔄 Update Container

```bash
# 1. BACKUP DATABASE TRƯỚC
cp ./db/prod.db ./db/prod.db.backup

# 2. Pull image mới
docker-compose pull

# 3. Restart container
docker-compose down && docker-compose up -d
```

---

## 🐛 Troubleshooting

### Container crash loop
```bash
docker logs tech-gadget-manager
```
Thường do:
- Permission denied trên `/app/db` → Kiểm tra ownership
- Schema conflict → Xóa file `prod.db` và tạo lại (mất data!)

### Database file bị lock
```bash
# Trong container
rm /app/db/prod.db-journal /app/db/prod.db-wal /app/db/prod.db-shm
```

### Permission denied
```bash
# Trên host
sudo chown -R 1001:1001 ./db
```

---

## 📁 Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `DATABASE_URL` | ✅ Yes | - | Path to SQLite file (`file:/app/db/prod.db`) |
| `NODE_ENV` | No | production | Environment mode |
| `JWT_SECRET` | ⚠️ Recommended | hardcoded | Secret for JWT tokens |
| `DISABLE_SECURE_COOKIES` | For HTTP | false | Set `true` if not using HTTPS |
| `NEXT_PUBLIC_DEMO_MODE` | No | false | Enable read-only demo mode |

---

## 👨‍💻 Dành Cho Agent/Developer

Khi thay đổi schema Prisma (`prisma/schema.prisma`):

1. **Thêm field mới (nullable):** An toàn, không mất data
2. **Thêm field mới (required):** Cần `@default()` hoặc sẽ fail
3. **Xóa field/table:** `--accept-data-loss` sẽ xóa data!
4. **Đổi type field:** Có thể mất data

**Best practice:** Luôn test schema change trên dev DB trước khi push lên production.

---

*Last updated: 2026-01-25*
