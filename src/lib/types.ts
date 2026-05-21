
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
  insuranceSalary: number;    // Mức lương đóng bảo hiểm (SI Wage)
  hourlyRate: number; // Lương làm thêm / OT mỗi giờ
  currency: string;
  darkMode: boolean;
  payday: number; // Ngày chốt lương (1-31)
  monthlyTarget: number; // Mục tiêu thu nhập hàng tháng
  
  // Phụ cấp hàng tháng
  allowanceHousing: number; // Tiền nhà ở
  allowanceFuel: number;    // Tiền xăng xe
  allowanceLunchPerShift: number; // Tiền cơm mỗi ca (30k)
  allowanceLunchOT: number;      // Tiền cơm thêm khi OT >= 2h (15k)
  allowancePhone: number;   // Tiền điện thoại
  allowanceAttendanceBase: number; // Tiền chuyên cần gốc (600k)
  unexcusedAbsences: number;       // Số ngày nghỉ không phép
  allowanceToxic: number;      // Phụ cấp độc hại
  allowanceBonus: number;      // Thưởng doanh thu/năng suất
  allowanceProduct: number;    // Tiền sản phẩm (tự nhập 2.3 - 3.0tr)
  
  // Quản lý phép
  annualLeaveBalance: number;  // Số ngày phép năm còn lại
  
  // Khấu trừ hàng tháng
  insuranceRate: number;    // % đóng BHXH+BHYT+BHTN (mặc định 10.5%)
  unionFee: number;         // Đoàn phí
  incomeTax: number;        // Thuế TNCN (tạm tính - hiện dùng làm kết quả tính toán hoặc ghi đè)
  incomeTaxRate: number;    // % Thuế TNCN
  
  // Hệ số mặc định
  defaultMultiplier: number;
  overtimeMultiplier: number;
  sundayMultiplier: number;
  holidayMultiplier: number;
}
