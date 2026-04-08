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
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Page Content */}
        <main className="flex-1 overflow-y-auto p-6 flex flex-col">
          <div className="flex-1">{children}</div>
          {/* Footer at bottom of scrollable area */}
          <AdminFooter />
        </main>
      </div>
    </div>
  );
}
