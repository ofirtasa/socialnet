import { useState, useEffect } from "react";
import { useLocalAuth } from "@/contexts/AuthContext";
import { useTheme } from "@/contexts/ThemeContext";
import { trpc } from "@/lib/trpc";
import {
  BarChart3,
  Home,
  LogOut,
  Menu,
  MessageCircle,
  Moon,
  Search,
  Shield,
  Sun,
  Users,
  UserSquare2,
  X,
} from "lucide-react";
import { Link, useLocation } from "wouter";
import { toast } from "sonner";

type LayoutProps = {
  children: React.ReactNode;
};

function ThemeToggle({ compact = false }: { compact?: boolean }) {
  const { theme, toggleTheme } = useTheme();
  if (!toggleTheme) return null;
  return (
    <button
      onClick={toggleTheme}
      className={`flex items-center gap-3 rounded-xl text-sm text-muted-foreground hover:text-foreground hover:bg-secondary transition-all duration-200 ${
        compact ? "p-2 justify-center w-10 h-10" : "px-4 py-2 w-full mb-1"
      }`}
      title={theme === "dark" ? "Light Mode" : "Dark Mode"}
    >
      {theme === "dark" ? <Sun size={16} /> : <Moon size={16} />}
      {!compact && (theme === "dark" ? "Light Mode" : "Dark Mode")}
    </button>
  );
}

