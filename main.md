
# Hướng dẫn tạo file APK & Đẩy code lên GitHub - TimeSnap Pro

Chào bạn TruongVanKhoa, đây là hướng dẫn để bạn tự tay tạo ra file **.apk** từ mã nguồn này.

### 1. Cách đẩy code lên GitHub (Chạy từng dòng)
Nếu gặp lỗi, hãy chạy lệnh này trước: `git remote remove origin`

```bash
git init
git add .
git commit -m "Hoàn thiện app TimeSnap Pro - Sẵn sàng tạo APK"
git branch -M main
git remote add origin https://github.com/tuongnhone410/Chamcongapk.git
git push -u origin main
```

### 2. Cách tự tạo file APK (Cần máy tính có cài Android Studio)

Vì tôi là AI nên không thể xuất file trực tiếp, nhưng tôi đã cấu hình sẵn để bạn làm việc này cực nhanh:

1. **Bước 1**: Tải mã nguồn này về máy tính của bạn.
2. **Bước 2**: Mở Terminal tại thư mục dự án và chạy các lệnh:
   ```bash
   npm install
   npm run build
   npx cap add android
   npx cap copy
   npx cap open android
   ```
3. **Bước 3**: Sau lệnh cuối, **Android Studio** sẽ tự động mở lên.
4. **Bước 4**: Trong Android Studio, chọn menu **Build** -> **Build Bundle(s) / APK(s)** -> **Build APK(s)**.
5. **Bước 5**: Chờ một lát, Android Studio sẽ hiện thông báo "APK(s) generated successfully". Bạn nhấn **Locate** để lấy file `.apk` cài vào điện thoại!

---
**Thiết kế bởi TruongVanKhoa**
