"use client";

import { AiPolicyManager } from "../AiPolicyManager";

export default function AiChatbotQuotaPage() {
  return (
    <AiPolicyManager
      title="Quota chatbot AI"
      description="Quản lý lượt chat thường và lượt suy luận theo từng hạng gói."
      tableTitle="Trò chuyện thường và suy luận"
      emptyText="Chưa có cấu hình chatbot AI."
      featureKeys={["AI_CHAT_BASIC", "AI_CHAT_DEEP"]}
      quotaLabel="Lượt/ngày"
    />
  );
}
