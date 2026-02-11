import { configureStore } from "@reduxjs/toolkit";
import { setupListeners } from "@reduxjs/toolkit/query";
import authReducer from "./slices/authSlice";
import { authApi } from "./services/authApi";
import { flashcardApi } from "./services/flashcardApi";
import { authListenerMiddleware } from "./middlewares/authMiddleware";
import { baseApi } from "./services/baseApi";

export const store = configureStore({
  reducer: {
    auth: authReducer,
    // RTK Query reducers
    [authApi.reducerPath]: authApi.reducer,
    [baseApi.reducerPath]: baseApi.reducer,
    [flashcardApi.reducerPath]: flashcardApi.reducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware()
      .concat(authApi.middleware)
      .concat(flashcardApi.middleware)
      .concat(baseApi.middleware)
      .prepend(authListenerMiddleware.middleware),
});

// Setup listeners for refetchOnFocus/refetchOnReconnect
setupListeners(store.dispatch);

// Export types
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
