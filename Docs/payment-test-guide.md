# OTP Payment Test Flow - Hướng Dẫn Chi Tiết

## 📋 Tổng Quan
Guide chi tiết để test OTP Payment flow - simulate thanh toán thành công từ XGate và tự động cộng tiền vào ví.

---

## 🎯 Cách Test - 4 Phương Pháp

### Phương Pháp 1️⃣: Test UI (Dễ Nhất) ✅

**Step 1**: Vào trang Nạp Tiền (Premium/Topup)

**Step 2**: Chọn gói nạp (ví dụ: 100.000đ)

**Step 3**: Scroll xuống phần "🧪 Test OTP Payment Flow" (chỉ hiển thị khi development)

**Step 4**: Click button "▶ Chạy Test Flow"

**Step 5**: Xem kết quả trên UI:
- Order ID được tạo
- Signature được lấy
- Callback được gửi
- Ví tự động cộng tiền
- Số XU được hiển thị

---

### Phương Pháp 2️⃣: PowerShell Script (Windows) ⚡

**Step 1**: Mở PowerShell hoặc Terminal (Windows)

**Step 2**: Điều hướng đến thư mục project:
```powershell
cd "C:\path\to\fuji-fe"
```

**Step 3**: Chạy script:
```powershell
# Cách 1: Với tham số
.\scripts\payment-test.ps1 -AuthToken "your_jwt_token" -Amount 1000000

# Cách 2: Với biến môi trường
$AuthToken = "your_jwt_token"
$Amount = 1000000
.\scripts\payment-test.ps1

# Nhận token từ localStorage (F12 > Console):
# localStorage.getItem('auth_token')
# Hoặc có thể lấy từ sessionStorage
```

**Output Example**:
```
🚀 Starting OTP Payment Test Flow
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
API URL: http://localhost:8181/api
Amount: 1000000 đ
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📍 Creating payment order (Amount: 1000000 đ)...
✅ Payment created!
  - Order ID: ORDER_1234567890
  - Amount: 1000000 đ

📍 Getting test signature (OrderID: ORDER_1234567890)...
✅ Signature obtained!
  - Signature: sig_abc123def456...

📍 Sending payment callback...
✅ Callback sent!
  - Status: SUCCESS

ℹ️  Waiting for backend to process payment (1.5 seconds)...

📍 Checking wallet balance...
✅ Wallet updated!
  - Balance: 1,000,000 đ
  - Coins: 1000 xu

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✅ OTP PAYMENT TEST FLOW COMPLETED SUCCESSFULLY!
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📊 Results Summary:
  - Order ID: ORDER_1234567890
  - Transaction ID: TXN_20260311114530...
  - Amount: 1000000 đ
  - New Balance: 1,000,000 đ
  - Coins Added: 1000 xu
```

---

### Phương Pháp 3️⃣: Browser Console ⌨️

**Step 1**: Vào trang nạp tiền rồi mở DevTools (F12 hoặc Ctrl+Shift+I)

**Step 2**: Chuyển sang tab "Console"

**Step 3**: Copy và paste script này:

```javascript
// Lấy token từ localStorage trước
const token = localStorage.getItem('auth_token') || sessionStorage.getItem('auth_token');
const amount = 1000000;

// Copy script dưới đây vào console:
(async () => {
  const baseURL = 'http://localhost:8181/api';

  try {
    console.log('🚀 Starting payment test...');

    // Step 1: Create payment
    const createRes = await fetch(`${baseURL}/payments/create`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ amount })
    });
    const orderData = await createRes.json();
    console.log('✅ Order created:', orderData.orderId);

    // Step 2: Get signature
    const sigRes = await fetch(
      `${baseURL}/payments/test-signature?order_id=${orderData.orderId}&amount=${amount}&status=SUCCESS`,
      { headers: { 'Authorization': `Bearer ${token}` } }
    );
    const sigData = await sigRes.json();
    console.log('✅ Signature obtained');

    // Step 3: Send callback
    const callRes = await fetch(`${baseURL}/payments/callback`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        order_id: orderData.orderId,
        transaction_id: `TXN_${Date.now()}`,
        amount,
        status: 'SUCCESS',
        signature: sigData.signature
      })
    });
    const callData = await callRes.json();
    console.log('✅ Callback sent:', callData.status);

    // Wait
    await new Promise(r => setTimeout(r, 1500));

    // Step 4: Check wallet
    const walRes = await fetch(`${baseURL}/wallet/me`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const walData = await walRes.json();
    console.log('✅ Wallet updated:', walData.balance, 'đ');
    console.log('xu Coins:', Math.floor(walData.balance / 1000));

    console.log('✅ TEST COMPLETE!');
  } catch(e) {
    console.error('❌ Error:', e);
  }
})();
```

**Step 4**: Nhấn Enter để chạy

---

### Phương Pháp 4️⃣: Postman / REST Client

**Step 1**: Mở Postman hoặc REST Client

**Step 2**: Import biến môi trường:
```json
{
  "baseUrl": "http://localhost:8181/api",
  "authToken": "your_jwt_token",
  "amount": 1000000
}
```

**Step 3A: Create Payment Order**
```
Method: POST
URL: {{baseUrl}}/payments/create
Headers:
  - Authorization: Bearer {{authToken}}
  - Content-Type: application/json
Body:
{
  "amount": 1000000
}
```

