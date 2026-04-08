import React from "react";
import { Separator } from "@/components/ui/separator";

export function AdminFooter() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="border-t border-border bg-card">
      <div className="flex flex-col items-center justify-between gap-2 px-6 py-4 sm:flex-row">
        <p className="text-sm text-muted-foreground">
          &copy; {currentYear} FUJI Admin. All rights reserved.
        </p>
        <div className="flex items-center gap-4">
          <span className="text-xs text-muted-foreground">v1.0.0</span>
          <Separator orientation="vertical" className="h-4" />
          <a
            href="#"
            className="text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            Hỗ trợ
          </a>
          <a
            href="#"
            className="text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            Tài liệu
          </a>
        </div>
      </div>
    </footer>
  );
}
