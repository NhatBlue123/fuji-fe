"use client";

import { Provider } from "react-redux";
import { store } from "@/store";
import { AuthInitializer } from "@/hooks/useAuthInit";
import { AIChatSocketProvider } from "@/providers/AIChatSocketProvider";
import { NotificationProvider } from "@/providers/NotificationProvider";
import "@/i18n";

export default function RtkProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <Provider store={store}>
      <AuthInitializer>
        <AIChatSocketProvider>
          <NotificationProvider>{children}</NotificationProvider>
        </AIChatSocketProvider>
      </AuthInitializer>
    </Provider>
  );
}
