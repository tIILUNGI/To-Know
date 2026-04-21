import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Bell, X, AlertTriangle, Clock, AlertCircle, CheckCircle, Info, Filter } from "lucide-react";
import { useToast } from "../../context/ToastContext";

type AlertType = "ProcessExpiry" | "EvaluationPending" | "CriticalEntity" | "ScheduledEvaluation" | "Alert";
type Priority = "Critical" | "Warning" | "Info";

const priorityConfig: Record<Priority, { color: string; bg: string; icon: any }> = {
  Critical: { color: "text-red-600", bg: "bg-red-50 border-red-200", icon: AlertTriangle },
  Warning: { color: "text-amber-600", bg: "bg-amber-50 border-amber-200", icon: AlertCircle },
  Info: { color: "text-blue-600", bg: "bg-blue-50 border-blue-200", icon: Info },
};

const typeLabels: Record<string, string> = {
  ProcessExpiry: "Expiração de Processo",
  EvaluationPending: "Avaliação Pendente",
  CriticalEntity: "Entidade Crítica",
  ScheduledEvaluation: "Avaliação Programada",
  Alert: "Alerta",
};

export default function AlertsPanel() {
  const { addToast } = useToast();
  const [alerts, setAlerts] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState<string>("all");
  const [isOpen, setIsOpen] = useState(false);

  const fetchAlerts = () => {
    setLoading(true);
    fetch("/api/alerts", {
      headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
    })
      .then((res) => {
        if (!res.ok) throw new Error("API error");
        return res.json();
      })
      .then((data) => {
        setAlerts(data.alerts || []);
        setUnreadCount(data.unreadCount || 0);
        setLoading(false);
      })
      .catch(() => {
        // Silencioso - não mostrar erro sempre
        setAlerts([]);
        setUnreadCount(0);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchAlerts();
    const interval = setInterval(fetchAlerts, 60000);
    return () => clearInterval(interval);
  }, []);

  const handleDismiss = async (id: number) => {
    try {
      await fetch(`/api/alerts/${id}/dismiss`, {
        method: "POST",
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });
      setAlerts((prev) => prev.filter((a) => a.id !== id));
      setUnreadCount((prev) => Math.max(0, prev - 1));
      addToast("Alerta descartado.", "success");
    } catch {
      addToast("Erro ao descartar alerta.", "error");
    }
  };

  const handleDismissAll = async () => {
    try {
      await fetch("/api/alerts/dismiss-all", {
        method: "POST",
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });
      setAlerts([]);
      setUnreadCount(0);
      addToast("Todos os alertas descartados.", "success");
    } catch {
      addToast("Erro ao descartar alertas.", "error");
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diff = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    if (diff < 1) return "Agora";
    if (diff < 24) return `${diff}h atrás`;
    if (diff < 48) return "Ontem";
    return date.toLocaleDateString("pt-PT", { day: "2-digit", month: "short" });
  };

  const filteredAlerts = filterType === "all" 
    ? alerts 
    : alerts.filter((a) => a.type === filterType);

  const criticalCount = alerts.filter((a) => a.priority === "Critical").length;
  const warningCount = alerts.filter((a) => a.priority === "Warning").length;

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 hover:bg-gray-100 rounded-full transition-colors"
      >
        <Bell size={22} className={unreadCount > 0 ? "text-amber-600" : "text-gray-500"} />
        {unreadCount > 0 && (
          <span className={`absolute -top-1 -right-1 w-5 h-5 text-[10px] font-bold text-white rounded-full flex items-center justify-center ${
            criticalCount > 0 ? "bg-red-500" : warningCount > 0 ? "bg-amber-500" : "bg-blue-500"
          }`}>
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
          <div className="absolute right-0 top-full mt-2 w-96 max-h-[500px] bg-white rounded-2xl shadow-2xl border border-gray-100 z-50 overflow-hidden">
            <div className="p-4 border-b border-gray-100 bg-gray-50">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Bell size={18} className="text-gray-600" />
                  <h3 className="font-bold text-gray-900">Alertas</h3>
                  {unreadCount > 0 && (
                    <span className="text-xs px-2 py-0.5 bg-amber-100 text-amber-700 rounded-full font-medium">
                      {unreadCount} novo(s)
                    </span>
                  )}
                </div>
                <button onClick={() => setIsOpen(false)} className="p-1 hover:bg-gray-200 rounded-lg">
                  <X size={16} className="text-gray-400" />
                </button>
              </div>
              {unreadCount > 0 && (
                <button
                  onClick={handleDismissAll}
                  className="mt-2 text-xs text-gray-500 hover:text-red-600 transition-colors"
                >
                  Descartar todos
                </button>
              )}
            </div>

            <div className="p-2 border-b border-gray-100 flex gap-1 flex-wrap">
              {["all", "ProcessExpiry", "EvaluationPending", "ScheduledEvaluation", "CriticalEntity"].map((type) => (
                <button
                  key={type}
                  onClick={() => setFilterType(type)}
                  className={`text-[10px] px-2 py-1 rounded-full font-medium transition-colors ${
                    filterType === type
                      ? "bg-blue-100 text-blue-700"
                      : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                  }`}
                >
                  {type === "all" ? "Todos" : typeLabels[type] || type}
                </button>
              ))}
            </div>

            <div className="max-h-80 overflow-y-auto">
              {loading ? (
                <div className="p-6 text-center text-gray-400 text-sm">Carregando alertas...</div>
              ) : filteredAlerts.length === 0 ? (
                <div className="p-6 text-center">
                  <CheckCircle size={32} className="mx-auto text-green-300 mb-2" />
                  <p className="text-sm text-gray-500">Nenhum alerta pendente</p>
                </div>
              ) : (
                filteredAlerts.map((alert) => {
                  const config = priorityConfig[alert.priority as Priority] || priorityConfig.Info;
                  const Icon = config.icon;
                  return (
                    <div
                      key={alert.id}
                      className={`p-3 border-b border-gray-50 hover:bg-gray-50 transition-colors ${config.bg}`}
                    >
                      <div className="flex items-start gap-2">
                        <Icon size={16} className={config.color + " mt-0.5 flex-shrink-0"} />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-[10px] px-1.5 py-0.5 bg-white rounded font-medium text-gray-600">
                              {typeLabels[alert.type] || alert.type}
                            </span>
                            <span className="text-[10px] text-gray-400">{formatDate(alert.created_at)}</span>
                          </div>
                          <p className="text-sm text-gray-800 leading-tight">{alert.message}</p>
                        </div>
                        <button
                          onClick={() => handleDismiss(alert.id)}
                          className="p-1 hover:bg-gray-200 rounded-lg flex-shrink-0"
                        >
                          <X size={12} className="text-gray-400" />
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            <div className="p-2 border-t border-gray-100 bg-gray-50">
              <div className="flex items-center justify-between text-[10px] text-gray-500">
                <div className="flex items-center gap-3">
                  <span className="flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-red-500" /> {criticalCount} críticos
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-amber-500" /> {warningCount} avisos
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Link to="/alertas" onClick={() => setIsOpen(false)} className="text-blue-600 hover:text-blue-700 font-medium">
                    Ver todos
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}