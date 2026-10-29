import { Outlet } from "react-router-dom";
import { NavLink } from "react-router-dom";
import { LucideMenu, LucideHome, LucideBarChart2, LucidePlusCircle, LucideSettings, LucideInfo } from "lucide-react";
import { motion } from "framer-motion";

const navItems = [
  { to: "/", label: "Home", icon: LucideHome },
  { to: "/dashboard", label: "Dashboard", icon: LucideBarChart2 },
  { to: "/summon", label: "Summon", icon: LucidePlusCircle },
  { to: "/settings", label: "Settings", icon: LucideSettings },
  { to: "/about", label: "About", icon: LucideInfo },
];

export default function Layout() {
  return (
    <div className="flex min-h-screen bg-bg-dark text-text-main font-sans">
      {/* Sidebar */}
      <nav className="w-64 bg-surface border-r border-border p-4 flex flex-col gap-2">
        <div className="flex items-center gap-2 mb-6">
          <LucideMenu className="text-spectral-green" />
          <span className="text-xl font-heading text-spectral-violet">Repo Séance</span>
        </div>
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              `flex items-center gap-2 p-2 rounded transition-colors ${
                isActive ? "bg-elevated text-spectral-green" : "text-text-muted hover:bg-elevated hover:text-spectral-violet"
              }`
            }
          >
            <item.icon className="w-5 h-5" />
            {item.label}
          </NavLink>
        ))}
      </nav>

      {/* Main content */}
      <main className="flex-1 p-6 overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.2 }}
        >
          <Outlet />
        </motion.div>
      </main>
    </div>
  );
}
