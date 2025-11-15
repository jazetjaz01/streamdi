"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Home,
  PlaySquare,
  Users,CircleUser,
  type LucideIcon,
  Play,
} from "lucide-react";

import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  useSidebar,
} from "@/components/ui/sidebar";

export function NavIntro() {
  const { isMobile } = useSidebar();
  const pathname = usePathname();

  // 🔗 Liens fixes de navigation
  const links: { name: string; url: string; icon: LucideIcon }[] = [
    { name: "Accueil", url: "/", icon: Home },
    { name: "Reports", url: "/admin/reports", icon: PlaySquare },
    { name: "Abonnements", url: "/account/new-channel", icon: Play },
    { name: "Mon profil", url: "/account/profile", icon: CircleUser },
  ];

  return (
    <SidebarGroup>
      <SidebarGroupLabel>Navigation</SidebarGroupLabel>
      <SidebarMenu>
        {links.map((item) => {
          const isActive =
            pathname === item.url ||
            (item.url !== "/" && pathname.startsWith(item.url));

          return (
            <SidebarMenuItem key={item.name}>
              <SidebarMenuButton
                asChild
                className={`transition-colors ${
                  isActive
                    ? "bg-accent text-accent-foreground"
                    : "text-sidebar-foreground/80 hover:bg-accent/50"
                }`}
              >
                <Link href={item.url}>
                  <item.icon className="w-4 h-4" />
                  <span>{item.name}</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          );
        })}
      </SidebarMenu>
    </SidebarGroup>
  );
}
