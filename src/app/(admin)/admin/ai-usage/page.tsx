"use client";

import React from "react";
import { Brain } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useGetAiUsageSummaryQuery } from "@/store/services/admin/aiQuotaAdminApi";

const featureLabel = (featureKey: string) => {
  if (featureKey === "AI_CHAT_BASIC") return "Trò chuyện AI";
  if (featureKey === "AI_CHAT_DEEP") return "Giải thích chuyên sâu";
  if (featureKey === "AI_SENSEI_SESSION") return "Buổi Sensei";
  return featureKey;
};

export default function AiUsageOverviewPage() {
  const { data: summary = [] } = useGetAiUsageSummaryQuery();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight"><Brain className="h-6 w-6" /> AI và quota</h1>
        <p className="text-sm text-muted-foreground">Tổng quan lượt gọi dịch vụ AI trong 30 ngày gần nhất.</p>
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        {summary.map((item) => (
          <Card key={item.featureKey}>
            <CardHeader><CardTitle className="text-sm">{featureLabel(item.featureKey)}</CardTitle></CardHeader>
            <CardContent className="text-3xl font-bold">{Number(item.externalCalls || 0).toLocaleString()}</CardContent>
          </Card>
        ))}
      </div>
      <Card>
        <CardHeader><CardTitle>Lượt gọi dịch vụ AI</CardTitle></CardHeader>
        <CardContent>
          <Table>
            <TableHeader><TableRow><TableHead>Tính năng</TableHead><TableHead>Lượt gọi dịch vụ ngoài</TableHead></TableRow></TableHeader>
            <TableBody>
              {summary.map((item) => <TableRow key={item.featureKey}><TableCell>{featureLabel(item.featureKey)}</TableCell><TableCell>{item.externalCalls}</TableCell></TableRow>)}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