export default function Layout({ children }: LayoutProps) {
  const { user, loading, refetch } = useLocalAuth();
  const [location] = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const logoutMutation = trpc.auth.logout.useMutation({
    onSuccess: () => { refetch(); window.location.href = "/"; },
    onError: () => toast.error("Logout failed"),
  });

  // Close sidebar on navigation
  useEffect(() => {
    setSidebarOpen(false);
  }, [location]);

  // Close sidebar on outside click
  useEffect(() => {
    if (!sidebarOpen) return;
    const handler = (e: MouseEvent) => {
      const sidebar = document.getElementById("main-sidebar");
      if (sidebar && !sidebar.contains(e.target as Node)) {
        setSidebarOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [sidebarOpen]);

  const navItems = [
    { href: "/feed", label: "Feed", icon: Home },
    { href: "/groups", label: "Groups", icon: Users },
    { href: "/friends", label: "Friends", icon: UserSquare2 },
    { href: "/chat", label: "Chat", icon: MessageCircle },
    { href: "/search", label: "Search", icon: Search },
    { href: "/stats", label: "Stats", icon: BarChart3 },
  ];

  const isActive = (href: string) => location === href || location.startsWith(href + "/");

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Brand */}
      <div className="p-5 border-b border-border flex items-center justify-between">
        <Link href="/">
          <div className="flex items-center gap-3 cursor-pointer">
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center text-white font-bold text-lg flex-shrink-0"
              style={{ background: "linear-gradient(135deg, oklch(0.55 0.22 264), oklch(0.6 0.2 290))" }}
            >
              S
            </div>
            <span
              className="text-xl font-bold"
              style={{ fontFamily: "'SocialNetDisplay', 'Playfair Display', serif" }}
            >
              SocialNet
            </span>
          </div>
        </Link>
        {/* Close button on mobile */}
        <button
          onClick={() => setSidebarOpen(false)}
          className="lg:hidden p-1.5 rounded-lg hover:bg-secondary transition-colors text-muted-foreground"
        >
          <X size={18} />
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
        {navItems.map(({ href, label, icon: Icon }) => (
          <Link key={href} href={href}>
            <div
              className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium cursor-pointer transition-all duration-200 ${
                isActive(href)
                  ? "text-primary font-semibold"
                  : "text-muted-foreground hover:text-foreground hover:bg-secondary"
              }`}
              style={
                isActive(href)
                  ? { background: "linear-gradient(135deg, oklch(0.55 0.22 264 / 0.12), oklch(0.55 0.22 264 / 0.06))" }
                  : {}
              }
            >
              <Icon size={18} />
              {label}
            </div>
          </Link>
        ))}

        {user?.role === "admin" && (
          <Link href="/admin">
            <div
              className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium cursor-pointer transition-all duration-200 ${
                isActive("/admin")
                  ? "text-primary font-semibold"
                  : "text-muted-foreground hover:text-foreground hover:bg-secondary"
              }`}
            >
              <Shield size={18} />
              Admin Panel
            </div>
          </Link>
        )}
      </nav>

      {/* User Profile + Theme */}
      <div className="p-3 border-t border-border">
        <ThemeToggle />
        {loading ? (
          <div className="px-3 py-2.5 text-xs text-muted-foreground">Checking session...</div>
        ) : user ? (
          <div className="space-y-1">
            <Link href={`/profile/${user.id}`}>
              <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-secondary cursor-pointer transition-all duration-200">
                <img
                  src={user.avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.username}`}
                  alt={user.name || ""}
                  className="sn-avatar flex-shrink-0"
                  style={{ width: 36, height: 36 }}
                  onError={(e) => { e.currentTarget.src = `https://api.dicebear.com/7.x/initials/svg?seed=${user.name || "U"}`; }}
                />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold truncate">{user.name}</p>
                  <p className="text-xs text-muted-foreground truncate">@{user.username}</p>
                </div>
              </div>
            </Link>
            <button
              onClick={() => logoutMutation.mutate()}
              className="w-full flex items-center gap-3 px-4 py-2 rounded-xl text-sm text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-all duration-200"
            >
              <LogOut size={16} />
              Sign Out
            </button>
          </div>
        ) : (
          <div className="space-y-2 px-2">
            <Link href="/login">
              <button className="w-full sn-btn sn-btn-primary text-sm py-2">Sign In</button>
            </Link>
            <Link href="/register">
              <button className="w-full text-sm py-2 rounded-xl border border-border hover:bg-secondary transition-all duration-200">
                Create Account
              </button>
            </Link>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-background flex">
      {/* ── Desktop Sidebar (lg+) ─────────────────────────────────────────── */}
      <aside
        className="hidden lg:flex flex-col fixed left-0 top-0 h-full bg-card border-r border-border z-40"
        style={{ width: 260 }}
      >
        <SidebarContent />
      </aside>

      {/* ── Mobile Sidebar Overlay ────────────────────────────────────────── */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* ── Mobile Sidebar Drawer ─────────────────────────────────────────── */}
      <aside
        id="main-sidebar"
        className={`fixed left-0 top-0 h-full bg-card border-r border-border z-50 flex flex-col lg:hidden transition-transform duration-300 ease-in-out ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
        style={{ width: 280 }}
      >
        <SidebarContent />
      </aside>

      {/* ── Main Content ──────────────────────────────────────────────────── */}
      <main
        className="flex-1 min-h-screen flex flex-col"
        style={{ marginLeft: 0 }}
      >
        {/* Mobile top bar */}
        <header className="lg:hidden sticky top-0 z-30 bg-card/95 backdrop-blur-md border-b border-border px-4 h-14 flex items-center justify-between">
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-2 rounded-xl hover:bg-secondary transition-colors text-foreground"
          >
            <Menu size={20} />
          </button>
          <Link href="/">
            <div className="flex items-center gap-2 cursor-pointer">
              <div
                className="w-7 h-7 rounded-lg flex items-center justify-center text-white font-bold text-sm"
                style={{ background: "linear-gradient(135deg, oklch(0.55 0.22 264), oklch(0.6 0.2 290))" }}
              >
                S
              </div>
              <span
                className="text-base font-bold"
                style={{ fontFamily: "'SocialNetDisplay', 'Playfair Display', serif" }}
              >
                SocialNet
              </span>
            </div>
          </Link>
          <div className="w-9" /> {/* spacer */}
        </header>

        {/* Page content */}
        <div className="flex-1 lg:ml-[260px] pb-20 lg:pb-0">
          {children}
        </div>

        {/* ── Mobile Bottom Navigation ──────────────────────────────────── */}
        <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-30 bg-card/95 backdrop-blur-md border-t border-border safe-area-bottom">
          <div className="flex items-center justify-around px-2 py-2">
            {navItems.slice(0, 5).map(({ href, label, icon: Icon }) => (
              <Link key={href} href={href}>
                <div
                  className={`flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl transition-all duration-200 min-w-[52px] ${
                    isActive(href) ? "text-primary" : "text-muted-foreground"
                  }`}
                >
                  <Icon size={20} strokeWidth={isActive(href) ? 2.5 : 1.8} />
                  <span className="text-[10px] font-medium">{label}</span>
                </div>
              </Link>
            ))}
            {/* More menu — shows user avatar or sign in */}
            {user ? (
              <Link href={`/profile/${user.id}`}>
                <div className={`flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl transition-all duration-200 ${isActive(`/profile/${user.id}`) ? "text-primary" : "text-muted-foreground"}`}>
                  <img
                    src={user.avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.username}`}
                    alt=""
                    className="rounded-full object-cover"
                    style={{ width: 22, height: 22, border: isActive(`/profile/${user.id}`) ? "2px solid oklch(0.55 0.22 264)" : "2px solid transparent" }}
                    onError={(e) => { e.currentTarget.src = `https://api.dicebear.com/7.x/initials/svg?seed=${user.name || "U"}`; }}
                  />
                  <span className="text-[10px] font-medium">Me</span>
                </div>
              </Link>
            ) : (
              <Link href="/login">
                <div className="flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl text-muted-foreground">
                  <div className="w-[22px] h-[22px] rounded-full bg-muted flex items-center justify-center">
                    <UserSquare2 size={14} />
                  </div>
                  <span className="text-[10px] font-medium">Sign In</span>
                </div>
              </Link>
            )}
          </div>
        </nav>
      </main>
    </div>
  );
}
