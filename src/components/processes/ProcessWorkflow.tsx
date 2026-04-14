import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Plus, CheckCircle2, XCircle, Clock, AlertCircle, Trash2 } from "lucide-react";
import { useToast } from "../../context/ToastContext";
import ConfirmModal from "../common/ConfirmModal";

export default function ProcessWorkflow() {
  const [processes, setProcesses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<any>(null);
  const { addToast } = useToast();

  const fetchProcesses = () => {
    setLoading(true);
    fetch("/api/processes", {
      headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
    })
      .then((res) => {
        if (!res.ok) throw new Error();
        return res.json();
      })
      .then((data) => {
        setProcesses(data);
        setLoading(false);
      })
      .catch(() => {
        addToast("Erro ao carregar processos.", "error");
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchProcesses();
  }, []);

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      const res = await fetch(`/api/processes/${deleteTarget.id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });
      if (res.ok) {
        addToast("Processo eliminado com sucesso.", "success");
        fetchProcesses();
      } else {
        addToast("Erro ao eliminar processo.", "error");
      }
    } catch {
      addToast("Erro de conexão.", "error");
    }
    setDeleteTarget(null);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "Approved": return <CheckCircle2 className="text-green-500" size={18} />;
      case "Rejected": return <XCircle className="text-red-500" size={18} />;
      case "Draft": return <Clock className="text-gray-400" size={18} />;
      default: return <AlertCircle className="text-blue-500" size={18} />;
    }
  };

  const getStatusBadge = (status: string) => {
    const map: any = {
      "Draft": "bg-gray-100 text-gray-600",
      "In Analysis": "bg-blue-100 text-blue-700",
      "In Approval": "bg-amber-100 text-amber-700",
      "Submitted": "bg-indigo-100 text-indigo-700",
      "Approved": "bg-emerald-100 text-emerald-700",
      "Rejected": "bg-red-100 text-red-700",
    };
    return map[status] || "bg-gray-100 text-gray-600";
  };

  const filteredProcesses = filterStatus
    ? processes.filter((p) => p.status === filterStatus)
    : processes;

  const statuses = [...new Set(processes.map((p) => p.status))];

  return (
    <div className="space-y-6 lg:space-y-8 animate-in fade-in duration-500">
      <ConfirmModal
        open={!!deleteTarget}
        title="Eliminar Processo"
        message={`Tem certeza que deseja eliminar o processo ${deleteTarget?.process_number}? Esta ação não pode ser desfeita.`}
        confirmLabel="Eliminar"
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />

      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
        <div>
          <h2 className="text-2xl lg:text-3xl font-black text-gray-900 tracking-tight">Processos de Aprovação</h2>
          <p className="text-gray-500 font-medium text-sm mt-1">
            Acompanhe o fluxo de aprovação e avaliação de parceiros.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-4 py-3 bg-white border border-gray-200 rounded-2xl text-sm font-bold focus:ring-4 focus:ring-blue-100 outline-none appearance-none"
          >
            <option value="">Todos os Status</option>
            {statuses.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Stats bar */}
      <div className="flex flex-wrap gap-3">
        {["Draft", "In Analysis", "In Approval", "Approved", "Rejected"].map((s) => {
          const count = processes.filter((p) => p.status === s).length;
          if (count === 0) return null;
          return (
            <button
              key={s}
              onClick={() => setFilterStatus(filterStatus === s ? "" : s)}
              className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${
                filterStatus === s
                  ? getStatusBadge(s) + " ring-2 ring-offset-1 ring-blue-300"
                  : getStatusBadge(s) + " opacity-70 hover:opacity-100"
              }`}
            >
              {s} ({count})
            </button>
          );
        })}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6">
        {loading ? (
          <div className="col-span-full text-center py-12">
            <div className="flex flex-col items-center gap-4">
              <div className="w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
              <span className="text-gray-500 font-bold">Carregando...</span>
            </div>
          </div>
        ) : filteredProcesses.length === 0 ? (
          <div className="col-span-full text-center py-16 text-gray-400 font-black uppercase tracking-widest">
            Nenhum processo encontrado.
          </div>
        ) : (
          filteredProcesses.map((process) => (
            <div
              key={process.id}
              className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 hover:border-blue-200 hover:shadow-lg transition-all group relative"
            >
              {/* Delete button */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setDeleteTarget(process);
                }}
                className="absolute top-4 right-4 p-2 text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all rounded-lg hover:bg-red-50"
              >
                <Trash2 size={16} />
              </button>

              <div className="flex justify-between items-start mb-4 pr-8">
                <span className="text-xs font-bold text-blue-600 px-2 py-1 bg-blue-50 rounded-lg">
                  {process.process_number}
                </span>
                <div className="flex items-center gap-1">
                  {getStatusIcon(process.status)}
                  <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded ${getStatusBadge(process.status)}`}>
                    {process.status}
                  </span>
                </div>
              </div>

              <h4 className="text-lg font-bold text-gray-900 mb-1 group-hover:text-blue-700 transition-colors">
                {process.entity_name}
              </h4>
              <p className="text-sm text-gray-500 mb-4">
                {process.type} • Prioridade{" "}
                <span className={`font-bold ${
                  process.priority === "Critical" ? "text-red-600" : process.priority === "High" ? "text-amber-600" : "text-gray-600"
                }`}>
                  {process.priority}
                </span>
              </p>

              {process.result_percentage !== null && (
                <div className="mb-4">
                  <div className="flex justify-between text-xs font-bold mb-1">
                    <span>Score Final</span>
                    <span>{Math.round(process.result_percentage)}%</span>
                  </div>
                  <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-700 ${
                        process.result_percentage >= 75 ? "bg-green-500" : process.result_percentage >= 60 ? "bg-amber-500" : "bg-red-500"
                      }`}
                      style={{ width: `${process.result_percentage}%` }}
                    ></div>
                  </div>
                </div>
              )}

              <div className="flex justify-between items-center pt-4 border-t border-gray-50">
                <span className="text-xs text-gray-400">Aberto por {process.opener_name}</span>
                <Link
                  to={`/processes/${process.id}`}
                  className="text-sm font-bold text-blue-600 hover:underline"
                >
                  Ver Detalhes
                </Link>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
