import { useEffect, useRef, useState } from "react";
import { Link, Outlet, useLocation, useNavigate } from "react-router-dom";
import {
  BarChart3,
  ClipboardList,
  FileText,
  Globe,
  LayoutDashboard,
  LogOut,
  Menu,
  Moon,
  Settings,
  Sun,
  TriangleAlert,
  User,
  UserPlus,
  Users,
  X,
  ChevronRight,
  Shield,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { useLanguage } from "../../context/LanguageContext";
import AlertsPanel from "./AlertsPanel";

type NavItem = {
  to: string;
  icon: any;
  label: string;
};

const Logo = ({ size = "md" }: { size?: "sm" | "md" | "lg" }) => {
  const sizeClasses = {
    sm: "w-10 h-10",
    md: "w-11 h-11",
    lg: "w-12 h-12",
  };

  return <img src="/TOKNOW.png" alt="TOKNOW" className={`${sizeClasses[size]} site-logo`} />;
};

export default function Layout() {
  const { user, logout } = useAuth();
  const { t, toggleLanguage, language } = useLanguage();
  const location = useLocation();
  const navigate = useNavigate();

  const [isDarkMode, setIsDarkMode] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const userDropdownRef = useRef<HTMLDivElement>(null);

  const navItems: NavItem[] = [
    { to: "/", icon: LayoutDashboard, label: t("menu.dashboard") },
    { to: "/entities/suppliers", icon: Users, label: t("menu.suppliers") },
    { to: "/entities/clients", icon: Users, label: t("menu.clients") },
    { to: "/colaboradores", icon: UserPlus, label: t("menu.employees") },
    { to: "/processos", icon: FileText, label: t("menu.processes") },
    { to: "/avaliacoes", icon: ClipboardList, label: t("menu.evaluations") },
    { to: "/documentos-legais", icon: Shield, label: t("menu.legal") },
    { to: "/relatorios", icon: BarChart3, label: t("menu.reports") },
    { to: "/alertas", icon: TriangleAlert, label: t("menu.alerts") },
  ];

  const userRole = (user?.role || "").toUpperCase();
  if (userRole === "ADMINISTRATOR" || userRole === "ADMIN") {
    navItems.push({ to: "/configuracoes", icon: Settings, label: t("menu.settings") });
  }

  useEffect(() => {
    const savedMode = localStorage.getItem("darkMode");
    if (savedMode === "true") {
      setIsDarkMode(true);
      document.documentElement.classList.add("dark");
    }
  }, []);

  useEffect(() => {
    const handler = (event: MouseEvent) => {
      if (userDropdownRef.current && !userDropdownRef.current.contains(event.target as Node)) {
        setShowUserDropdown(false);
      }
    };

    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

  const isActive = (path: string) => (path === "/" ? location.pathname === "/" : location.pathname.startsWith(path));

  const toggleDarkMode = () => {
    const nextMode = !isDarkMode;
    setIsDarkMode(nextMode);
    document.documentElement.classList.toggle("dark", nextMode);
    localStorage.setItem("darkMode", String(nextMode));
  };

  const handleSidebarToggle = () => {
    if (window.innerWidth < 1024) {
      setMobileMenuOpen((prev) => !prev);
    } else {
      setSidebarCollapsed((prev) => !prev);
    }
  };

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const [avatar, setAvatar] = useState<string | null>(localStorage.getItem("user_avatar"));

  useEffect(() => {
    const handleAvatarUpdate = () => {
      setAvatar(localStorage.getItem("user_avatar"));
    };
    window.addEventListener("avatar_updated", handleAvatarUpdate);
    return () => window.removeEventListener("avatar_updated", handleAvatarUpdate);
  }, []);

  const initials = (user?.name || "U")
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((value) => value[0]?.toUpperCase())
    .join("");

  const renderSidebarItem = (item: NavItem) => {
    const Icon = item.icon;
    const active = isActive(item.to);

    return (
      <Link key={item.to} to={item.to} className={`sidebar-item ${active ? "sidebar-item-active" : ""}`}>
        <span className="sidebar-icon">
          <Icon size={18} />
        </span>
        <span className="sidebar-label">{item.label}</span>
        {active ? <ChevronRight size={16} className="text-blue-600" /> : null}
      </Link>
    );
  };

  return (
    <div className="app-shell">
      <header className="app-topbar">
        <div className="flex items-center gap-3 min-w-0">
<Link to="/" className="app-brand">
  <Logo size="md" />
  <div className="app-brand-copy">
    <span className="app-brand-title">TOKNOW</span>
  </div>
</Link>

          <button onClick={handleSidebarToggle} className="topbar-icon-btn" aria-label="Alternar menu lateral">
            <Menu size={18} />
          </button>
        </div>

        <div className="flex items-center gap-1 sm:gap-2">
          <button 
            onClick={toggleLanguage} 
            className="topbar-icon-btn flex items-center gap-1.5 px-3 w-auto hover:bg-slate-100" 
            aria-label="Idioma / Language"
            title={language === "pt" ? "Switch to English" : "Mudar para Português"}
          >
            <Globe size={18} />
            <span className="text-[0.88rem] font-bold uppercase tracking-wider text-slate-700">{language}</span>
          </button>

          <button onClick={toggleDarkMode} className="topbar-icon-btn" aria-label="Alternar modo escuro">
            {isDarkMode ? <Sun size={18} /> : <Moon size={18} />}
          </button>

          <AlertsPanel />

          <div ref={userDropdownRef} className="relative">
            <button onClick={() => setShowUserDropdown((prev) => !prev)} className="profile-summary">
              <span className="profile-avatar overflow-hidden flex items-center justify-center">
                {avatar ? <img src={avatar} className="w-full h-full object-cover" alt="Avatar" /> : initials || "U"}
              </span>
              <span className="profile-copy hidden sm:flex">
                <span className="profile-name">{user?.name || "Utilizador"}</span>
                <span className="profile-role">{user?.role || "Conta"}</span>
              </span>
            </button>

            {showUserDropdown ? (
              <div className="absolute right-0 top-[calc(100%+0.75rem)] w-60 rounded-[18px] border border-[#d7e3f1] bg-white p-2 shadow-[0_18px_40px_rgba(15,39,70,0.12)]">
                <div className="px-3 py-3 border-b border-slate-100">
                  <p className="text-[1.05rem] font-semibold text-slate-900">{user?.name}</p>
                  <p className="text-[0.95rem] text-slate-500">{user?.role}</p>
                </div>
                <div className="p-2 space-y-1">
                  <Link
                    to="/profile"
                    onClick={() => setShowUserDropdown(false)}
                    className="flex items-center gap-3 rounded-[14px] px-3 py-2.5 text-[1rem] text-slate-700 hover:bg-slate-50"
                  >
                    <User size={16} />
                    {t("menu.profile")}
                  </Link>
                  <button
                    onClick={() => {
                      toggleDarkMode();
                      setShowUserDropdown(false);
                    }}
                    className="flex w-full items-center gap-3 rounded-[14px] px-3 py-2.5 text-[1rem] text-slate-700 hover:bg-slate-50"
                  >
                    {isDarkMode ? <Sun size={16} /> : <Moon size={16} />}
                    {isDarkMode ? t("menu.lightMode") : t("menu.darkMode")}
                  </button>
                </div>
                <div className="border-t border-slate-100 p-2">
                  <button
                    onClick={handleLogout}
                    className="flex w-full items-center gap-3 rounded-[14px] px-3 py-2.5 text-[1rem] text-red-600 hover:bg-red-50"
                  >
                    <LogOut size={16} />
                    {t("menu.logout")}
                  </button>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      </header>

      <div className="app-body">
        {mobileMenuOpen ? (
          <button
            className="fixed inset-0 z-40 bg-slate-900/30 lg:hidden"
            aria-label="Fechar menu"
            onClick={() => setMobileMenuOpen(false)}
          />
        ) : null}

        <aside className={`app-sidebar ${mobileMenuOpen ? "app-sidebar-open" : ""} ${sidebarCollapsed ? "app-sidebar-collapsed" : ""}`}>
          <div className="app-sidebar-inner">
            <nav className="space-y-1">{navItems.map(renderSidebarItem)}</nav>

            <div className="mt-auto pt-3 border-t border-slate-100">
              <button
                onClick={handleLogout}
                className="sidebar-item w-full text-red-600 hover:bg-red-50"
              >
                <span className="sidebar-icon">
                  <LogOut size={18} />
                </span>
                <span className="sidebar-label text-red-600">Terminar Sessão</span>
                <X size={16} className="text-red-400" />
              </button>
            </div>
          </div>
        </aside>

        <main className="app-main">
          <div className="page-wrap">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
