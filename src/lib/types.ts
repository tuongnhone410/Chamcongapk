
export interface WorkSession {
  id: string;
  checkIn: string; // ISO string
  checkOut: string | null; // ISO string
  totalMinutes: number;
  salary: number;
  multiplier: number; // Hệ số lương (1.5, 2.0, 3.0...)
  note: string;
  createdAt: string;
}

export interface AppSettings {
  baseMonthlySalary: number; // Lương cơ bản hàng tháng
  hourlyRate: number; // Lương làm thêm / OT mỗi giờ
  currency: string;
  darkMode: boolean;
  payday: number; // Ngày chốt lương (1-31)
  monthlyTarget: number; // Mục tiêu thu nhập hàng tháng
  
  // Phụ cấp hàng tháng
  allowanceHousing: number; // Tiền nhà ở
  allowanceFuel: number;    // Tiền xăng xe
  allowanceLunch: number;   // Tiền ăn trưa
  allowancePhone: number;   // Tiền điện thoại
  allowanceAttendance: number; // Tiền chuyên cần
  allowanceToxic: number;      // Phụ cấp độc hại
  allowanceBonus: number;      // Thưởng doanh thu/năng suất
  
  // Khấu trừ hàng tháng
  insuranceRate: number;    // % đóng BHXH (mặc định 10.5%)
  unionFee: number;         // Đoàn phí
  incomeTax: number;        // Thuế TNCN (tạm tính)
  
  // Hệ số mặc định
  defaultMultiplier: number;
  sundayMultiplier: number;
  holidayMultiplier: number;
}
