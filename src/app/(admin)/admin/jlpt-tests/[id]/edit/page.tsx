"use client";

import { useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

export default function EditJLPTTestRedirect() {
  const params = useParams();
  const router = useRouter();

  useEffect(() => {
    if (params.id) {
      router.replace(`/admin/jlpt-tests?editId=${params.id}`);
    } else {
      router.replace("/admin/jlpt-tests");
    }
  }, [params.id, router]);

  return (
    <div className="flex h-screen w-full flex-col items-center justify-center space-y-4">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
      <span className="text-muted-foreground animate-pulse">Đang chuẩn bị trình chỉnh sửa thông minh...</span>
    </div>
  );
}
