# Hướng dẫn đẩy code lên GitHub - TimeSnap Pro

Nếu bạn gặp lỗi khi push, hãy chạy các lệnh sau **theo đúng thứ tự, từng dòng một**:

### 1. Xóa cấu hình cũ (để làm sạch)
```bash
git remote remove origin
```

### 2. Khởi tạo và Commit lại
```bash
git init
git add .
git commit -m "Hoàn thiện app TimeSnap Pro"
git branch -M main
```

### 3. Kết nối với GitHub của bạn
*Lưu ý: Đảm bảo bạn đã tạo Repository tên là "Chamcongapk" trên GitHub trước.*
```bash
git remote add origin https://github.com/tuongnhone410/Chamcongapk.git
```

### 4. Đẩy code lên
```bash
git push -u origin main
```

---
**Mẹo nhỏ:**
- Nếu nó hỏi Username/Password, hãy nhập tài khoản GitHub của bạn.
- Nếu bạn dùng xác thực 2 lớp, hãy dùng **Personal Access Token** thay cho mật khẩu.
- Để cài app vào máy: Mở link web -> Chọn "Thêm vào màn hình chính" (Add to Home Screen).