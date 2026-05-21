# Hướng dẫn TimeSnap Pro - TruongVanKhoa

Chào bạn, đây là hướng dẫn để bạn quản lý dự án trên GitHub và lấy file cài đặt APK tự động.

### 1. Cách đẩy code lên GitHub (Để lưu trữ & Tự động tạo APK)
Nếu bạn bị lỗi khi push, hãy chạy các lệnh sau **theo thứ tự từng dòng một**:

```bash
# Xóa cấu hình cũ bị lỗi (nếu có)
git remote remove origin

# Khởi tạo lại
git init
git add .
git commit -m "Hoàn thiện TimeSnap Pro - Kích hoạt tự động tạo APK"
git branch -M main

# Kết nối với kho của bạn (Thay link bằng link kho của bạn)
git remote add origin https://github.com/tuongnhone410/Chamcongapk.git

# Đẩy code lên
git push -u origin main
```

### 2. Cách lấy file .apk trực tiếp từ GitHub
Sau khi bạn chạy lệnh `git push` thành công, GitHub sẽ tự động "nấu" file APK cho bạn. Hãy làm như sau:

1. Vào trang Repository của bạn trên GitHub (ví dụ: `github.com/tuongnhone410/Chamcongapk`).
2. Nhấn vào tab **"Actions"** ở phía trên.
3. Bạn sẽ thấy một tiến trình đang chạy tên là **"Build Android APK"**. Hãy đợi khoảng 3-5 phút cho đến khi nó hiện dấu tích xanh ✅.
4. Nhấn vào tên lần chạy đó (ví dụ: "Hoàn thiện TimeSnap Pro...").
5. Kéo xuống dưới cùng phần **Artifacts**, bạn sẽ thấy file **"TimeSnapPro-Debug-APK"**.
6. Nhấn vào đó để tải về máy. Giải nén file zip ra bạn sẽ có file `.apk` để cài vào điện thoại.

---
**Thiết kế bởi TruongVanKhoa**
