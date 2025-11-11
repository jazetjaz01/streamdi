// app/components/sidebar-wrapper.tsx
"use client";

import { usePathname } from "next/navigation";
import { AppSidebar } from "@/components/app-sidebar";
import { AppSidebar as StudioSidebar } from "@/components/studio/sidebar";

export function SidebarWrapper() {
  const pathname = usePathname();
  const isStudio = pathname.startsWith("/studio");

  return isStudio ? <StudioSidebar /> : <AppSidebar />;
}
