"use client";

import { Provider } from "react-redux";
import { store } from "@/store";
import { AuthInitializer } from "@/hooks/useAuthInit";
import { NotificationProvider } from "@/providers/NotificationProvider";
import { PaymentSocketProvider } from "@/providers/PaymentSocketProvider";
import "@/i18n";

export default function RtkProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <Provider store={store}>
      <AuthInitializer>
        <NotificationProvider>
          <PaymentSocketProvider>{children}</PaymentSocketProvider>
        </NotificationProvider>
      </AuthInitializer>
    </Provider>
  );
}
