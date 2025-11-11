"use client";

import { Menu } from "lucide-react";
import { useSidebar } from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";

export function SidebarOpen() {
  const { toggleSidebar } = useSidebar();

  return (
    
    <div className="pt-1">
      <Button
        variant="ghost"
        size="icon"
        onClick={toggleSidebar}
        className="hover:bg-muted rounded-full"
      >
        <Menu className="h-6 w-6" />
        <span className="sr-only">Toggle sidebar</span>
      </Button>
    </div>
  
  );
}
