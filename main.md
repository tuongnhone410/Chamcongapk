# Hướng dẫn TimeSnap Pro - TruongVanKhoa

Chào bạn, lỗi bạn vừa gặp là do Token thiếu quyền **workflow**. Hãy làm theo các bước cập nhật dưới đây để sửa lỗi và đẩy code lên thành công.

### 1. Cách sửa lỗi "Refusing to allow... without 'workflow' scope"

**Bước A: Lấy Token MỚI trên GitHub (Có đủ quyền)**
1. Vào GitHub của bạn -> Chọn ảnh đại diện (góc trên cùng bên phải) -> **Settings**.
2. Kéo xuống dưới cùng bên trái chọn **Developer settings**.
3. Chọn **Personal access tokens** -> **Tokens (classic)**.
4. Nhấn **Generate new token (classic)**.
5. Phần **Note** ghi "APK Build Workflow".
6. Phần **Expiration** chọn "No expiration".
7. **PHẦN QUAN TRỌNG NHẤT:** Trong mục **Select scopes**, bạn phải tích chọn **CẢ 2 Ô** sau:
   - [x] **repo** (Full control of private repositories)
   - [x] **workflow** (Update GitHub Action workflows)
8. Nhấn **Generate token** và **COPY LẠI DÒNG MÃ MỚI** (ghp_...).

**Bước B: Đẩy code lại bằng Token MỚI**
Mở Terminal và chạy các lệnh này **từng dòng một** (Thay `<TOKEN_MỚI>` bằng dòng ghp_ bạn vừa copy):

```bash
# 1. Xóa cấu hình cũ bị lỗi
git remote remove origin 

# 2. Thêm lại cấu hình với Token có đủ quyền
# Thay <TOKEN_MỚI> bằng mã ghp_ của bạn vào chỗ giữa // và @
git remote add origin https://<TOKEN_MỚI>@github.com/tuongnhone410/Chamcongapk.git

# 3. Gom code và đẩy lên
git add .
git commit -m "Fix: Add workflow permission for APK build"
git branch -M main
git push -u origin main
```

### 2. Cách lấy file .apk sau khi push thành công
Sau khi lệnh `git push` báo thành công:

1. Vào trang GitHub của bạn: `github.com/tuongnhone410/Chamcongapk`.
2. Nhấn vào tab **"Actions"** (ở thanh menu phía trên).
3. Bạn sẽ thấy tiến trình **"Build Android APK"** đang chạy (màu vàng).
4. Đợi khoảng 3-5 phút cho đến khi hiện dấu tích xanh ✅.
5. Nhấn vào tên tiến trình đó -> Kéo xuống phần **Artifacts**.
6. Tải file **"TimeSnapPro-Debug-APK"** về máy. Giải nén ra bạn sẽ có file `.apk` để cài vào điện thoại.

---
**Thiết kế bởi TruongVanKhoa**