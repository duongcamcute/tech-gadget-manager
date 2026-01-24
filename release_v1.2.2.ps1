# release_v1.2.2.ps1
Write-Host "🚧 Phát hành bản vá v1.2.2 (Fix Login HTTP)..." -ForegroundColor Cyan

# Git commands
git config user.name "duongcamcute"
git config user.email "duongcamcute@users.noreply.github.com"

git add .
git commit -m "Fix: Allow insecure cookies for HTTP self-hosting"
git tag v1.2.2
git push origin main --tags

Write-Host "✅ Đã đẩy v1.2.2 lên Github." -ForegroundColor Green
Write-Host "👉 Vui lòng đợi Github Action build xong image mới."
Write-Host "⚠️  Quan Trọng: Bạn cần cập nhật lại file docker-compose.yml trên Unraid (thêm dòng DISABLE_SECURE_COOKIES=true)."
