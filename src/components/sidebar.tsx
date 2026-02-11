"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useTheme } from "next-themes";
import { cn } from "@/lib/cn";
import {
  BarChart3,
  ClipboardEdit,
  Warehouse,
  Package,
  Calculator,
  FileText,
  Settings,
  User,
  Sun,
  Moon,
  RefreshCw,
  LogOut,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";

const navGroups = [
  {
    label: "Yfirlit",
    items: [
      { name: "Sölur", href: "/", icon: BarChart3 },
      { name: "Skrá gögn", href: "/input", icon: ClipboardEdit },
      { name: "Birgðir", href: "/inventory", icon: Warehouse },
    ],
  },
  {
    label: "Greining",
    items: [
      { name: "Áskrift", href: "/askrift", icon: RefreshCw },
      { name: "Vörur", href: "/products", icon: Package },
      { name: "Kostnaður", href: "/cost", icon: Calculator },
      { name: "Skýrslur", href: "/reports", icon: FileText },
    ],
  },
  {
    label: "Kerfi",
    items: [{ name: "Stillingar", href: "/settings", icon: Settings }],
  },
];

export function Sidebar() {
  const pathname = usePathname();
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  useEffect(() => setMounted(true), []);

  const handleLogout = async () => {
    setLoggingOut(true);
    try {
      const supabase = createClient();
      await supabase.auth.signOut();
      toast.success("Útskráning tókst");
      window.location.href = "/login";
    } catch {
      toast.error("Villa við útskráningu");
      setLoggingOut(false);
    }
  };

  return (
    <aside className="fixed inset-y-0 left-0 z-50 flex w-[220px] flex-col border-r border-border bg-surface">
      {/* Logo */}
      <div className="flex h-16 items-center px-5">
        <Image
          src="/logos/happy-hydrate.svg"
          alt="Happy Hydrate"
          width={120}
          height={60}
          className="h-8 w-auto"
          priority
        />
      </div>

      {/* Nav */}
      <nav className="flex-1 space-y-6 px-3 py-4">
        {navGroups.map((group) => (
          <div key={group.label}>
            <p className="mb-2 px-3 text-[10px] font-semibold uppercase tracking-[0.15em] text-text-dim">
              {group.label}
            </p>
            <div className="space-y-0.5">
              {group.items.map((item) => {
                const isActive =
                  item.href === "/"
                    ? pathname === "/"
                    : pathname.startsWith(item.href);

                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={cn(
                      "group relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200",
                      isActive
                        ? "bg-primary-light text-primary"
                        : "text-text-secondary hover:bg-surface-elevated/60 hover:text-foreground"
                    )}
                  >
                    {isActive && (
                      <div className="absolute left-0 top-1/2 -translate-y-1/2 h-5 w-[3px] rounded-r-full bg-primary" />
                    )}
                    <item.icon className="h-4 w-4" />
                    {item.name}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* Theme toggle */}
      <div className="px-4 pb-2">
        {mounted && (
          <button
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-text-secondary transition-all duration-200 hover:bg-surface-elevated/60 hover:text-foreground"
          >
            <div className="relative h-4 w-4">
              <Sun className={cn(
                "absolute inset-0 h-4 w-4 transition-all duration-300",
                theme === "dark" ? "rotate-0 scale-100 opacity-100" : "-rotate-90 scale-0 opacity-0"
              )} />
              <Moon className={cn(
                "absolute inset-0 h-4 w-4 transition-all duration-300",
                theme === "light" ? "rotate-0 scale-100 opacity-100" : "rotate-90 scale-0 opacity-0"
              )} />
            </div>
            {theme === "dark" ? "Ljóst" : "Dökkt"}
          </button>
        )}
      </div>

      {/* User */}
      <div className="border-t border-border p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary-light ring-1 ring-primary-border">
              <User className="h-4 w-4 text-primary" />
            </div>
            <p className="text-sm font-medium text-foreground">Admin</p>
          </div>
          <button
            onClick={handleLogout}
            disabled={loggingOut}
            title="Útskrá"
            className="flex h-8 w-8 items-center justify-center rounded-lg text-text-dim transition-colors hover:bg-danger/10 hover:text-danger"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>
    </aside>
  );
}
