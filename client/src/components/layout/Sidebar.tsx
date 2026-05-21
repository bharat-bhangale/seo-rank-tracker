import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuthStore } from "@/stores/authStore";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Search,
  BarChart3,
  Globe,
  Link2,
  FileText,
  Settings,
  LogOut,
  ChevronLeft,
  Menu,
  TrendingUp,
  Sparkles,
  Swords,
  Bug,
} from "lucide-react";

const navSections = [
  {
    label: "Overview",
    items: [
      { label: "Dashboard", path: "/dashboard", icon: LayoutDashboard },
      { label: "SEO Analyzer", path: "/analyzer", icon: Search },
    ],
  },
  {
    label: "Tracking",
    items: [
      { label: "Keywords", path: "/keywords", icon: TrendingUp },
      { label: "Rankings", path: "/rankings", icon: BarChart3 },
      { label: "Websites", path: "/websites", icon: Globe },
      { label: "Backlinks", path: "/backlinks", icon: Link2 },
    ],
  },
  {
    label: "AI Tools",
    items: [
      { label: "Content Studio", path: "/content", icon: Sparkles },
      { label: "Competitors", path: "/competitors", icon: Swords },
      { label: "AI Reports", path: "/reports", icon: FileText },
    ],
  },
  {
    label: "Technical",
    items: [
      { label: "Site Crawler", path: "/crawler", icon: Bug },
    ],
  },
];

/**
 * Main sidebar navigation component with collapse functionality.
 * Organized into logical sections with dividers.
 */
export function Sidebar() {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  return (
    <>
      {/* Mobile overlay */}
      <button
        className="fixed top-4 left-4 z-50 p-2 rounded-lg bg-white shadow-md lg:hidden"
        onClick={() => setIsCollapsed(!isCollapsed)}
        aria-label="Toggle sidebar"
      >
        <Menu className="h-5 w-5" />
      </button>

      <aside
        className={cn(
          "fixed left-0 top-0 z-40 h-screen bg-white border-r border-surface-200 flex flex-col transition-all duration-300 ease-in-out",
          isCollapsed ? "w-[72px]" : "w-[260px]",
          "max-lg:translate-x-[-100%] lg:translate-x-0",
          !isCollapsed && "max-lg:translate-x-0"
        )}
      >
        {/* Logo */}
        <div className="flex items-center gap-3 px-4 h-16 border-b border-surface-200">
          <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-primary-600 text-white font-bold text-sm shrink-0">
            SR
          </div>
          {!isCollapsed && (
            <span className="font-semibold text-surface-900 text-sm whitespace-nowrap">
              SEO Rank Tracker
            </span>
          )}
        </div>

        {/* Navigation */}
        <nav className="flex-1 py-4 px-3 overflow-y-auto">
          {navSections.map((section, sIdx) => (
            <div key={section.label}>
              {!isCollapsed && (
                <p className="text-[10px] font-semibold text-surface-400 uppercase tracking-wider px-3 mb-1 mt-3">
                  {section.label}
                </p>
              )}
              {isCollapsed && sIdx > 0 && (
                <div className="border-t border-surface-100 my-2 mx-2" />
              )}
              <div className="space-y-0.5">
                {section.items.map((item) => {
                  const isActive =
                    location.pathname === item.path ||
                    (item.path !== "/dashboard" && location.pathname.startsWith(item.path));
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.path}
                      to={item.path}
                      className={cn(
                        "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                        isActive
                          ? "bg-primary-50 text-primary-700"
                          : "text-surface-700 hover:bg-surface-100 hover:text-surface-900"
                      )}
                      title={isCollapsed ? item.label : undefined}
                    >
                      <Icon className="h-5 w-5 shrink-0" />
                      {!isCollapsed && <span>{item.label}</span>}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        {/* Footer */}
        <div className="border-t border-surface-200 p-3 space-y-2">
          {/* Settings link */}
          <Link
            to="/settings"
            className={cn(
              "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
              location.pathname === "/settings"
                ? "bg-primary-50 text-primary-700"
                : "text-surface-700 hover:bg-surface-100"
            )}
            title={isCollapsed ? "Settings" : undefined}
          >
            <Settings className="h-5 w-5 shrink-0" />
            {!isCollapsed && <span>Settings</span>}
          </Link>

          {/* User info */}
          {!isCollapsed && user && (
            <div className="flex items-center gap-3 px-3 py-2">
              <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary-100 text-primary-700 text-xs font-semibold">
                {user.name.charAt(0).toUpperCase()}
              </div>
              <div className="min-w-0">
                <p className="text-sm font-medium text-surface-900 truncate">
                  {user.name}
                </p>
                <p className="text-xs text-surface-500 truncate">
                  {user.subscription.plan} plan
                </p>
              </div>
            </div>
          )}

          {/* Collapse toggle */}
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="hidden lg:flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-surface-700 hover:bg-surface-100 w-full transition-colors"
          >
            <ChevronLeft
              className={cn(
                "h-5 w-5 shrink-0 transition-transform",
                isCollapsed && "rotate-180"
              )}
            />
            {!isCollapsed && <span>Collapse</span>}
          </button>

          {/* Logout */}
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-danger-500 hover:bg-red-50 w-full transition-colors"
          >
            <LogOut className="h-5 w-5 shrink-0" />
            {!isCollapsed && <span>Logout</span>}
          </button>
        </div>
      </aside>
    </>
  );
}
