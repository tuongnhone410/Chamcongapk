# Hướng dẫn TimeSnap Pro - TruongVanKhoa

Chào bạn, đây là hướng dẫn để bạn quản lý dự án trên GitHub và lấy file cài đặt APK tự động.

### 1. Cách đẩy code lên GitHub (Kích hoạt tạo APK tự động)
Bạn hãy mở Terminal và chạy **từng dòng một** các lệnh dưới đây. Nếu có lỗi, hãy chạy lệnh xóa cấu hình cũ trước.

```bash
# Lệnh xóa cấu hình cũ (Chỉ chạy nếu bị lỗi remote origin exists)
git remote remove origin 

# Bộ lệnh chuẩn để đẩy code
git init
git add .
git commit -m "Hoàn thiện TimeSnap Pro - Kích hoạt tự động tạo APK"
git branch -M main
git remote add origin https://github.com/tuongnhone410/Chamcongapk.git
git push -u origin main
```

### 2. Cách lấy file .apk trực tiếp từ GitHub (Sau khi push xong)
Sau khi bạn chạy lệnh `git push` thành công, GitHub sẽ tự động "nấu" file APK cho bạn. Hãy làm như sau:

1. Vào trang Repository của bạn trên GitHub (ví dụ: `github.com/tuongnhone410/Chamcongapk`).
2. Nhấn vào tab **"Actions"** (Nằm ở hàng trên cùng, cạnh tab Code, Issues).
3. Bạn sẽ thấy một tiến trình đang chạy có tên **"Build Android APK"**. Hãy đợi khoảng 3-5 phút cho đến khi nó hiện dấu tích xanh ✅.
4. Nhấn vào tên của tiến trình đó (ví dụ: "Hoàn thiện TimeSnap Pro...").
5. Kéo xuống dưới cùng đến phần **Artifacts**, bạn sẽ thấy file **"TimeSnapPro-Debug-APK"**.
6. Nhấn vào đó để tải về máy. Giải nén file .zip ra bạn sẽ có file `.apk` để cài vào điện thoại.

---
**Thiết kế bởi TruongVanKhoa**
