"use client";

import { Provider } from "react-redux";
import { store } from "./index";
import AuthInitializer from "@/components/auth/AuthInitializer";

export default function StoreProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <Provider store={store}>
      <AuthInitializer />
      {children}
    </Provider>
  );
}