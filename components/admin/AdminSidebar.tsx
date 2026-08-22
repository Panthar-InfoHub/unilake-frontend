"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import {
  LayoutDashboard,
  ShoppingCart,
  BookOpen,
  Users,
  Megaphone,
  Star,
  UsersRound,
  MessageSquare,
  Image as ImageIcon,
  LogOut,
  Globe,
  Palette,
} from "lucide-react";
import { useAuth } from "@/app/hooks/useAuth";

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarFooter,
  SidebarHeader,
} from "@/components/ui/sidebar";

const NAV_ITEMS = [
  { label: "Overview", icon: LayoutDashboard, href: "/admin/overview" },
  { label: "Orders", icon: ShoppingCart, href: "/admin/orders" },
  { label: "Comics", icon: BookOpen, href: "/admin/comics" },
  { label: "Countries", icon: Globe, href: "/admin/countries" },
  { label: "Themes", icon: Palette, href: "/admin/themes" },
  { label: "Users", icon: Users, href: "/admin/users" },
  { label: "Announcement Bar", icon: Megaphone, href: "/admin/announcement-bar" },
  { label: "Customer Reviews", icon: Star, href: "/admin/customer-reviews" },
  { label: "Team Members", icon: UsersRound, href: "/admin/team-members" },
  { label: "Feedback", icon: MessageSquare, href: "/admin/feedback" },
  { label: "Hero Slides", icon: ImageIcon, href: "/admin/hero-slides" },
];

export function AdminSidebar() {
  const pathname = usePathname();
  const { logout } = useAuth();

  const handleLogout = async () => {
    try {
      await logout("/");
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <Sidebar collapsible="icon" className="border-r border-[#914A8C]/20 bg-[#F8E7D2]">
      <SidebarHeader className="p-4 border-b border-[#914A8C]/20 flex flex-row items-center gap-2 overflow-hidden">
        <div className="shrink-0 flex items-center justify-center w-8 h-8 rounded-md bg-[#914A8C] text-[#FFD54A]">
          <span className="font-bold">UL</span>
        </div>
        <div className="flex-1 truncate font-bold text-[#914A8C] tracking-wide uppercase">
          Admin Console
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {NAV_ITEMS.map((item) => {
                const isActive = pathname === item.href;
                return (
                  <SidebarMenuItem key={item.label}>
                    <SidebarMenuButton
                      render={<Link href={item.href} />}
                      isActive={isActive}
                      tooltip={item.label}
                      className={`
                        transition-colors hover:bg-[#914A8C]/10 hover:text-[#914A8C]
                        ${isActive ? "bg-[#914A8C] text-white hover:bg-[#914A8C] hover:text-white" : "text-[#914A8C]/70"}
                      `}
                    >
                      <item.icon className="shrink-0" />
                      <span>{item.label}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-4 border-t border-[#914A8C]/20">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              onClick={handleLogout}
              tooltip="Log Out"
              className="text-red-500 hover:bg-red-50 hover:text-red-600 transition-colors cursor-pointer"
            >
              <LogOut className="shrink-0" />
              <span>Log Out</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
