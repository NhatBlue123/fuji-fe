"use client";

import React, { useState } from "react";
import { RefreshCw, Save } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  type AiPolicy,
  useGetAiPoliciesQuery,
  useUpdateAiPolicyMutation,
} from "@/store/services/admin/aiQuotaAdminApi";
import { featureLabel, isEnabled, tierLabel } from "../helpers";

type PolicyRowProps = {
  policy: AiPolicy;
  saving: boolean;
  onSave: (
    policy: AiPolicy,
    payload: { quotaAmount: number; fairUseAmount: number; active: boolean },
  ) => Promise<void>;
};

function PolicyRow({ policy, saving, onSave }: PolicyRowProps) {
  const [quotaAmount, setQuotaAmount] = useState(String(policy.quotaAmount ?? 0));
  const [fairUseAmount, setFairUseAmount] = useState(String(policy.fairUseAmount ?? 0));
  const [active, setActive] = useState(isEnabled(policy.active));

  return (
    <TableRow>
      <TableCell className="font-medium">{featureLabel(policy.featureKey)}</TableCell>
      <TableCell>
        <Badge variant="secondary">{tierLabel(policy.tier)}</Badge>
      </TableCell>
      <TableCell>
        <Input
          min={0}
          type="number"
          value={quotaAmount}
          onChange={(event) => setQuotaAmount(event.target.value)}
        />
      </TableCell>
      <TableCell>
        <Input
          min={0}
          type="number"
          value={fairUseAmount}
          onChange={(event) => setFairUseAmount(event.target.value)}
        />
      </TableCell>
      <TableCell>
        <Switch checked={active} onCheckedChange={setActive} />
      </TableCell>
      <TableCell className="text-right">
        <Button
          size="sm"
          onClick={() =>
            onSave(policy, {
              quotaAmount: Math.max(0, Number(quotaAmount) || 0),
              fairUseAmount: Math.max(0, Number(fairUseAmount) || 0),
              active,
            })
          }
          disabled={saving}
        >
          <Save className="mr-2 h-4 w-4" />
          Lưu
        </Button>
      </TableCell>
    </TableRow>
  );
}

export default function AiChatbotQuotaPage() {
  const { data: policies = [], isFetching, isLoading, isError, refetch } = useGetAiPoliciesQuery();
  const [updatePolicy, { isLoading: isSaving }] = useUpdateAiPolicyMutation();
  const rows = policies.filter((item) => item.featureKey === "AI_CHAT_BASIC" || item.featureKey === "AI_CHAT_DEEP");

  const handleSave = async (
    policy: AiPolicy,
    payload: { quotaAmount: number; fairUseAmount: number; active: boolean },
  ) => {
    try {
      await updatePolicy({ id: policy.id, data: payload }).unwrap();
      toast.success("Đã lưu quota chatbot AI");
    } catch {
      toast.error("Không thể lưu quota chatbot AI");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Quota chatbot AI</h1>
          <p className="text-sm text-muted-foreground">
            Quản lý lượt chat thường và lượt giải thích chuyên sâu theo từng hạng gói.
          </p>
        </div>
        <Button variant="outline" onClick={() => refetch()} disabled={isFetching}>
          <RefreshCw className={`mr-2 h-4 w-4 ${isFetching ? "animate-spin" : ""}`} />
          Làm mới
        </Button>
      </div>

      {isError && (
        <Card className="border-destructive/30 bg-destructive/5">
          <CardContent className="py-4 text-sm text-destructive">
            Không tải được cấu hình chatbot AI. Kiểm tra dịch vụ AI-FUJI hoặc quyền admin.
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader><CardTitle>Trò chuyện thường và giải thích chuyên sâu</CardTitle></CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Tính năng</TableHead>
                <TableHead>Hạng gói</TableHead>
                <TableHead>Quota/ngày</TableHead>
                <TableHead>Giới hạn hợp lý/ngày</TableHead>
                <TableHead>Đang bật</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((policy) => (
                <PolicyRow
                  key={`${policy.id}-${policy.quotaAmount}-${policy.fairUseAmount ?? 0}-${Number(policy.active)}`}
                  policy={policy}
                  saving={isSaving}
                  onSave={handleSave}
                />
              ))}
              {rows.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="py-8 text-center text-sm text-muted-foreground">
                    {isLoading || isFetching ? "Đang tải cấu hình..." : "Chưa có cấu hình chatbot AI."}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
