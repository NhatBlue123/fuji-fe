"use client";

import React from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useGetAiPoliciesQuery, useUpdateAiPolicyMutation } from "@/store/services/admin/aiQuotaAdminApi";

export default function AiSenseiQuotaPage() {
  const { data: policies = [] } = useGetAiPoliciesQuery();
  const [updatePolicy] = useUpdateAiPolicyMutation();
  const rows = policies.filter((item) => item.featureKey === "AI_SENSEI_SESSION");

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold tracking-tight">Quota Sensei</h1>
      <Card>
        <CardHeader><CardTitle>Buổi luyện nói theo hạng gói</CardTitle></CardHeader>
        <CardContent>
          <Table>
            <TableHeader><TableRow><TableHead>Hạng gói</TableHead><TableHead>Buổi/ngày</TableHead><TableHead>Giới hạn hợp lý</TableHead><TableHead /></TableRow></TableHeader>
            <TableBody>
              {rows.map((policy) => (
                <TableRow key={policy.id}>
                  <TableCell>{policy.tier}</TableCell>
                  <TableCell><Input type="number" defaultValue={policy.quotaAmount} id={`quota-${policy.id}`} /></TableCell>
                  <TableCell><Input type="number" defaultValue={policy.fairUseAmount ?? 0} id={`fair-${policy.id}`} /></TableCell>
                  <TableCell className="text-right">
                    <Button size="sm" onClick={async () => {
                      await updatePolicy({
                        id: policy.id,
                        data: {
                          quotaAmount: Number((document.getElementById(`quota-${policy.id}`) as HTMLInputElement)?.value || 0),
                          fairUseAmount: Number((document.getElementById(`fair-${policy.id}`) as HTMLInputElement)?.value || 0),
                          active: true,
                        },
                      }).unwrap();
                      toast.success("Đã lưu quota Sensei");
                    }}>Lưu</Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
