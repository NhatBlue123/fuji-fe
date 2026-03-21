import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";
import { getAccessToken } from "@/lib/token";

interface WalletState {
  balance: number;
  isLoading: boolean;
}

const initialState: WalletState = {
  balance: 0,
  isLoading: false
};

export const fetchWallet = createAsyncThunk(
  "wallet/fetch",
  async () => {
    const token = getAccessToken();

    const res = await axios.get(
      "http://localhost:8181/api/wallet/me",
      {
        headers: {
          Authorization: `Bearer ${token}`
        }
      }
    );

    return res.data;
  }
);

const walletSlice = createSlice({
  name: "wallet",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchWallet.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(fetchWallet.fulfilled, (state, action) => {
        state.isLoading = false;
        state.balance = action.payload.balance;
      });
  }
});

export default walletSlice.reducer;