# TimeSnap Pro - Hệ thống Chấm công & Quản lý Lương Cá nhân

TimeSnap Pro là ứng dụng web hiện đại giúp người lao động theo dõi giờ làm việc và tính toán lương tăng ca (OT) chính xác, được tối ưu hóa cho trải nghiệm di động (PWA & APK).

## 🚀 Tính năng chính
- **Chấm công thông minh**: Tự động nhận diện Ngày Lễ (3.0), Chủ Nhật (2.0) và Ngày thường (1.0).
- **Tính lương OT tự động**: Tự động tính hệ số 1.5 cho giờ làm thêm sau 8 tiếng.
- **Quản lý lương chi tiết**: Cấu hình lương cơ bản, bảo hiểm, công đoàn và hơn 10 loại phụ cấp khác nhau.
- **Biểu đồ trực quan**: Theo dõi giờ làm việc trong 7 ngày gần nhất với chú giải rõ ràng.
- **Bảo mật đa người dùng**: Dữ liệu được lưu trữ riêng biệt theo tài khoản (`user.uid`), an toàn khi dùng chung thiết bị.
- **Giao diện Pro**: Đã ẩn thanh cuộn, tối ưu vùng an toàn (Safe Area) cho điện thoại, không chồng chữ hay tràn khung.

## 📤 Cách cập nhật Code lên GitHub
Để lưu các thay đổi mới nhất và kích hoạt quy trình tự động build APK, hãy chạy các lệnh sau trong **Terminal**:

```bash
# 1. Gom tất cả các thay đổi
git add .

# 2. Tạo ghi chú cho phiên bản này
git commit -m "Update: Hoàn thiện giao diện Pro và sửa lỗi cuộn trên APK"

# 3. Đẩy code lên GitHub
git push origin main
```

*Lưu ý: Nếu bị báo lỗi quyền (Permission denied), hãy mở file `main.md` để xem cách cập nhật Token mới.*

## 🤖 Cách lấy file .apk (Tự động)
Sau khi bạn chạy lệnh `git push` thành công:
1. Truy cập vào kho mã nguồn (Repository) của bạn trên GitHub.
2. Chọn Tab **"Actions"**.
3. Bạn sẽ thấy tiến trình **"Build Android APK"** đang chạy.
4. Chờ 3-5 phút đến khi hiện tích xanh ✅, nhấn vào tên tiến trình đó, kéo xuống mục **Artifacts** để tải file.

## 📱 Cài đặt PWA (Khuyên dùng)
1. Truy cập link website trên Chrome (Android) hoặc Safari (iOS).
2. Chọn **"Thêm vào màn hình chính" (Add to Home Screen)**.
3. Ứng dụng sẽ hoạt động mượt mà như app cài đặt từ Store mà không cần file .apk.

---
**Thiết kế & Phát triển bởi TruongVanKhoa**
