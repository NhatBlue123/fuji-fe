# FUJI Frontend Authentication Logic

## Tổng quan
Hệ thống xác thực (auth) của FUJI FE sử dụng JWT (access token, refresh token), lưu trữ token ở localStorage, bảo vệ route bằng guard component, tự động refresh token trước khi hết hạn, và đồng bộ hóa state với backend qua RTK Query + Redux Toolkit.

## Thành phần chính

### 1. Token Utilities (`src/lib/token.ts`)
- **decodeJwt(token)**: Giải mã JWT, lấy thông tin user, roles, thời gian hết hạn.
- **isTokenExpired(token)**: Kiểm tra token đã hết hạn chưa (buffer 10s).
- **getTimeUntilExpiry(token)**: Thời gian còn lại đến khi token hết hạn (ms).
- **getRolesFromToken(token)**: Trích xuất mảng roles từ JWT.
- **getAccessToken() / getRefreshToken()**: Lấy token từ localStorage.
- **setTokens(access, refresh)**: Lưu token vào localStorage.
- **clearTokens()**: Xóa token khỏi localStorage.
- **scheduleTokenRefresh(token, fn)**: Lên lịch tự động gọi fn trước khi token hết hạn (80% lifetime).
- **cancelScheduledRefresh()**: Hủy lịch refresh.

### 2. RTK Query Auth API (`src/store/services/authApi.ts`)
- **baseQueryWithReauth**: Tự động gắn Bearer token vào header, nếu 401 sẽ gọi /refresh với refreshToken, lưu token mới và retry request.
- **Endpoints**: login, register, logout, refreshToken, getCurrentUser, verifyOtp, forgotPassword, resetPassword, ...
- **Hooks**: useLoginMutation, useRegisterMutation, useGetCurrentUserQuery, ...

### 3. Auth Slice (`src/store/slices/authSlice.ts`)
- **State**: user, accessToken, refreshToken, roles, isAuthenticated, isLoading, error, isInitialized
- **Reducers**:
  - loginStart, loginSuccess, loginFailure, logout, tokenRefreshed, updateUser, setInitialized, clearError
- **Persist**: Lưu user + trạng thái auth vào localStorage (auth_state)

### 4. Auth Middleware (`src/store/middlewares/authMiddleware.ts`)
- **Lắng nghe**:
  - login.matchFulfilled: Lưu token, fetch /me, dispatch loginSuccess, scheduleTokenRefresh
  - getCurrentUser.matchFulfilled: updateUser, scheduleTokenRefresh
  - refreshToken.matchFulfilled: tokenRefreshed, scheduleTokenRefresh
  - logout: clearTokens, cancelScheduledRefresh, reset RTK Query cache

### 5. Auth Init Hook (`src/hooks/useAuthInit.tsx`)
- **useAuthInit**: Khi app khởi động, tự động gọi getCurrentUser để khôi phục session từ token, theo dõi visibility/focus để refetch, không dùng interval mà rely vào scheduleTokenRefresh.
- **AuthInitializer**: Wrapper component để đảm bảo auth state được khởi tạo trước khi render app.

### 6. Auth Guards (`src/components/auth/AuthGuard.tsx`, `AdminGuard.tsx`, `RoleGuard.tsx`)
- **AuthGuard**: Chỉ render children nếu đã đăng nhập, chưa thì redirect.
- **AdminGuard**: Chỉ render nếu user có role admin, không thì redirect.
- **RoleGuard**: Chỉ render nếu user có ít nhất 1 role trong allowedRoles.

### 7. AuthForm (`src/components/auth/AuthForm.tsx`)
- **Login**: Gọi useLoginMutation, middleware tự động lưu token, fetch /me, dispatch loginSuccess. Hiển thị toast thành công/thất bại.
- **Register/OTP**: Gọi useRegisterMutation, useVerifyOtpMutation, toast thông báo.

### 8. Sonner Toast (`src/components/ui/sonner.tsx`)
- **Toaster**: Hiển thị toast notification, tự động theo theme app.

## Luồng xử lý chính
1. **Login**:
   - User submit form → gọi login API → nhận accessToken, refreshToken.
   - Middleware lưu token, gọi /me lấy user, dispatch loginSuccess.
   - Lên lịch tự động refresh token trước khi hết hạn.
2. **Tự động refresh token**:
   - scheduleTokenRefresh sẽ gọi API refresh trước khi accessToken hết hạn.
   - Nếu refresh thành công, lưu token mới, tiếp tục schedule.
   - Nếu refresh fail, logout toàn bộ.
3. **Bảo vệ route**:
   - Dùng AuthGuard/AdminGuard/RoleGuard để bảo vệ các trang cần đăng nhập/quyền.
4. **Khôi phục session**:
   - Khi app load lại, useAuthInit sẽ gọi getCurrentUser nếu có token, khôi phục state.
5. **Logout**:
   - Gọi logout API, clear token, cancel refresh, reset state.

## Ưu điểm
- Không reload trang khi hết hạn token, trải nghiệm mượt.
- Không phụ thuộc vào cookie httpOnly, bảo mật tốt hơn localStorage.
- Có thể mở nhiều tab, đồng bộ trạng thái đăng nhập.
- Dễ mở rộng cho phân quyền (role-based access).

## Lưu ý
- Token lưu ở localStorage, cần bảo vệ XSS.
- Nếu backend đổi cấu trúc JWT/roles, cần cập nhật hàm decodeJwt/getRolesFromToken.
- Khi đổi mật khẩu hoặc revoke token, cần logout toàn bộ tab.

---
