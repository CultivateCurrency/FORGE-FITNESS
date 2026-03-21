"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import {
  LayoutDashboard,
  Dumbbell,
  Users,
  Calendar,
  Radio,
  Music,
  ShoppingBag,
  MessageCircle,
  User,
  Settings,
  Trophy,
  LogOut,
  HelpCircle,
  BarChart3,
  FileText,
  Target,
  Activity,
  Search,
  Gift,
  Heart,
  Video,
  Bell,
} from "lucide-react";

interface NavItem {
  label: string;
  href: string;
  icon: React.ElementType;
}

const memberNav: NavItem[] = [
  { label: "Dashboard", href: "/member/dashboard", icon: LayoutDashboard },
  { label: "Workouts", href: "/member/workouts", icon: Dumbbell },
  { label: "Explore", href: "/member/explore", icon: Search },
  { label: "Community", href: "/member/community", icon: Users },
  { label: "Events", href: "/member/events", icon: Calendar },
  { label: "Streaming", href: "/member/streaming", icon: Radio },
  { label: "Music", href: "/member/music", icon: Music },
  { label: "Shop", href: "/member/shop", icon: ShoppingBag },
  { label: "Messages", href: "/member/messages", icon: MessageCircle },
  { label: "Goals", href: "/member/goals", icon: Target },
  { label: "Activity", href: "/member/activity", icon: Activity },
  { label: "Donations", href: "/member/donations", icon: Heart },
  { label: "Referrals", href: "/member/referrals", icon: Gift },
  { label: "Help & Support", href: "/member/support", icon: HelpCircle },
  { label: "Profile", href: "/member/profile", icon: User },
  { label: "Settings", href: "/member/settings", icon: Settings },
];

const coachNav: NavItem[] = [
  { label: "Dashboard", href: "/coach/dashboard", icon: LayoutDashboard },
  { label: "Clients", href: "/coach/clients", icon: Users },
  { label: "Content", href: "/coach/content", icon: Dumbbell },
  { label: "Videos", href: "/coach/videos", icon: Video },
  { label: "Schedule", href: "/coach/schedule", icon: Calendar },
  { label: "Streaming", href: "/coach/streaming", icon: Radio },
  { label: "Earnings", href: "/coach/earnings", icon: Trophy },
  { label: "Messages", href: "/coach/messages", icon: MessageCircle },
  { label: "Donations", href: "/coach/donations", icon: Heart },
  { label: "Notifications", href: "/coach/notifications", icon: Bell },
  { label: "Help & Support", href: "/coach/help", icon: HelpCircle },
  { label: "Settings", href: "/coach/settings", icon: Settings },
];

const adminNav: NavItem[] = [
  { label: "Dashboard", href: "/admin/dashboard", icon: LayoutDashboard },
  { label: "Users", href: "/admin/users", icon: Users },
  { label: "Coaches", href: "/admin/coaches", icon: Dumbbell },
  { label: "Content", href: "/admin/content", icon: Music },
  { label: "Questionnaire", href: "/admin/questionnaire", icon: HelpCircle },
  { label: "Events", href: "/admin/events", icon: Calendar },
  { label: "Commerce", href: "/admin/commerce", icon: ShoppingBag },
  { label: "Subscriptions", href: "/admin/subscriptions", icon: Trophy },
  { label: "Analytics", href: "/admin/analytics", icon: LayoutDashboard },
  { label: "Reports", href: "/admin/reports", icon: BarChart3 },
  { label: "Moderation", href: "/admin/moderation", icon: MessageCircle },
  { label: "CMS", href: "/admin/cms", icon: FileText },
  { label: "Settings", href: "/admin/settings", icon: Settings },
];

interface SidebarProps {
  variant: "member" | "coach" | "admin";
}

export function Sidebar({ variant }: SidebarProps) {
  const pathname = usePathname();
  const navItems =
    variant === "member"
      ? memberNav
      : variant === "coach"
        ? coachNav
        : adminNav;

  return (
    <aside className="fixed left-0 top-0 h-full w-64 bg-zinc-950 border-r border-zinc-800 flex flex-col z-40">
      {/* Logo */}
      <div className="p-6 border-b border-zinc-800">
        <Link href="/" className="flex items-center gap-2">
          <h1 className="text-xl font-black tracking-tight">
            <span className="text-orange-500">GYMTALITY</span>
          </h1>
        </Link>
        <span className="text-xs text-zinc-500 capitalize mt-1 block">
          {variant} Portal
        </span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const isActive = pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                isActive
                  ? "bg-orange-500/10 text-orange-500"
                  : "text-zinc-400 hover:text-white hover:bg-zinc-800/50"
              }`}
            >
              <item.icon size={18} />
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* Logout */}
      <div className="p-4 border-t border-zinc-800">
        <button
          onClick={() => signOut({ callbackUrl: "/login" })}
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-zinc-400 hover:text-red-400 hover:bg-zinc-800/50 w-full transition-colors"
        >
          <LogOut size={18} />
          Log Out
        </button>
      </div>
    </aside>
  );
}
