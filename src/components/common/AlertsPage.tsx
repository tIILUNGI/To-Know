import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Bell, AlertTriangle, Clock, AlertCircle, CheckCircle, Info, Filter, Trash2 } from "lucide-react";
import { useToast } from "../../context/ToastContext";

type Priority = "Critical" | "Warning" | "Info";

const priorityConfig: Record<Priority, { color: string; bg: string; border: string; icon: any }> = {
  Critical: { color: "text-red-600", bg: "bg-red-50", border: "border-red-200", icon: AlertTriangle },
  Warning: { color: "text-amber-600", bg: "bg-amber-50", border: "border-amber-200", icon: AlertCircle },
  Info: { color: "text-blue-600", bg: "bg-blue-50", border: "border-blue-200", icon: Info },
};

const typeLabels: Record<string, { label: string; icon: any; color: string }> = {
  ProcessExpiry: { label: "Expirações", icon: Clock, color: "text-blue-600" },
  EvaluationPending: { label: "Avaliações Pendentes", icon: AlertCircle, color: "text-amber-600" },
  CriticalEntity: { label: "Entidades Críticas", icon: AlertTriangle, color: "text-red-600" },
  ScheduledEvaluation: { label: "Avaliações Programadas", icon: Clock, color: "text-purple-600" },
  Alert: { label: "Alertas", icon: Bell, color: "text-gray-600" },
};

export default function AlertsPage() {
  const { addToast } = useToast();
  const navigate = useNavigate();
  const [alerts, setAlerts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterPriority, setFilterPriority] = useState<string>("all");
  const [filterType, setFilterType] = useState<string>("all");

  const fetchAlerts = () => {
    setLoading(true);
    fetch("/api/alerts/all", {
      headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
    })
      .then((res) => res.json())
      .then((data) => {
        setAlerts(data || []);
        setLoading(false);
      })
      .catch(() => {
        setAlerts([]);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchAlerts();
  }, []);

  const handleDismiss = async (id: number) => {
    try {
      await fetch(`/api/alerts/${id}/dismiss`, {
        method: "POST",
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });
      setAlerts((prev) => prev.filter((a) => a.id !== id));
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
      addToast("Todos os alertas descartados.", "success");
    } catch {
      addToast("Erro ao descartar alertas.", "error");
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleString("pt-PT", {
      day: "2-digit",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const filteredAlerts = alerts.filter((a) => {
    if (filterPriority !== "all" && a.priority !== filterPriority) return false;
    if (filterType !== "all" && a.type !== filterType) return false;
    return true;
  });

  const criticalCount = alerts.filter((a) => a.priority === "Critical").length;
  const warningCount = alerts.filter((a) => a.priority === "Warning").length;
  const infoCount = alerts.filter((a) => a.priority === "Info").length;

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex items-center gap-4">
        <button onClick={() => navigate(-1)} className="p-2 hover:bg-gray-100 rounded-full text-gray-500 transition-colors">
          <ArrowLeft size={20} />
        </button>
        <div>
          <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Bell size={24} className="text-amber-500" />
            Alertas do Sistema
          </h2>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="p-4 bg-red-50 border border-red-200 rounded-2xl text-center">
          <AlertTriangle size={24} className="mx-auto text-red-500 mb-1" />
          <p className="text-2xl font-bold text-red-700">{criticalCount}</p>
          <p className="text-xs text-red-600">Críticos</p>
        </div>
        <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl text-center">
          <AlertCircle size={24} className="mx-auto text-amber-500 mb-1" />
          <p className="text-2xl font-bold text-amber-700">{warningCount}</p>
          <p className="text-xs text-amber-600">Avisos</p>
        </div>
        <div className="p-4 bg-blue-50 border border-blue-200 rounded-2xl text-center">
          <Info size={24} className="mx-auto text-blue-500 mb-1" />
          <p className="text-2xl font-bold text-blue-700">{infoCount}</p>
          <p className="text-xs text-blue-600">Info</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <div className="flex flex-wrap gap-2">
            <select
              value={filterPriority}
              onChange={(e) => setFilterPriority(e.target.value)}
              className="text-xs px-3 py-1.5 border border-gray-200 rounded-lg"
            >
              <option value="all">Todas Prioridades</option>
              <option value="Critical">Crítico</option>
              <option value="Warning">Aviso</option>
              <option value="Info">Info</option>
            </select>
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="text-xs px-3 py-1.5 border border-gray-200 rounded-lg"
            >
              <option value="all">Todos Tipos</option>
              <option value="ProcessExpiry">Expirações</option>
              <option value="EvaluationPending">Avaliações Pendentes</option>
              <option value="CriticalEntity">Entidades Críticas</option>
              <option value="ScheduledEvaluation">Avaliações Programadas</option>
            </select>
          </div>
          {alerts.length > 0 && (
            <button
              onClick={handleDismissAll}
              className="flex items-center gap-1 text-xs px-3 py-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
            >
              <Trash2 size={14} /> Descartar Todos
            </button>
          )}
        </div>

        <div className="space-y-2">
          {loading ? (
            <div className="p-8 text-center text-gray-400">Carregando alertas...</div>
          ) : filteredAlerts.length === 0 ? (
            <div className="p-8 text-center">
              <CheckCircle size={48} className="mx-auto text-green-200 mb-2" />
              <p className="text-gray-500">Nenhum alerta encontrado</p>
            </div>
          ) : (
            filteredAlerts.map((alert) => {
              const config = priorityConfig[alert.priority as Priority] || priorityConfig.Info;
              const typeInfo = typeLabels[alert.type] || { label: alert.type, icon: Bell, color: "text-gray-600" };
              const Icon = config.icon;
              const TypeIcon = typeInfo.icon;
              return (
                <div
                  key={alert.id}
                  className={`p-4 rounded-xl border ${config.bg} ${config.border}`}
                >
                  <div className="flex items-start gap-3">
                    <Icon size={20} className={config.color + " mt-0.5"} />
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`flex items-center gap-1 text-xs font-medium ${typeInfo.color}`}>
                          <TypeIcon size={12} /> {typeInfo.label}
                        </span>
                        <span className="text-[10px] px-1.5 py-0.5 bg-white rounded font-medium text-gray-500">
                          {config.color.includes("red") ? "CRÍTICO" : config.color.includes("amber") ? "AVISO" : "INFO"}
                        </span>
                        <span className="text-[10px] text-gray-400">{formatDate(alert.created_at)}</span>
                      </div>
                      <p className="text-sm text-gray-800">{alert.message}</p>
                    </div>
                    <button
                      onClick={() => handleDismiss(alert.id)}
                      className="p-1.5 hover:bg-white rounded-lg transition-colors"
                    >
                      <Trash2 size={14} className="text-gray-400" />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}