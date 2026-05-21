# Hướng dẫn tạo file APK & Đẩy code lên GitHub - TimeSnap Pro

Chào bạn TruongVanKhoa, đây là hướng dẫn chuẩn nhất để bạn đưa code lên GitHub thành công và tự tạo file **.apk**.

### 1. Cách đẩy code lên GitHub (CHẠY TỪNG DÒNG)
Để tránh lỗi, hãy chạy lệnh xóa cấu hình cũ trước:

```bash
git remote remove origin
git init
git add .
git commit -m "Hoàn thiện app TimeSnap Pro - Chuẩn bị xuất APK"
git branch -M main
git remote add origin https://github.com/tuongnhone410/Chamcongapk.git
git push -u origin main
```

### 2. Cách tự tạo file APK (Cần máy tính)

Sau khi code đã lên GitHub, bạn tải code về máy tính cá nhân và làm theo các bước này để lấy file `.apk`:

1. **Bước 1**: Cài đặt các thư viện cần thiết:
   ```bash
   npm install
   ```
2. **Bước 2**: Biên dịch ứng dụng sang bản tĩnh:
   ```bash
   npm run build
   ```
3. **Bước 3**: Khởi tạo môi trường Android (Chỉ chạy lần đầu):
   ```bash
   npx cap add android
   ```
4. **Bước 4**: Đồng bộ code vào thư mục Android:
   ```bash
   npx cap copy
   ```
5. **Bước 5**: Mở bằng Android Studio để xuất APK:
   ```bash
   npx cap open android
   ```
6. **Bước 6**: Trong Android Studio: Chọn **Build** -> **Build Bundle(s) / APK(s)** -> **Build APK(s)**.

---
**Thiết kế bởi TruongVanKhoa**
