#!/bin/sh
# Dừng script nếu có lỗi
set -e

# Chạy migration database (tạo bảng nếu chưa có)
echo "Running database migrations..."
prisma migrate deploy

# Chạy ứng dụng Next.js
echo "Starting Next.js application..."
exec node server.js
