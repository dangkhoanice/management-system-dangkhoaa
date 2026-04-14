import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { LayoutDashboard, ShoppingCart, Truck, User2, ClipboardList, Users } from "lucide-react";
import type { SafeUser } from "@workspace/api-client-react";

interface NavItem {
  label: string;
  path: string;
  icon: React.ComponentType<{ className?: string }>;
  adminOnly?: boolean;
}

const navItems: NavItem[] = [
  { label: "Bảng điều khiển", path: "/", icon: LayoutDashboard },
  { label: "Đơn hàng", path: "/orders", icon: ShoppingCart },
  { label: "Phương tiện", path: "/vehicles", icon: Truck },
  { label: "Tài xế", path: "/drivers", icon: User2 },
  { label: "Phân công", path: "/assignments", icon: ClipboardList },
  { label: "Người dùng", path: "/users", icon: Users, adminOnly: true },
];

interface AppSidebarProps {
  open: boolean;
  user: SafeUser;
  onLogout: () => void;
}

export function AppSidebar({ open, user }: AppSidebarProps) {
  const [location] = useLocation();

  return (
    <aside
      className={cn(
        "flex flex-col shrink-0 bg-sidebar text-sidebar-foreground border-r border-sidebar-border transition-all duration-300 overflow-hidden",
        open ? "w-56" : "w-0"
      )}
    >
      <div className="flex items-center gap-2 px-4 h-14 border-b border-sidebar-border shrink-0">
        <div className="w-7 h-7 rounded bg-primary flex items-center justify-center shrink-0">
          <Truck className="h-4 w-4 text-primary-foreground" />
        </div>
        <div className="min-w-0">
          <p className="text-xs font-bold text-sidebar-foreground truncate leading-tight">Quản lý</p>
          <p className="text-xs text-sidebar-foreground/60 truncate leading-tight">Vận tải</p>
        </div>
      </div>

      <nav className="flex-1 py-3 px-2 space-y-0.5 overflow-y-auto">
        {navItems.map((item) => {
          if (item.adminOnly && !user.isAdmin) return null;
          const isActive = item.path === "/" ? location === "/" : location.startsWith(item.path);
          const Icon = item.icon;
          return (
            <Link key={item.path} href={item.path}>
              <a
                data-testid={`nav-${item.path.replace("/", "") || "dashboard"}`}
                className={cn(
                  "flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors whitespace-nowrap",
                  isActive
                    ? "bg-sidebar-primary text-sidebar-primary-foreground"
                    : "text-sidebar-foreground/75 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                )}
              >
                <Icon className="h-4 w-4 shrink-0" />
                <span className="truncate">{item.label}</span>
              </a>
            </Link>
          );
        })}
      </nav>

      <div className="p-3 border-t border-sidebar-border shrink-0">
        <div className="flex items-center gap-2 px-2 py-1.5">
          <div className="w-7 h-7 rounded-full bg-primary/20 flex items-center justify-center text-primary text-xs font-bold shrink-0">
            {user.username.charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0">
            <p className="text-xs font-semibold text-sidebar-foreground truncate leading-tight">{user.username}</p>
            <p className="text-xs text-sidebar-foreground/50 truncate leading-tight">{user.isAdmin ? "Quản trị viên" : "Nhân viên"}</p>
          </div>
        </div>
      </div>
    </aside>
  );
}
