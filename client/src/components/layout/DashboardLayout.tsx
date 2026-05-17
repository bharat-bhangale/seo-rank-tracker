import { Outlet } from "react-router-dom";
import { Sidebar } from "./Sidebar";

/**
 * Main dashboard layout wrapping all authenticated pages.
 * Sidebar on the left, content area on the right.
 */
export function DashboardLayout() {
  return (
    <div className="min-h-screen bg-surface-50">
      <Sidebar />
      <main className="lg:ml-[260px] transition-all duration-300 ease-in-out">
        <div className="p-6 lg:p-8 max-w-7xl mx-auto">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
