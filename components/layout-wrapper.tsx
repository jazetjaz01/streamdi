// app/components/layout-wrapper.tsx
"use client";
import { usePathname } from "next/navigation";
import { AppSidebar } from "./app-sidebar";
import { StudioSidebar } from "./studio/sidebar";
import { SidebarInset } from "./ui/sidebar";

export function LayoutWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const SidebarComponent = pathname.startsWith("/studio") ? StudioSidebar : AppSidebar;

  return (
    <div className="flex min-h-screen pt-16 w-full">
      <SidebarComponent />
      <SidebarInset className="flex-1 flex flex-col overflow-auto">
        {children}
      </SidebarInset>
    </div>
  );
}
