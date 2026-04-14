import { useState, useEffect, useRef } from "react";
import { Link, useLocation, useNavigate, Outlet } from "react-router-dom";
import {
  LayoutDashboard, Users, FileText, BarChart3, Settings, LogOut,
  Search, User, Bell, Menu, ClipboardList, Moon, Sun, X
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";

const Logo = ({ size = "md" }: { size?: "sm" | "md" | "lg" }) => {
  const sizeClasses = {
    sm: "w-7 h-7",
    md: "w-8 h-8",
    lg: "w-10 h-10"
  };
  return (
    <img 
      src="/Tocomply360.png" 
      alt="TOK NOW" 
      className={`${sizeClasses[size]} object-contain site-logo`}
    />
  );
};

const NavItem = ({ to, icon: Icon, label, active }: any) => (
  <Link
    to={to}
    className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all relative ${
      active
        ? "text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30"
        : "text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800"
    }`}
  >
    {active && (
      <div className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 bg-blue-600 dark:bg-blue-400 rounded-full"></div>
    )}
    <Icon size={16} />
    <span>{label}</span>
  </Link>
);

export default function Layout() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);

  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any>(null);
  const [showSearch, setShowSearch] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const searchTimerRef = useRef<any>(null);

  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const userDropdownRef = useRef<HTMLDivElement>(null);
  const [isDarkMode, setIsDarkMode] = useState(false);

  useEffect(() => {
    if (document.documentElement.classList.contains("dark")) {
      setIsDarkMode(true);
    }
  }, []);

  const toggleDarkMode = () => {
    const newMode = !isDarkMode;
    setIsDarkMode(newMode);
    document.documentElement.classList.toggle("dark", newMode);
    localStorage.setItem("darkMode", String(newMode));
  };

  useEffect(() => {
    const savedMode = localStorage.getItem("darkMode");
    if (savedMode === "true") {
      setIsDarkMode(true);
      document.documentElement.classList.add("dark");
    }
  }, []);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) setShowNotifications(false);
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) setShowSearch(false);
      if (userDropdownRef.current && !userDropdownRef.current.contains(e.target as Node)) setShowUserDropdown(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleSearch = (q: string) => {
    setSearchQuery(q);
    if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
    if (q.length < 2) {
      setSearchResults(null);
      setShowSearch(false);
      return;
    }
    searchTimerRef.current = setTimeout(() => {
      fetch(`/api/search?q=${encodeURIComponent(q)}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      })
        .then((res) => res.json())
        .then((data) => {
          setSearchResults(data);
          setShowSearch(true);
        })
        .catch(() => {});
    }, 300);
  };

  const markAsRead = async (id: number) => {
    await fetch(`/api/notifications/${id}/read`, {
      method: "POST",
      headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
    });
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, is_read: 1 } : n)));
  };

  const markAllRead = async () => {
    await fetch("/api/notifications/read-all", {
      method: "POST",
      headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
    });
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: 1 })));
  };

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const unreadCount = notifications.filter((n) => !n.is_read).length;
  const closeMobileMenu = () => setMobileMenuOpen(false);

  const navItems = [
    { to: "/", icon: LayoutDashboard, label: "Dashboard" },
    { to: "/entities/suppliers", icon: Users, label: "Fornecedores" },
    { to: "/entities/clients", icon: Users, label: "Clientes" },
    { to: "/processes", icon: FileText, label: "Processos" },
    { to: "/evaluations", icon: ClipboardList, label: "Avaliações" },
    { to: "/reports", icon: BarChart3, label: "Relatórios" },
  ];

  if (user?.role === "Administrator") {
    navItems.push({ to: "/admin", icon: Settings, label: "Configurações" });
  }

  const isActive = (path: string) => path === "/" ? location.pathname === "/" : location.pathname.startsWith(path);

  return (
    <div className="flex flex-col h-screen bg-slate-50 dark:bg-[#0a0f1a]">
      <header className="bg-white dark:bg-[#1f2937] border-b border-gray-200 dark:border-gray-700 sticky top-0 z-50">
        <div className="flex items-center justify-between h-16 px-4 lg:px-6">
          <div className="flex items-center gap-4">
            <button onClick={() => setMobileMenuOpen(true)} className="p-2 text-gray-500 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg lg:hidden">
              <Menu size={20} />
            </button>
            <Link to="/" className="flex items-center gap-2">
              <Logo size="md" />
              <span className="text-lg font-bold text-gray-900 dark:text-white hidden sm:block">TOK NOW</span>
            </Link>
          </div>

          <nav className="hidden lg:flex items-center gap-1">
            {navItems.map((item) => (
              <NavItem
                key={item.to}
                to={item.to}
                icon={item.icon}
                label={item.label}
                active={isActive(item.to)}
              />
            ))}
          </nav>

          <div className="flex items-center gap-2">
            <div ref={searchRef} className="relative hidden md:block">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={14} />
              <input
                type="text"
                placeholder="Pesquisar..."
                className="w-40 lg:w-48 pl-8 pr-3 py-1.5 bg-gray-50 border border-gray-200 rounded-lg text-xs focus:bg-white focus:ring-2 focus:ring-blue-100 focus:border-blue-300 outline-none"
                value={searchQuery}
                onChange={(e) => handleSearch(e.target.value)}
                onFocus={() => searchResults && setShowSearch(true)}
              />

              {showSearch && searchResults && (
                <div className="absolute top-10 left-0 right-0 bg-white rounded-lg shadow-lg border border-gray-200 z-50 overflow-hidden max-h-56 overflow-y-auto">
                  {searchResults.entities?.length === 0 && searchResults.processes?.length === 0 ? (
                    <div className="p-3 text-center text-xs text-gray-400">Nenhum resultado.</div>
                  ) : (
                    <>
                      {searchResults.entities?.length > 0 && (
                        <div>
                          <div className="px-3 py-1.5 text-xs font-medium text-gray-400 bg-gray-50 uppercase">Entidades</div>
                          {searchResults.entities.map((e: any) => (
                            <button key={`e-${e.id}`} onClick={() => { navigate(`/entities/${e.id}`); setShowSearch(false); setSearchQuery(""); }} className="w-full flex items-center gap-2 px-3 py-2 hover:bg-gray-50 text-left">
                              <div className="w-6 h-6 rounded bg-blue-100 text-blue-600 flex items-center justify-center text-xs font-medium">{e.name?.charAt(0)}</div>
                              <div className="flex-1 min-w-0"><p className="text-xs text-gray-900 truncate">{e.name}</p></div>
                            </button>
                          ))}
                        </div>
                      )}
                      {searchResults.processes?.length > 0 && (
                        <div>
                          <div className="px-3 py-1.5 text-xs font-medium text-gray-400 bg-gray-50 uppercase">Processos</div>
                          {searchResults.processes.map((p: any) => (
                            <button key={`p-${p.id}`} onClick={() => { navigate(`/processes/${p.id}`); setShowSearch(false); setSearchQuery(""); }} className="w-full flex items-center gap-2 px-3 py-2 hover:bg-gray-50 text-left">
                              <div className="w-6 h-6 rounded bg-gray-100 text-gray-600 flex items-center justify-center"><FileText size={12} /></div>
                              <div className="flex-1 min-w-0"><p className="text-xs text-gray-900 truncate">{p.process_number}</p></div>
                            </button>
                          ))}
                        </div>
                      )}
                    </>
                  )}
                </div>
              )}
            </div>

            <div ref={notifRef} className="relative">
              <button onClick={() => setShowNotifications(!showNotifications)} className="relative p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg">
                <Bell size={18} />
                {unreadCount > 0 && <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-red-500 border-2 border-white rounded-full"></span>}
              </button>

              {showNotifications && (
                <div className="absolute right-0 top-12 w-72 bg-white rounded-lg shadow-xl border border-gray-200 z-50 overflow-hidden">
                  <div className="flex justify-between items-center px-3 py-2 bg-gray-50 border-b">
                    <h4 className="text-xs font-semibold text-gray-900">Notificações</h4>
                    {unreadCount > 0 && <button onClick={markAllRead} className="text-xs text-blue-600 hover:text-blue-700">Marcar lidas</button>}
                  </div>
                  <div className="max-h-64 overflow-y-auto">
                    {notifications.length === 0 ? (
                      <div className="p-4 text-center text-xs text-gray-400">Sem notificações.</div>
                    ) : (
                      notifications.slice(0, 10).map((n) => (
                        <button key={n.id} onClick={() => markAsRead(n.id)} className={`w-full text-left px-3 py-2 border-b border-gray-50 hover:bg-gray-50 ${!n.is_read ? "bg-blue-50/50" : ""}`}>
                          <p className={`text-xs ${!n.is_read ? "font-medium" : "text-gray-600"}`}>{n.message}</p>
                          <p className="text-[10px] text-gray-400 mt-1">{new Date(n.created_at).toLocaleDateString("pt-BR")}</p>
                        </button>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            <div ref={userDropdownRef} className="relative">
              <button onClick={() => setShowUserDropdown(!showUserDropdown)} className="flex items-center gap-2 p-1.5 hover:bg-gray-100 rounded-lg">
                <div className="w-7 h-7 rounded bg-blue-100 flex items-center justify-center text-blue-600">
                  <User size={14} strokeWidth={2.5} />
                </div>
              </button>

              {showUserDropdown && (
                <div className="absolute right-0 top-12 w-48 bg-white rounded-lg shadow-xl border border-gray-200 z-50 overflow-hidden">
                  <div className="p-3 border-b border-gray-100">
                    <p className="text-sm font-semibold text-gray-900">{user?.name}</p>
                    <p className="text-xs text-gray-500">{user?.role}</p>
                  </div>
                  <div className="p-2">
                    <Link to="/profile" onClick={() => setShowUserDropdown(false)} className="flex items-center gap-2 px-2 py-2 hover:bg-gray-50 text-gray-700 rounded text-xs">
                      <User size={14} strokeWidth={2.5} /> Meu Perfil
                    </Link>
                    <button onClick={toggleDarkMode} className="flex items-center gap-2 w-full px-2 py-2 hover:bg-gray-50 text-gray-700 rounded text-xs">
                      {isDarkMode ? <Sun size={14} strokeWidth={2.5} /> : <Moon size={14} strokeWidth={2.5} />} Modo {isDarkMode ? "Claro" : "Escuro"}
                    </button>
                  </div>
                  <div className="p-2 border-t border-gray-100">
                    <button onClick={handleLogout} className="flex items-center gap-2 px-2 py-2 hover:bg-red-50 text-red-600 rounded text-xs w-full">
                      <LogOut size={14} strokeWidth={2.5} /> Sair
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="lg:hidden border-t border-gray-100 dark:border-gray-700 px-2 py-2 overflow-x-auto">
          <div className="flex gap-1">
            {navItems.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                onClick={closeMobileMenu}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-medium whitespace-nowrap relative ${
                  isActive(item.to)
                    ? "text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30"
                    : "text-gray-500 dark:text-gray-400"
                }`}
              >
                {isActive(item.to) && (
                  <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-1 h-1 bg-blue-600 dark:bg-blue-400 rounded-full"></div>
                )}
                <item.icon size={14} />
                {item.label}
              </Link>
            ))}
          </div>
        </div>
      </header>

      {mobileMenuOpen && (
        <div className="fixed inset-0 bg-gray-900/50 z-40 lg:hidden" onClick={closeMobileMenu} />
      )}

      <div className={`fixed inset-y-0 left-0 w-64 bg-white dark:bg-[#1f2937] shadow-xl z-50 transform transition-transform duration-300 lg:hidden ${mobileMenuOpen ? "translate-x-0" : "-translate-x-full"}`}>
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-2">
            <Logo size="md" />
            <span className="font-bold text-gray-900 dark:text-white">TOK NOW</span>
          </div>
          <button onClick={closeMobileMenu} className="p-1 text-gray-400 dark:text-gray-300 hover:text-gray-600 dark:hover:text-gray-200">
            <X size={20} />
          </button>
        </div>
        <nav className="p-4 space-y-1">
          {navItems.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              onClick={closeMobileMenu}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium relative ${
                isActive(item.to)
                  ? "text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30"
                  : "text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
              }`}
            >
              {isActive(item.to) && (
                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 bg-blue-600 dark:bg-blue-400 rounded-full"></div>
              )}
              <item.icon size={18} />
              {item.label}
            </Link>
          ))}
          <button onClick={handleLogout} className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 w-full">
            <LogOut size={18} />
            Sair
          </button>
        </nav>
      </div>

      <main className="flex-1 overflow-y-auto p-4 lg:p-6">
        <Outlet />
      </main>
    </div>
  );
}