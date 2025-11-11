// app/studio/layout.tsx
"use client";

import * as React from "react";
import { usePathname } from "next/navigation";
import { Sidebar, SidebarContent, SidebarFooter, SidebarHeader, SidebarRail } from "@/components/ui/sidebar";

import { StudioSidebar } from "@/components/studio/sidebar";
import { TeamSwitcher } from "@/components/team-switcher";
import { NavUser } from "@/components/nav-user";

interface StudioLayoutProps {
  children: React.ReactNode;
}

export default function StudioLayout({ children }: StudioLayoutProps) {
  // pathname peut servir à mettre en évidence des items actifs dans la sidebar
  const pathname = usePathname();

  return (
    <div className="flex min-h-screen">
      {/* Sidebar spécifique au studio */}
      <StudioSidebar />

      {/* Contenu principal */}
      <main className="flex-1 p-4">
        {children}
      </main>
    </div>
  );
}
