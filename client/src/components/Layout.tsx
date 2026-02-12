import { useState } from "react";
import { Outlet } from "react-router-dom";
import Sidebar from "./Sidebar/Sidebar";
import Topbar from "./Topbar/Topbar";
import { Toaster } from "react-hot-toast";

export default function Layout() {
  const [sidebarOpen, setSidebarOpen] = useState<boolean>(
    () => window.innerWidth >= 1024,
  );

  return (
    <div className="flex min-h-screen md:h-screen md:overflow-hidden bg-gray-200">
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 3000,
          style: { background: "#1f2937", color: "#fff", borderRadius: "8px" },
          success: { iconTheme: { primary: "#22c55e", secondary: "#fff" } },
          error: { iconTheme: { primary: "#ef4444", secondary: "#fff" } },
        }}
      />

      {/* Sidebar */}
      <Sidebar open={sidebarOpen} setOpen={setSidebarOpen} />

      {/* Main content */}
      <div className="flex flex-col flex-1 min-w-0 md:overflow-hidden">
        <Topbar onToggleSidebar={() => setSidebarOpen(!sidebarOpen)} />
        <main className="flex-1 md:overflow-y-auto px-2 pb-2 pt-3 md:p-3 lg:p-4">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
