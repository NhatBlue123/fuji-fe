"use client";

import { AiPolicyManager } from "../AiPolicyManager";

export default function AiSenseiQuotaPage() {
  return (
    <AiPolicyManager
      title="Quota Sensei"
      description="Quản lý số buổi luyện nói AI Sensei theo hạng gói. Sensei tính theo buổi, không tính từng câu nói."
      tableTitle="Buổi luyện nói theo hạng gói"
      emptyText="Chưa có cấu hình Sensei."
      featureKeys={["AI_SENSEI_SESSION"]}
      quotaLabel="Buổi/ngày"
    />
  );
}
