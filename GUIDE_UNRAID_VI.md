# Hướng dẫn Deploy trên Unraid (Docker)

Unraid quản lý Docker rất trực quan. Bạn có thể thêm ứng dụng này bằng tính năng "Add Container" truyền thống của Unraid.

## Bước 1: Chuẩn bị Image URL

Image của bạn được tự động build và lưu tại:
`ghcr.io/duongcamcute/tech-gadget-manager:latest`

*(Nếu repo là Private, bạn cần đăng nhập Docker trên Unraid Terminal trước, xem mục "Lưu ý cho Repo Private" ở cuối bài).*

## Bước 2: Thêm Container trên Unraid

1.  Vào tab **Docker**.
2.  Chọn **Add Container** (cuối trang).
3.  Điền các thông số sau:

### General Settings
-   **Name**: `Tech-Gadget-Manager` (hoặc tên tùy thích).
-   **Repository**: `ghcr.io/duongcamcute/tech-gadget-manager:latest`
-   **Network Type**: `Bridge`.
-   **Icon URL**: (Bỏ qua hoặc paste link icon nếu có).
-   **WebUI**: `http://[IP]:[PORT:3000]`

### Port Mappings (Thêm Port)
Bấm **Add another Path, Port, Variable, Label or Device** -> Chọn Config Type là **Port**.
-   **Name**: `Web Port`
-   **Container Port**: `3000` (Bắt buộc phải là 3000)
-   **Host Port**: `3000` (Hoặc số khác nếu cổng 3000 bị trùng).
-   **Connection Type**: `TCP`

### Path Mappings (Thêm Volume - Quan trọng để lưu dữ liệu)
Bấm **Add...** -> Chọn Config Type là **Path**.
-   **Name**: `Data`
-   **Container Path**: `/app/db` (Bắt buộc chính xác đường dẫn này)
-   **Host Path**: `/mnt/user/appdata/tech-gadget-manager` (Theo chuẩn Unraid, hoặc thư mục nào bạn muốn).
    *   *Mẹo: Bạn nên tạo trước thư mục này trên Unraid.*

### Environment Variables (Biến môi trường)
Bấm **Add...** -> Chọn Config Type là **Variable**.
-   **Name**: `Database URL`
-   **Key**: `DATABASE_URL`
-   **Value**: `file:/app/db/prod.db` (Giữ nguyên, không sửa)

Thêm một biến nữa:
-   **Name**: `Node Env`
-   **Key**: `NODE_ENV`
-   **Value**: `production`

### Hoàn tất
4.  Ấn **APPLY**. Unraid sẽ tải image về và chạy.

---

## Cách cập nhật phiên bản mới (Update) trên Unraid

Khi bạn push code mới lên GitHub, chờ GitHub Action chạy xong (xanh lá), bạn làm như sau trên Unraid:
1.  Vào tab **Docker**.
2.  Tìm container `Tech-Gadget-Manager`.
3.  Bấm vào icon -> Chọn **Check for updates** (nếu bạn cài plugin Docker Folder) hoặc chọn **Force Update** (để chắc chắn tải lại image mới nhất).
    *   *Lưu ý: Nếu Unraid báo "Up-to-date" mà bạn biết chắc có bản mới, hãy chọn "Force Update" (hoặc Edit -> Apply lại) để nó ép tải lại tag :latest.*

---

## Lưu ý cho Repository Private (Riêng tư)

Nếu repo GitHub của bạn là Private, Unraid sẽ không tự kéo image về được. Bạn cần làm bước này một lần duy nhất:

1.  Mở Terminal của Unraid (biểu tượng `>_` trên thanh menu).
2.  Gõ lệnh đăng nhập:
    ```bash
    docker login ghcr.io -u duongcamcute -p <YOUR_GITHUB_TOKEN>
    ```
    *(Token là cái bạn tạo trong phần Developer Settings trên GitHub, với quyền `read:packages`).*
3.  Sau khi báo `Login Succeeded`, bạn có thể Add Container như bình thường.
