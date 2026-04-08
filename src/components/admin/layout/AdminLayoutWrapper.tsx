"use client";

import React from "react";
import { AdminSidebar } from "./AdminSidebar";
import { AdminFooter } from "./AdminFooter";

interface AdminLayoutWrapperProps {
  children: React.ReactNode;
}

export function AdminLayoutWrapper({ children }: AdminLayoutWrapperProps) {
  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Sidebar */}
      <AdminSidebar />

      {/* Main Content Area */}
      <div className="flex flex-1 flex-col overflow-hidden bg-slate-50/20">
        {/* Page Header can be placed here if needed */}
        {/* Page Content */}
        <main className="flex-1 overflow-y-auto flex flex-col">
          <div className="flex-1 p-6">{children}</div>
          {/* Footer at bottom of scrollable area spanning full width */}
          <AdminFooter />
        </main>
      </div>
    </div>
  );
}
