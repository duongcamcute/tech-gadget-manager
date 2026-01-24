# release_v1.2.0.ps1
Write-Host "🚧 Bắt đầu quy trình phát hành v1.2.0..." -ForegroundColor Cyan

# 1. Kiểm tra trạng thái Git
git status

# 2. Add tất cả thay đổi
Write-Host "📦 Đang đóng gói thay đổi..." -ForegroundColor Yellow
git add .

# 3. Commit
Write-Host "📝 Đang tạo commit release..." -ForegroundColor Yellow
git commit -m "Release v1.2.0: Add Unsorted Stats, Security Fixes & Docker CI/CD"

# 4. Tạo Tag
Write-Host "🏷️  Đang gắn thẻ v1.2.0..." -ForegroundColor Yellow
git tag v1.2.0

# 5. Push lên Github
Write-Host "🚀 Đang đẩy code và tags lên Github..." -ForegroundColor Green
git push origin main --tags

Write-Host "✅ Hoàn tất! Github Actions sẽ tự động build Docker Image." -ForegroundColor Green
Write-Host "👉 Kiểm tra tiến độ tại: https://github.com/$(git config --get remote.origin.url | Split-Path -Leaf | ForEach-Object { $_ -replace '\.git$','' })/actions"
