import { configureStore } from "@reduxjs/toolkit";
import { setupListeners } from "@reduxjs/toolkit/query";
import authReducer from "./slices/authSlice";
import { authApi } from "./services/authApi";
import { flashcardApi } from "./services/flashcardApi";
import { courseApi } from "./services/courseApi";
import { authListenerMiddleware } from "./middlewares/authMiddleware";
import { baseApi } from "./services/baseApi";
import { jlptApi } from "./services/jlptApi";
import { adminJlptApi } from "./services/adminJlptApi";

import paymentReducer from './slices/paymentSlice';
import walletReducer from "./slices/walletSlice";
import { adminFlashcardApi } from "./services/admin/flashcardApi";
import { userApi } from "./services/admin/userApi";
import { adminReportApi } from "./services/adminReportApi";
export const store = configureStore({
  reducer: {
    auth: authReducer,
    payment: paymentReducer,
    wallet: walletReducer,
    // RTK Query reducers
    [authApi.reducerPath]: authApi.reducer,
    [baseApi.reducerPath]: baseApi.reducer,
    [flashcardApi.reducerPath]: flashcardApi.reducer,
    [courseApi.reducerPath]: courseApi.reducer,
    [jlptApi.reducerPath]: jlptApi.reducer,
    [adminJlptApi.reducerPath]: adminJlptApi.reducer,
    [adminFlashcardApi.reducerPath]: adminFlashcardApi.reducer,
    [userApi.reducerPath]: userApi.reducer,
    [adminReportApi.reducerPath]: adminReportApi.reducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware()
      .concat(authApi.middleware)
      .concat(flashcardApi.middleware)
      .concat(jlptApi.middleware)
      .concat(adminJlptApi.middleware)
      .concat(adminFlashcardApi.middleware)
      .concat(userApi.middleware)
      //.concat(adminRevenueApi.middleware)
      .concat(baseApi.middleware)
      .concat(courseApi.middleware)
      .concat(adminReportApi.middleware)
      .prepend(authListenerMiddleware.middleware),
});

// Setup listeners for refetchOnFocus/refetchOnReconnect
setupListeners(store.dispatch);

// Export types
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
