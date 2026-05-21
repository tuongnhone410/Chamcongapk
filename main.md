# Hướng dẫn đẩy code lên GitHub - TimeSnap Pro

Dưới đây là các lệnh bạn cần chạy trong Terminal để đẩy mã nguồn lên GitHub. Hãy copy và chạy **từng dòng một**:

```bash
# 1. Khởi tạo Git
git init

# 2. Thêm tất cả các tệp vào hàng chờ
git add .

# 3. Tạo bản lưu đầu tiên
git commit -m "Hoàn thiện app TimeSnap Pro"

# 4. Đổi tên nhánh chính thành main
git branch -M main

# 5. Kết nối với kho lưu trữ GitHub (Nếu đã tồn tại thì chạy lệnh remove trước)
# git remote remove origin
git remote add origin https://github.com/tuongnhone410/Chamcongapk.git

# 6. Đẩy mã nguồn lên GitHub
git push -u origin main7
```

**Lưu ý:**
- Nếu bước 5 báo lỗi "remote origin already exists", hãy chạy `git remote remove origin` rồi thử lại bước 5.
- Đảm bảo bạn đã đăng nhập Git trên máy tính.
