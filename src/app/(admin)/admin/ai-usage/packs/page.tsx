"use client";

import React from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function AiPacksPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold tracking-tight">Gói AI mua thêm</h1>
      <Card>
        <CardHeader><CardTitle>Quản lý qua Gói hệ thống</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Quota AI mua thêm đang được gom vào gói hệ thống và đồng bộ quyền gói sang AI-FUJI khi người dùng mua gói.
          </p>
          <Button asChild><Link href="/admin/packages">Mở Gói hệ thống</Link></Button>
        </CardContent>
      </Card>
    </div>
  );
}
