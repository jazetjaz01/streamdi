// components/studio/sidebar.tsx
"use client";

import * as React from "react";
import { usePathname } from "next/navigation";
import { Sidebar, SidebarContent, SidebarFooter, SidebarHeader, SidebarRail } from "@/components/ui/sidebar";
import { NavIntro } from "../nav-intro";
import { NavMain } from "@/components/nav-main";
import { NavProjects } from "@/components/nav-projects";
import { TeamSwitcher } from "@/components/team-switcher";
import { NavUser } from "@/components/nav-user";
import { SidebarOpen } from "../sidebar-open";
import { GalleryVerticalEnd, AudioWaveform, Command, Bot, SquareTerminal, BookOpen, Settings2, Frame, PieChart, Map } from "lucide-react";

interface SidebarData {
  user: { name: string; email: string; avatar: string };
  teams: { name: string; logo: any; plan: string }[];
  navMain: { title: string; url: string; icon: any; isActive?: boolean; items?: { title: string; url: string }[] }[];
  projects: { name: string; url: string; icon: any }[];
}

const data: SidebarData = {
  user: { name: "shadcn", email: "m@example.com", avatar: "/avatars/shadcn.jpg" },
  teams: [
    { name: "Acme Inc", logo: GalleryVerticalEnd, plan: "Enterprise" },
    { name: "Acme Corp.", logo: AudioWaveform, plan: "Startup" },
    { name: "Evil Corp.", logo: Command, plan: "Free" },
  ],
  navMain: [
    { title: "Studio", url: "/studio/playground", icon: SquareTerminal, items: [{ title: "History", url: "/studio/playground/history" }, { title: "Starred", url: "/studio/playground/starred" }, { title: "Settingsxx", url: "/studio/playground/settings" }] },
    { title: "Models", url: "/studio/models", icon: Bot, items: [{ title: "Genesis", url: "/studio/models/genesis" }, { title: "Explorer", url: "/studio/models/explorer" }, { title: "Quantum", url: "/studio/models/quantum" }] },
    { title: "Documentation", url: "/studio/docs", icon: BookOpen, items: [{ title: "Introduction", url: "/studio/docs/intro" }, { title: "Get Started", url: "/studio/docs/get-started" }, { title: "Tutorials", url: "/studio/docs/tutorials" }, { title: "Changelog", url: "/studio/docs/changelog" }] },
    { title: "Settings", url: "/studio/settings", icon: Settings2, items: [{ title: "General", url: "/studio/settings/general" }, { title: "Team", url: "/studio/settings/team" }, { title: "Billing", url: "/studio/settings/billing" }, { title: "Limits", url: "/studio/settings/limits" }] },
  ],
  projects: [
    { name: "Design Engineering", url: "/studio/projects/design", icon: Frame },
    { name: "Sales & Marketing", url: "/studio/projects/sales", icon: PieChart },
    { name: "Travelxx", url: "/studio/projects/travel", icon: Map },
  ],
};

export function StudioSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const pathname = usePathname();

  // Détecter l’item actif
  const markActive = (items: typeof data.navMain) => {
    return items.map((item) => ({
      ...item,
      isActive: pathname.startsWith(item.url),
      items: item.items?.map((sub) => ({
        ...sub,
        isActive: pathname === sub.url,
      })),
    }));
  };

  const [navItems, setNavItems] = React.useState(markActive(data.navMain));

  // Mettre à jour items actifs quand le pathname change
  React.useEffect(() => {
    setNavItems(markActive(data.navMain));
  }, [pathname]);

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <SidebarOpen />
      </SidebarHeader>

      <SidebarContent>
        <NavIntro />
        <NavMain items={navItems} />
        <NavProjects projects={data.projects} />
      </SidebarContent>

      <SidebarFooter>
        <TeamSwitcher teams={data.teams} />
        <NavUser user={data.user} />
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  );
}
