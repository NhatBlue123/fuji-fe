# OTP Payment Test Flow Guide

## Tổng Quan
Đã implement complete OTP Payment flow test để simulate thanh toán thành công và tự động cộng XU vào ví.

## Flow Chi Tiết

### 📍 Bước 1: Tạo Đơn Nạp (Create Payment Order)
```
POST /api/payments/create
Body: { amount: 1000000 }
Response: {
  orderId: "ORDER_xxx",
  amount: 1000000,
  bankId: "MB",
  accountNo: "0916146446",
  accountName: "NHo huy"
}
```

### 📍 Bước 2: Lấy Test Signature
```
GET /api/payments/test-signature?order_id=ORDER_xxx&amount=1000000&status=SUCCESS
Response: { signature: "xxxx...xxxx" }
```

### 📍 Bước 3: Gửi XGate Callback (Payment Success Callback)
```
POST /api/payments/callback
Body: {
  order_id: "ORDER_xxx",
  transaction_id: "TXN_12345",
  amount: 1000000,
  status: "SUCCESS",
  signature: "xxxx...xxxx"
}
Response: { status: "SUCCESS", message: "Payment processed" }
```

### 📍 Bước 4: Kiểm Tra Ví (Verify Coins Added)
```
GET /api/wallet/me
Response: {
  balance: 1000000,
  Coins: 1000
}
```

## Cách Sử Dụng

### 🧪 Test Trực Tiếp (Development Mode)
1. Vào trang Nạp Tiền (Premium/Topup)
2. Chọn gói nạp
3. Click button "▶ Chạy Test Flow"
4. Hệ thống tự động:
   - Tạo lệnh nạp
   - Lấy signature
   - Gửi callback
   - Kiểm tra ví
5. Xem kết quả hiển thị trên UI

### 🔧 Sử Dụng Trong Code
```typescript
import { runPaymentTestFlow } from "@/lib/paymentTestFlow";

// Chạy flow test
const result = await runPaymentTestFlow(1000000);
console.log(result);
// Output:
// {
//   orderId: "ORDER_xxx",
//   amount: 1000000,
//   signature: "xxxx...",
//   callbackStatus: "SUCCESS",
//   newBalance: 1000000,
//   Coins: 1000
// }
```

### 🎣 Sử Dụng Hook
```typescript
import { usePaymentTestFlow } from "@/hooks/usePaymentTestFlow";

function MyComponent() {
  const { executeTestFlow, isLoading, result, error } = usePaymentTestFlow();

  const handleTest = async () => {
    try {
      const result = await executeTestFlow(1000000);
      console.log("Test success:", result);
    } catch (err) {
      console.error("Test failed:", err);
    }
  };

  return (
    <button onClick={handleTest} disabled={isLoading}>
      {isLoading ? "Testing..." : "Run Test"}
    </button>
  );
}
```

## Console Output Example

```
🚀 Starting OTP Payment Test Flow...

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📍 STEP 1: Creating payment order (Amount: 1000000đ)...
✅ Step 1 - Payment Order Created: { orderId: 'ORDER_1234567890', ... }

📍 STEP 2: Getting test signature (OrderID: ORDER_1234567890)...
✅ Step 2 - Test Signature Retrieved: { signature: 'sig_abc123...' }

📍 STEP 3: Sending payment callback...
✅ Step 3 - Callback Sent Successfully: { status: 'SUCCESS', message: '...' }

⏳ Waiting for backend to process payment (1.5 seconds)...

📍 STEP 4: Checking wallet balance...
✅ Step 4 - Wallet Balance: { balance: 1000000, Coins: 1000 }

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✅ OTP PAYMENT TEST FLOW COMPLETED SUCCESSFULLY!

📊 Results Summary:
   - OrderID: ORDER_1234567890
   - Amount: 1,000,000đ
   - Signature: sig_abc123...
   - Callback Status: SUCCESS
   - New Balance: 1,000,000đ
   - Coins Added: 1000 xu
```

## Files Liên Quan

### New Files Created
- `src/lib/paymentTestFlow.ts` - Core logic for OTP payment flow
- `src/hooks/usePaymentTestFlow.ts` - React hook wrapper

### Modified Files
- `src/components/user-component/premium/TopupContent.tsx` - Added test UI

## Features

✅ Simulate complete payment flow
✅ Auto-add Coins to wallet on success
✅ Detailed console logging
✅ Error handling and recovery
✅ Development mode only (visible when NODE_ENV === 'development')
✅ Real API calls (not mocked)

## Kiểm Tra Vấn Đề

### Backend Không Trả Về OrderId
Kiểm tra endpoint `/payments/create` đang hoạt động

### Signature Không Hợp Lệ
Kiểm tra backend generate signature đúng

### Callback Thất Bại
- Kiểm tra `/payments/callback` endpoint
- Verify signature match
- Kiểm tra database transaction

### Wallet Không Cộng Tiền
- Kiểm tra callback status là SUCCESS
- Verify wallet service cộng tiền
- Check user ID is correct

## Development Tips

1. **Debug Chi Tiết**: Mở DevTools Console và xem full logs
2. **Slow Motion**: Thêm delay giữa các steps
3. **Multiple Tests**: Chạy test nhiều lần để verify consistency
4. **Monitor Backend**: Check backend logs khi test flow chạy
5. **Database Inspection**: Query wallet table để verify balance

## Production Notes

- Test flow **CHỈ HIỂN THỊ KHI NODE_ENV === 'development'**
- Không thể trigger flow từ production
- Tất cả API calls là **REAL** - không mocked
- Backend phải cách ly test endpoints hoặc kiểm tra authorization

