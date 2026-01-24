# release_v1.2.1.ps1
Write-Host "🛠️  Bắt đầu phát hành bản vá v1.2.1 (Fix CI)..." -ForegroundColor Cyan

# Cấu hình Git user (đề phòng chưa có)
git config user.name "duongcamcute"
git config user.email "duongcamcute@users.noreply.github.com"

# Git commands sequence
git add .
git commit -m "Fix: Configure Docker Buildx for Github Actions"
git tag v1.2.1
git push origin main --tags

Write-Host "✅ Đã đẩy v1.2.1 lên Github." -ForegroundColor Green
Write-Host "👉 Github Actions sẽ chạy lại ngay bây giờ. Vui lòng kiểm tra tab Actions."
