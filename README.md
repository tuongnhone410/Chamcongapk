
# ⏱️ TimeSnap Pro - Hệ thống Quản lý Chấm công & Lương Cá nhân chuyên nghiệp

**TimeSnap Pro** là giải pháp di động toàn diện dành cho người lao động, giúp theo dõi giờ công, tính toán lương tăng ca (OT) và quản lý thu nhập hàng tháng một cách minh bạch, chính xác tuyệt đối.

## ✨ Tính năng nổi bật

### 1. Chấm công thông minh & Linh hoạt
- **Vào ca/Ra ca một chạm**: Giao diện đồng hồ số hiện đại, trực quan.
- **Tự động nhận diện hệ số**: Hệ thống tự động phân biệt Ngày Thường (1.0), Chủ Nhật (2.0) và Ngày Lễ (3.0) theo lịch Việt Nam.
- **Chấm công bù (Manual Entry)**: Cho phép thêm ngày công thủ công cho quá khứ hoặc hiện tại. 
- **Chế độ "Quên giờ ra"**: Khi thêm ngày công mới, bạn có thể để trống giờ ra. Hệ thống sẽ lập tức nhận diện bạn đang trong ca làm việc để bạn có thể bấm "RA CA" ngay tại Trang chủ.

### 2. Công cụ đồng bộ mạnh mẽ
- **Đồng bộ hàng loạt (Batch Sync)**: Thiết lập giờ công cho một dải ngày dài (ví dụ từ ngày 2 đến ngày 22) chỉ với một thao tác. Tự động bỏ qua Chủ Nhật nếu cần.
- **Chọn ngày OT đa điểm**: Chọn nhiều ngày cụ thể trên lịch để thêm giờ làm thêm cùng lúc.

### 3. Phân tích Lương chuyên sâu
- **Bảng lương chi tiết (Gross to Net)**: Tính toán từ lương cơ bản, lương OT, tiền cơm, chuyên cần đến các khoản khấu trừ bảo hiểm (10.5%), đoàn phí.
- **Quản lý hơn 12 loại phụ cấp**: 
    - Phụ cấp cố định: Nhà ở, Xăng xe, Độc hại, Điện thoại...
    - Phụ cấp theo hiệu suất: Kỹ thuật, Trách nhiệm, Chức vụ, Sản phẩm...
    - Khấu trừ thông minh: Tự động trừ tiền chuyên cần và phụ cấp theo số ngày nghỉ không phép.
- **Biểu đồ trực quan**: Theo dõi biến động giờ làm việc trong 7 ngày gần nhất.

### 4. Công nghệ & Bảo mật
- **Firebase Cloud**: Dữ liệu lưu trữ vĩnh viễn trên server Google, không mất dữ liệu khi F5 hoặc đổi thiết bị.
- **Bảo mật đa người dùng**: Dữ liệu riêng biệt hoàn toàn theo UID tài khoản.
- **Mobile First**: Giao diện tối ưu hoàn hảo cho điện thoại (PWA & APK), đã xử lý vùng an toàn (Safe Area), không chồng chữ, không lỗi bố cục.

## 🚀 Hướng dẫn vận hành

### Cách cập nhật Code lên GitHub (Push)
Để lưu lại các thay đổi và kích hoạt quy trình tự động build file APK, hãy chạy các lệnh sau trong **Terminal**:

```bash
# 1. Gom tất cả các thay đổi
git add .

# 2. Tạo ghi chú cho phiên bản này
git commit -m "Update: Tối ưu logic đồng bộ và cập nhật tài liệu"

# 3. Đẩy code lên GitHub
git push origin main
```

### Cách lấy file .apk cài đặt
1. Truy cập vào Repository của bạn trên GitHub.
2. Chọn Tab **"Actions"**.
3. Nhấn vào tiến trình **"Build Android APK"** (thường mất 3-5 phút).
4. Khi hiện tích xanh ✅, nhấn vào đó, kéo xuống mục **Artifacts** để tải file **TimeSnapPro-Debug-APK**.

### Lưu ý quan trọng
- **Đăng nhập**: Luôn đảm bảo bạn đã đăng nhập để thấy dữ liệu của mình. Nếu mở tab mới bị trắng, hãy vào phần Cài đặt -> Thoát và Đăng nhập lại.
- **Timezone**: Hệ thống đã được fix lỗi múi giờ, đảm bảo ngày công luôn chính xác với giờ Việt Nam.

---
**Phát triển bởi: TruongVanKhoa**  
*Giải pháp tối ưu cho người lao động thời đại số.*
