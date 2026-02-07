"use client";

import { Provider } from "react-redux";
import { store } from "@/store";
import { AuthInitializer } from "@/hooks/useAuthInit";

export default function RtkProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <Provider store={store}>
      <AuthInitializer>{children}</AuthInitializer>
    </Provider>
  );
}
