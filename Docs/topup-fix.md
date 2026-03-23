# Hướng Dẫn Fix Lỗi TopupContent

## Vấn Đề
`Backend trả về dữ liệu không đầy đủ` - API `/payments/create` từ backend không trả về các field bắt buộc:
- `bankId` (Mã ngân hàng)
- `accountNo` (Số tài khoản)
- `accountName` (Tên chủ tài khoản)

## Nguyên Nhân
1. **Backend chưa cấu hình XGate** - API endpoint chưa integrate với XGate payment gateway
2. **Environment variables chưa thiết lập** - Không có fallback values

## Giải Pháp
Đã update `TopupContent.tsx` với 3 giải pháp:

### 1. **Fallback Values từ Environment Variables**
```typescript
const bankId = orderData.bankId || process.env.NEXT_PUBLIC_BANK_ID || "VietComBank"
const accountNo = orderData.accountNo || process.env.NEXT_PUBLIC_ACCOUNT_NO || ""
const accountName = orderData.accountName || process.env.NEXT_PUBLIC_ACCOUNT_NAME || "FUJI PLATFORM"
```

### 2. **Validate Chi Tiết Hơn**
- Chỉ check `accountNo` là bắt buộc (các field khác có default value)
- Console log chi tiết để dễ debug

### 3. **Cấu Hình Môi Trường**
```bash
# Copy .env.example thành .env.local
cp .env.example .env.local

# Sau đó cập nhật các giá trị thực từ admin/backend
NEXT_PUBLIC_BANK_ID=VietComBank
NEXT_PUBLIC_ACCOUNT_NO=1234567890
NEXT_PUBLIC_ACCOUNT_NAME=FUJI PLATFORM
```

## Các Bước Cần Làm
1. ✅ **Frontend Fix** - Đã cập nhật TopupContent.tsx
2. ⏳ **Environment Setup** - Copy `.env.example` → `.env.local` và điền thông tin
3. ⏳ **Backend Fix** - Admin cần configure XGate credentials trên backend

## Để Hoàn Toàn Fix Vấn Đề
**Cách Tốt Nhất**: Backend trả về đầy đủ dữ liệu
- Update API `/payments/create` để return `bankId`, `accountNo`, `accountName`
- Kiểm tra XGate integration trên backend

**Cách Tạm Thời**: Dùng fallback values
- Thiết lập environment variables trong `.env.local`
- Hệ thống sẽ sử dụng giá trị này khi backend không trả về
