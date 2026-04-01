import { configureStore } from "@reduxjs/toolkit";
import { setupListeners } from "@reduxjs/toolkit/query";
import authReducer from "./slices/authSlice";
import { authApi } from "./services/authApi";
import { flashcardApi } from "./services/flashcardApi";
import { courseApi } from "./services/courseApi";
import { authListenerMiddleware } from "./middlewares/authMiddleware";
import { baseApi } from "./services/baseApi";
import { aiBaseApi } from "./services/aiBaseApi";
import { jlptApi } from "./services/jlptApi";
import { adminJlptApi } from "./services/adminJlptApi";

import paymentReducer from './slices/paymentSlice';
import walletReducer from "./slices/walletSlice";
import { adminFlashcardApi } from "./services/admin/flashcardApi";
import { userApi } from "./services/admin/userApi";
import { adminReportApi } from "./services/adminReportApi";
import { adminRevenueApi } from "./services/adminRevenueApi";
import { subscriptionApi } from "./services/subscriptionApi";
export const store = configureStore({
  reducer: {
    auth: authReducer,
    payment: paymentReducer,
    wallet: walletReducer,
    // RTK Query reducers
    [authApi.reducerPath]: authApi.reducer,
    [baseApi.reducerPath]: baseApi.reducer,
    [aiBaseApi.reducerPath]: aiBaseApi.reducer,
    [flashcardApi.reducerPath]: flashcardApi.reducer,
    [courseApi.reducerPath]: courseApi.reducer,
    [jlptApi.reducerPath]: jlptApi.reducer,
    [adminJlptApi.reducerPath]: adminJlptApi.reducer,
    [adminFlashcardApi.reducerPath]: adminFlashcardApi.reducer,
    [userApi.reducerPath]: userApi.reducer,
    [adminReportApi.reducerPath]: adminReportApi.reducer,
    [adminRevenueApi.reducerPath]: adminRevenueApi.reducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware()
      .concat(authApi.middleware)
      .concat(flashcardApi.middleware)
      .concat(jlptApi.middleware)
      .concat(adminJlptApi.middleware)
      .concat(adminFlashcardApi.middleware)
      .concat(userApi.middleware)
      .concat(adminRevenueApi.middleware)
      .concat(baseApi.middleware)
      .concat(aiBaseApi.middleware)
      .concat(courseApi.middleware)
      .concat(adminReportApi.middleware)
      .prepend(authListenerMiddleware.middleware),
});

// Setup listeners for refetchOnFocus/refetchOnReconnect
setupListeners(store.dispatch);

// Export types
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
