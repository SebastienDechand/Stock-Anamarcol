import { useState, useContext } from "react";
import { Outlet } from "react-router-dom";
import Sidebar from "./Sidebar/Sidebar";
import Topbar from "./Topbar/Topbar";
import { Toaster } from "react-hot-toast";
import { UidContext } from "./AppContext";

export default function Layout() {
  const [sidebarOpen, setSidebarOpen] = useState(
    () => window.innerWidth >= 1024,
  );
  const { isAdmin } = useContext(UidContext);

  return (
    <div className="flex h-screen overflow-hidden bg-gray-200">
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
      <Sidebar open={sidebarOpen} setOpen={setSidebarOpen} isAdmin={isAdmin} />

      {/* Main content */}
      <div className="flex flex-col flex-1 overflow-hidden">
        <Topbar onToggleSidebar={() => setSidebarOpen(!sidebarOpen)} />
        <main className="flex-1 overflow-y-auto scroll-smooth px-2 pb-2 pt-0 md:p-3 lg:p-4">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
