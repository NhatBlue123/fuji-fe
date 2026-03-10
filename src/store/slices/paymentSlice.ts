// src/store/slices/paymentSlice.ts
import { getAccessToken } from '@/lib/token';
import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import axios from 'axios'; // Giả sử bạn dùng axios, có thể thay bằng fetch hoặc axios instance của project

// 1. Định nghĩa kiểu dữ liệu trả về từ API giống y hệt JSON bạn cung cấp
export interface PaymentResponse {
  amount: number;
  createdAt: string;
  currency: string;
  gateway: string;
  gatewayTransactionId: string | null;
  id: number;
  orderId: string;
  status: string;
  updatedAt: string;
  userEmail: string;
  userId: number;
}

// State quản lý việc thanh toán
interface PaymentState {
  currentOrder: PaymentResponse | null;
  isLoading: boolean;
  error: string | null;
}

const initialState: PaymentState = {
  currentOrder: null,
  isLoading: false,
  error: null,
};

// 2. Tạo Async Thunk để gọi API tạo thanh toán
// Payload gửi lên (data truyền vào) giả định chỉ cần truyền amount
export const createPaymentThunk = createAsyncThunk<
  PaymentResponse, 
  { amount: number }, 
  { rejectValue: string }
>(
  'payment/create',
  async (payload, { rejectWithValue }) => {
    try {
        const token = getAccessToken();
      // Nhớ thay baseUrl nếu bạn có file config axios riêng
      const response = await axios.post('http://localhost:8181/api/payments/create', {
        amount: payload.amount,
        gateway: 'XGATE' // Có thể gửi thêm các trường BE yêu cầu
      }, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Lỗi khi tạo đơn thanh toán');
    }
  }
);

// 3. Khởi tạo Slice
const paymentSlice = createSlice({
  name: 'payment',
  initialState,
  reducers: {
    // Action để reset order khi đóng modal hoặc thanh toán xong
    clearCurrentOrder: (state) => {
      state.currentOrder = null;
      state.error = null;
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(createPaymentThunk.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(createPaymentThunk.fulfilled, (state, action: PayloadAction<PaymentResponse>) => {
        state.isLoading = false;
        state.currentOrder = action.payload; // Lưu dữ liệu API trả về vào state
      })
      .addCase(createPaymentThunk.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });
  },
});

export const { clearCurrentOrder } = paymentSlice.actions;
export default paymentSlice.reducer;