Lưu `order_id` từ response vào variable `{{orderId}}`

**Step 3B: Get Test Signature**
```
Method: GET
URL: {{baseUrl}}/payments/test-signature?order_id={{orderId}}&amount=1000000&status=SUCCESS
Headers:
  - Authorization: Bearer {{authToken}}
```

Lưu `signature` từ response vào variable `{{signature}}`

**Step 3C: Send Callback**
```
Method: POST
URL: {{baseUrl}}/payments/callback
Headers:
  - Authorization: Bearer {{authToken}}
  - Content-Type: application/json
Body:
{
  "order_id": "{{orderId}}",
  "transaction_id": "TXN_{{$timestamp}}",
  "amount": 1000000,
  "status": "SUCCESS",
  "signature": "{{signature}}"
}
```

**Step 3D: Check Wallet**
```
Method: GET
URL: {{baseUrl}}/wallet/me
Headers:
  - Authorization: Bearer {{authToken}}
```

---

## 🔑 Lấy JWT Token

### Từ Browser:
1. Mở DevTools (F12)
2. Tab "Application" → "LocalStorage" hoặc "SessionStorage"
3. Tìm key `auth_token`
4. Copy giá trị

### Từ Browser Console:
```javascript
// Một trong những cách dưới sẽ trả về token
localStorage.getItem('auth_token')
sessionStorage.getItem('auth_token')
localStorage.getItem('access_token')
document.cookie
```

### Từ Network Tab:
1. F12 → Network
2. Refresh trang
3. Tìm request đến API
4. Xem Header "Authorization"

---

## 📊 Kết Quả Kỳ Vọng

Sau khi chạy test flow hoàn tất, bạn sẽ thấy:

| Item | Kết Quả |
|------|---------|
| Order ID | `ORDER_1234567890` |
| Amount | `1,000,000 đ` |
| Callback Status | `SUCCESS` |
| Wallet Balance | Tăng lên (cộng thêm 1,000,000 đ) |
| Coins xu | `1000` |

---

## ❌ Troubleshooting

### 1️⃣ "Cannot find auth token"
**Giải Pháp**:
- Đảm bảo bạn đã đăng nhập
- Kiểm tra localStorage/sessionStorage
- Xem DevTools Network tab để lấy token từ request

### 2️⃣ "401 Unauthorized"
**Giải Pháp**:
- Token đã hết hạn → Đăng nhập lại
- Token sai → Kiểm tra lại giá trị token
- Header format sai → Phải là `Bearer token_value`

### 3️⃣ "404 Not Found"
**Giải Pháp**:
- API endpoint không tồn tại → Kiểm tra backend
- URL sai → Copy đúng URL từ docs
- API chưa implement → Xem backend code

### 4️⃣ "Wallet không cộng tiền"
**Giải Pháp**:
- Check callback response status
- Verify backend processing
- Kiểm tra database wallet table
- Xem backend logs

### 5️⃣ "Signature không hợp lệ"
**Giải Pháp**:
- Backend generate sai signature → Fix backend
- Data không match → Verify amount, orderId
- Signature algorithm khác → Check backend config

---

## 📁 Files Liên Quan

```
fuji-fe/
├── src/
│   ├── lib/
│   │   ├── paymentTestFlow.ts      # Core payment flow logic
│   │   └── manualPaymentTest.ts    # Manual test functions
│   ├── hooks/
│   │   └── usePaymentTestFlow.ts   # React hook wrapper
│   └── components/
│       └── user-component/
│           └── premium/
│               └── TopupContent.tsx # Updated with test UI
├── scripts/
│   ├── payment-test.ps1            # PowerShell test script (Windows)
│   └── payment-test.sh             # Bash test script (Linux/Mac)
└── Docs/
    ├── payment-test-flow.md        # Hướng dẫn tổng quát
    └── payment-integration.md      # (Nếu có thêm docs)
```

---

## ⚙️ Configuration

### Environment Variables (Optional)
```env
NEXT_PUBLIC_API_URL=http://localhost:8181/api
NEXT_PUBLIC_BANK_ID=MB
NEXT_PUBLIC_ACCOUNT_NO=0916146446
NEXT_PUBLIC_ACCOUNT_NAME=NHo huy
```

### Development Mode
- Test flow chỉ hiển thị khi `NODE_ENV === 'development'`
- Production không hiển thị button test

---

## ✅ Checklist Trước Khi Deploy

- [ ] Test flow hoạt động trong development
- [ ] Wallet balance cập nhật đúng
- [ ] Coins được cộng vào
- [ ] Backend logs không có error
- [ ] Database transaction logs đúng
- [ ] Test UI bị ẩn trong production (NODE_ENV check)
- [ ] API endpoints được authorize đúng

---

## 🚀 Next Steps

1. **Test ngay**: Dùng một trong 4 phương pháp trên
2. **Verify kết quả**: Kiểm tra wallet balance và Coins
3. **Debug nếu cần**: Xem console logs và backend logs
4. **Document hoạt động**: Ghi lại kết quả
5. **Deploy**: Đẩy code lên production (test UI sẽ ẩn)

---

## 📞 Support

Nếu gặp vấn đề:
1. Kiểm tra console logs (F12)
2. Kiểm tra backend logs
3. Verify API endpoints
4. Xem database transactions

