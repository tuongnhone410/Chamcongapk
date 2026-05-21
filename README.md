# TimeSnap Pro - Hệ thống Chấm công & Quản lý Lương Cá nhân

TimeSnap Pro là một ứng dụng web hiện đại (PWA) được thiết kế đặc biệt để giúp người lao động theo dõi giờ làm việc, tính toán lương tăng ca (OT) và quản lý thu nhập một cách chính xác, minh bạch.

## ✨ Tính năng nổi bật

- **Chấm công thời gian thực**: Vào ca/Ra ca chỉ với một nút bấm.
- **Tính toán OT thông minh**: 
  - Tự động nhận diện Ngày thường, Chủ nhật, Ngày lễ.
  - Áp dụng hệ số OT x1.5, x2.0, x3.0 chuẩn xác.
  - Quy tắc OT linh hoạt: Bắt đầu tính OT sau 8 tiếng làm việc thực tế (nếu làm trên 8 tiếng 30 phút).
- **Khấu trừ giờ nghỉ**: Tùy chỉnh số giờ nghỉ trưa/chiều (ví dụ: 1.5h) để tính toán giờ công thực tế.
- **Quản lý lịch sử**: Xem lại nhật ký làm việc theo từng tháng, chỉnh sửa hoặc xóa dữ liệu linh hoạt.
- **Phân tích thu nhập**: Biểu đồ giờ công 7 ngày gần nhất và dự toán thực lĩnh kỳ lương (bao gồm phụ cấp, bảo hiểm, thuế).
- **Nhập/Xuất dữ liệu**: Hỗ trợ xuất báo cáo ra file CSV và nhập lại dữ liệu cũ dễ dàng.
- **Giao diện PWA**: Cài đặt trực tiếp lên màn hình điện thoại như một ứng dụng Native.

## 🛠 Công nghệ sử dụng

- **Frontend**: Next.js 15 (App Router), React, Tailwind CSS.
- **UI Components**: ShadCN UI, Lucide React, Recharts.
- **Backend**: Firebase Authentication, Firestore.
- **AI**: Google Genkit (Gemini 2.5 Flash).

## 🚀 Hướng dẫn cài đặt (Dành cho nhà phát triển)

### 1. Clone repository
```bash
git clone <link-github-cua-ban>
cd timesnap-pro
```

### 2. Cài đặt dependencies
```bash
npm install
```

### 3. Cấu hình Firebase
Cập nhật thông số Firebase của bạn trong file `src/firebase/config.ts`.

### 4. Chạy ứng dụng ở chế độ phát triển
```bash
npm run dev
```

## 📱 Cách sử dụng trên điện thoại

1. Truy cập vào link ứng dụng bằng Chrome (Android) hoặc Safari (iOS).
2. Chọn **"Thêm vào màn hình chính" (Add to Home Screen)**.
3. Sử dụng như một ứng dụng độc lập.

---
**Thiết kế bởi TruongVanKhoa**
