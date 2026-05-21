# Hướng dẫn đẩy code lên GitHub & Cài đặt - TimeSnap Pro

Lưu ý: GitHub chỉ dùng để lưu mã nguồn. Để có app trên điện thoại, bạn dùng tính năng **PWA**, không dùng file **.apk**.

### 1. Cách đẩy code lên GitHub (Chạy từng dòng)
Nếu gặp lỗi, hãy chạy lệnh này trước: `git remote remove origin`

```bash
git init
git add .
git commit -m "Hoàn thiện app TimeSnap Pro"
git branch -M main
git remote add origin https://github.com/tuongnhone410/Chamcongapk.git
git push -u origin main
```

### 2. Cách "Tải" app về máy (Không cần APK)
Vì đây là Web App chuyên nghiệp, bạn không cần file cài đặt .apk:

1. **Trên Android**: 
   - Mở link trang web ứng dụng của bạn bằng trình duyệt Chrome.
   - Nhấn vào dấu **3 chấm** ở góc trên bên phải.
   - Chọn **"Cài đặt ứng dụng"** hoặc **"Thêm vào màn hình chính"**.
2. **Trên iPhone**:
   - Mở link bằng trình duyệt Safari.
   - Nhấn nút **Chia sẻ** (ô vuông có mũi tên lên).
   - Chọn **"Thêm vào màn hình chính"**.

Biểu tượng app sẽ xuất hiện ngay trên màn hình điện thoại của bạn!

---
**Thiết kế bởi TruongVanKhoa**