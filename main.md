# Hướng dẫn TimeSnap Pro - TruongVanKhoa

Chào bạn, đây là hướng dẫn để bạn quản lý dự án trên GitHub và tự tạo file cài đặt cho điện thoại.

### 1. Cách đẩy code lên GitHub (Để lưu trữ & chia sẻ)
Nếu bạn bị lỗi khi push, hãy chạy các lệnh sau **theo thứ tự từng dòng một**:

```bash
# Xóa cấu hình cũ bị lỗi
git remote remove origin

# Khởi tạo lại
git init
git add .
git commit -m "Hoàn thiện TimeSnap Pro - Sẵn sàng xuất APK"
git branch -M main

# Kết nối với kho của bạn
git remote add origin https://github.com/tuongnhone410/Chamcongapk.git

# Đẩy code lên (Lần này sẽ rất nhanh vì đã có .gitignore)
git push -u origin main
```

### 2. Tại sao trên GitHub không thấy file .apk?
GitHub chỉ lưu "bản thiết kế" (mã nguồn). File `.apk` là sản phẩm cuối cùng sau khi bạn "đóng gói" bản thiết kế đó.

### 3. Cách tạo file .apk từ code trên GitHub
Khi bạn (hoặc ai đó) muốn lấy file `.apk`, hãy làm như sau trên một máy tính có cài **Android Studio**:

1. **Tải code**: Tải thư mục code này từ GitHub về máy.
2. **Cài đặt**: Mở Terminal tại thư mục code và gõ:
   ```bash
   npm install
   npm run build
   ```
3. **Đóng gói Android**:
   ```bash
   npx cap add android
   npx cap copy
   npx cap open android
   ```
4. **Xuất APK**: Khi Android Studio mở lên, chọn menu **Build** -> **Build Bundle(s) / APK(s)** -> **Build APK(s)**. Bạn sẽ nhận được file `.apk` để cài vào điện thoại.

---
**Thiết kế bởi TruongVanKhoa**
