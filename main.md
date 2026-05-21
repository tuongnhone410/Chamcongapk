# Hướng dẫn TimeSnap Pro - TruongVanKhoa

Chào bạn, đây là hướng dẫn để bạn khắc phục lỗi và đẩy code lên GitHub thành công để kích hoạt chế độ tự động tạo file APK.

### 1. Cách sửa lỗi "Authentication failed" hoặc "Repository not found"
GitHub hiện tại **không cho phép** nhập mật khẩu cá nhân vào Terminal. Bạn phải dùng **Token** để thay thế.

**Bước A: Lấy Token trên GitHub**
1. Vào GitHub của bạn -> Chọn ảnh đại diện (góc trên cùng bên phải) -> **Settings**.
2. Kéo xuống dưới cùng bên trái chọn **Developer settings**.
3. Chọn **Personal access tokens** -> **Tokens (classic)**.
4. Nhấn **Generate new token (classic)**.
5. Phần **Note** ghi "APK Build", phần **Expiration** chọn "No expiration", phần **Select scopes** tích chọn ô **repo**.
6. Nhấn **Generate token** và **COPY LẠI DÒNG MÃ ĐÓ** (nó có dạng `ghp_...`). Lưu ý: Bạn chỉ thấy nó một lần duy nhất.

**Bước B: Đẩy code lại bằng Token**
Mở Terminal và chạy các lệnh này:

```bash
# Xóa cấu hình cũ bị lỗi
git remote remove origin 

# Thêm lại cấu hình mới (Thay <TOKEN> bằng dòng ghp_... bạn vừa copy)
# Cấu trúc: https://<TOKEN>@github.com/tuongnhone410/Chamcongapk.git
git remote add origin https://ghp_Dán_Token_Của_Bạn_Vào_Đây@github.com/tuongnhone410/Chamcongapk.git

# Đẩy code lên
git add .
git commit -m "Fix auth and trigger APK build"
git branch -M main
git push -u origin main
```

### 2. Cách lấy file .apk sau khi push thành công
Sau khi lệnh `git push` chạy xong mà không báo lỗi:

1. Vào trang GitHub của bạn: `github.com/tuongnhone410/Chamcongapk`.
2. Nhấn vào tab **"Actions"**.
3. Bạn sẽ thấy tiến trình **"Build Android APK"** đang chạy (màu vàng). Đợi khoảng 3-5 phút cho đến khi hiện dấu tích xanh ✅.
4. Nhấn vào tên tiến trình đó -> Kéo xuống phần **Artifacts**.
5. Tải file **"TimeSnapPro-Debug-APK"** về máy. Giải nén ra bạn sẽ có file `.apk` để cài vào điện thoại.

---
**Thiết kế bởi TruongVanKhoa**