import React from "react";
import { Separator } from "@/components/ui/separator";

export function AdminFooter() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="border-t border-border bg-card">
      <div className="flex flex-col items-center justify-between gap-2 px-6 py-3 sm:flex-row">
        <div className="flex flex-col min-w-0">
          <p className="text-xs font-semibold text-foreground truncate">
            FUJI Learning Management System
          </p>
          <p className="text-[10px] text-muted-foreground truncate mt-0.5">
            &copy; {currentYear} Bản quyền thuộc đội ngũ phát triển.
          </p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex flex-col items-end min-w-0">
            <span className="text-xs font-semibold text-foreground truncate">Phiên bản</span>
            <span className="text-[10px] text-muted-foreground font-mono mt-0.5 truncate">v1.2.4-stable</span>
          </div>
          <Separator orientation="vertical" className="h-6" />
          <div className="flex items-center gap-4">
            <a href="#" className="text-[10px] font-medium text-muted-foreground hover:text-foreground transition-colors">Vận hành</a>
            <a href="#" className="text-[10px] font-medium text-muted-foreground hover:text-foreground transition-colors">Bảo trì</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
