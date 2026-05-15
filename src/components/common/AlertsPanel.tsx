import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { AlertCircle, AlertTriangle, Bell, CheckCircle, Info, X } from "lucide-react";
import { useToast } from "../../context/ToastContext";

type Alert = {
  id: number;
  type: string;
  priority: string;
  message: string;
  is_read: number;
  created_at: string;
};

const priorityConfig: Record<string, { color: string; bg: string; icon: any }> = {
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
  Evaluation: "Avaliação 360°",
};

export default function AlertsPanel() {
  const { addToast } = useToast();
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [isOpen, setIsOpen] = useState(false);

  const fetchAlerts = () => {
    setLoading(true);
    fetch("/api/notifications", {
      headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
    })
      .then((res) => {
        if (!res.ok) throw new Error("API error");
        return res.json();
      })
      .then((data: Alert[]) => {
        setAlerts(data);
        setUnreadCount(data.filter((notification) => !notification.is_read).length);
        setLoading(false);
      })
      .catch(() => {
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
      await fetch(`/api/notifications/${id}/read`, {
        method: "POST",
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });
      setAlerts((prev) => prev.filter((alert) => alert.id !== id));
      setUnreadCount((prev) => Math.max(0, prev - 1));
      addToast("Notificação dispensada.", "success");
    } catch {
      addToast("Erro ao dispensar.", "error");
    }
  };

  const handleDismissAll = async () => {
    try {
      await fetch("/api/notifications/read-all", {
        method: "POST",
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });
      setAlerts([]);
      setUnreadCount(0);
      addToast("Todas dispensadas.", "success");
    } catch {
      addToast("Erro ao dispensar.", "error");
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));

    if (diff < 1) return "Agora";
    if (diff < 24) return `${diff}h atrás`;
    if (diff < 48) return "Ontem";
    return date.toLocaleDateString("pt-PT", { day: "2-digit", month: "short" });
  };

  const criticalCount = alerts.filter((alert) => alert.priority === "Critical").length;
  const warningCount = alerts.filter((alert) => alert.priority === "Warning").length;

  return (
    <div className="relative">
      <button onClick={() => setIsOpen((prev) => !prev)} className="topbar-icon-btn relative">
        <Bell size={18} className={unreadCount > 0 ? "text-amber-600" : "text-slate-600"} />
        {unreadCount > 0 ? (
          <span
            className={`absolute -top-1 -right-1 flex h-5 min-w-5 items-center justify-center rounded-full px-1 text-[10px] font-bold text-white ${
              criticalCount > 0 ? "bg-red-500" : warningCount > 0 ? "bg-amber-500" : "bg-blue-500"
            }`}
          >
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        ) : null}
      </button>

      {isOpen ? (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />

          <div className="absolute right-0 top-full z-50 mt-3 w-[24rem] overflow-hidden rounded-[20px] border border-[#dbe6f3] bg-white shadow-[0_24px_48px_rgba(15,39,70,0.14)]">
            <div className="border-b border-slate-100 bg-slate-50/80 p-4">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <Bell size={18} className="text-slate-600" />
                  <h3 className="text-[1.2rem] font-semibold text-slate-900">Notificações</h3>
                  {unreadCount > 0 ? (
                    <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700">
                      {unreadCount} nova(s)
                    </span>
                  ) : null}
                </div>
                <button onClick={() => setIsOpen(false)} className="topbar-icon-btn !h-8 !w-8 !rounded-[10px]">
                  <X size={14} className="text-slate-400" />
                </button>
              </div>

              {unreadCount > 0 ? (
                <button onClick={handleDismissAll} className="mt-2 text-xs text-slate-500 transition-colors hover:text-red-600">
                  Dispensar todos
                </button>
              ) : null}
            </div>

            <div className="max-h-80 overflow-y-auto">
              {loading ? (
                <div className="p-8 text-center text-sm text-slate-400">Carregando...</div>
              ) : alerts.length === 0 ? (
                <div className="p-8 text-center">
                  <CheckCircle size={32} className="mx-auto mb-2 text-emerald-300" />
                  <p className="text-sm text-slate-500">Nenhuma notificação</p>
                </div>
              ) : (
                alerts.map((alert) => {
                  const config = priorityConfig[alert.priority] || priorityConfig.Info;
                  const Icon = config.icon;
                  return (
                    <div key={alert.id} className={`border-b border-slate-50 p-3 transition-colors hover:bg-slate-50 ${config.bg}`}>
                      <div className="flex items-start gap-2">
                        <Icon size={16} className={`${config.color} mt-0.5 shrink-0`} />
                        <div className="min-w-0 flex-1">
                          <div className="mb-1 flex items-center gap-2">
                            <span className="rounded bg-white px-1.5 py-0.5 text-[10px] font-medium text-slate-600">
                              {typeLabels[alert.type] || alert.type || "Notificação"}
                            </span>
                            <span className="text-[10px] text-slate-400">{formatDate(alert.created_at)}</span>
                          </div>
                          <p className="text-sm leading-tight text-slate-800">{alert.message}</p>
                        </div>
                        <button onClick={() => handleDismiss(alert.id)} className="topbar-icon-btn !h-8 !w-8 !rounded-[10px]">
                          <X size={12} className="text-slate-400" />
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            <div className="border-t border-slate-100 bg-slate-50/80 p-2">
              <div className="flex items-center justify-between text-[10px] text-slate-500">
                <div className="flex items-center gap-3">
                  <span className="flex items-center gap-1">
                    <span className="h-2 w-2 rounded-full bg-red-500" /> {criticalCount} críticos
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="h-2 w-2 rounded-full bg-amber-500" /> {warningCount} avisos
                  </span>
                </div>
                <Link to="/alertas" onClick={() => setIsOpen(false)} className="font-medium text-blue-600 hover:text-blue-700">
                  Ver todas
                </Link>
              </div>
            </div>
          </div>
        </>
      ) : null}
    </div>
  );
}
