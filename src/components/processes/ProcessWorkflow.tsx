import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Plus, CheckCircle2, XCircle, Clock, AlertCircle, Trash2, ShieldCheck, Send, Lock, TrendingUp } from "lucide-react";
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
      case "Aprovado": return <CheckCircle2 className="text-emerald-500" size={18} />;
      case "Aprovado com restrições": return <AlertCircle className="text-orange-500" size={18} />;
      case "Reprovado": return <XCircle className="text-red-500" size={18} />;
      case "Rascunho": return <Clock className="text-gray-400" size={18} />;
      case "Pendente": return <Clock className="text-amber-400" size={18} />;
      case "Em análise": return <AlertCircle className="text-blue-500" size={18} />;
      case "Em aprovação": return <ShieldCheck className="text-amber-500" size={18} />;
      case "Submetido": return <Send className="text-indigo-500" size={18} />;
      case "Encerrado": return <Lock className="text-gray-500" size={18} />;
      default: return <AlertCircle className="text-gray-400" size={18} />;
    }
  };

  const getStatusBadge = (status: string) => {
    const map: any = {
      "Rascunho": "bg-gray-100 text-gray-600",
      "Pendente": "bg-amber-100 text-amber-700",
      "Em análise": "bg-blue-100 text-blue-700",
      "Submetido": "bg-indigo-100 text-indigo-700",
      "Em aprovação": "bg-amber-100 text-amber-700",
      "Aprovado": "bg-emerald-100 text-emerald-700",
      "Aprovado com restrições": "bg-orange-100 text-orange-700",
      "Reprovado": "bg-red-100 text-red-700",
      "Encerrado": "bg-gray-100 text-gray-600",
    };
    return map[status] || "bg-gray-100 text-gray-600";
  };

  const filteredProcesses = filterStatus
    ? processes.filter((p) => p.status === filterStatus)
    : processes;

  const statuses = [...new Set(processes.map((p) => p.status))];

  return (
    <div className="space-y-4 sm:space-y-5 animate-in fade-in duration-500">
      <ConfirmModal
        open={!!deleteTarget}
        title="Eliminar Processo"
        message={`Tem certeza que deseja eliminar o processo ${deleteTarget?.process_number}? Esta ação não pode ser desfeita.`}
        confirmLabel="Eliminar"
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div>
          <h2 className="text-lg sm:text-xl font-bold text-gray-900">Processos</h2>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Link
            to="/processos/novo?type=approval&entity=Supplier"
            className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg flex items-center gap-2 hover:bg-blue-700 transition-colors"
          >
            <Plus size={16} />
            Aprovar Fornecedor
          </Link>
          <Link
            to="/processos/novo?type=approval&entity=Client"
            className="px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg flex items-center gap-2 hover:bg-indigo-700 transition-colors"
          >
            <Plus size={16} />
            Aprovar Cliente
          </Link>
          <Link
            to="/avaliacoes/nova?type=Performance&entity=Supplier"
            className="px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-lg flex items-center gap-2 hover:bg-green-700 transition-colors"
          >
            <TrendingUp size={16} />
            Avaliar Fornecedor
          </Link>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-3 py-2 text-sm bg-white border border-gray-200 rounded-lg font-medium focus:ring-2 focus:ring-blue-100 outline-none"
          >
            <option value="">Todos os Status</option>
            {statuses.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
         </div>
       </div>

         {/* Stats bar */}
        <div className="flex flex-wrap gap-2">
          {["Rascunho", "Em análise", "Pendente", "Submetido", "Em aprovação", "Aprovado", "Aprovado com restrições", "Reprovado", "Encerrado"].map((s) => {
            const count = processes.filter((p) => p.status === s).length;
            if (count === 0) return null;
            return (
              <button
                key={s}
                onClick={() => setFilterStatus(filterStatus === s ? "" : s)}
                className={`px-2.5 py-1.5 rounded-lg text-[10px] sm:text-xs font-medium uppercase tracking-wider transition-all ${
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

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
        {loading ? (
          <div className="col-span-full text-center py-8">
            <div className="flex flex-col items-center gap-3">
              <div className="w-6 h-6 border-3 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
              <span className="text-sm text-gray-500 font-medium">Carregando...</span>
            </div>
          </div>
        ) : filteredProcesses.length === 0 ? (
          <div className="col-span-full text-center py-10 text-gray-400 font-medium text-sm">
            Nenhum processo encontrado.
          </div>
        ) : (
          filteredProcesses.map((process) => (
            <div
              key={process.id}
              className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 hover:border-blue-200 hover:shadow-md transition-all group relative"
            >
              {/* Delete button */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setDeleteTarget(process);
                }}
                className="absolute top-3 right-3 p-1.5 text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all rounded-lg hover:bg-red-50"
              >
                <Trash2 size={14} />
              </button>

              <div className="flex justify-between items-start mb-3 pr-8">
                <span className="text-[10px] sm:text-xs font-medium text-blue-600 px-2 py-0.5 bg-blue-50 rounded">
                  {process.process_number}
                </span>
                <div className="flex items-center gap-1">
                  {getStatusIcon(process.status)}
                </div>
              </div>

              <h4 className="text-sm font-semibold text-gray-900 mb-1 group-hover:text-blue-700 transition-colors line-clamp-1">
                {process.entity_name}
              </h4>
                <p className="text-xs text-gray-500 mb-3">
                  {process.type} • Prioridade{" "}
                  <span className={`font-medium ${
                    process.priority === "Crítica" ? "text-red-600" : process.priority === "Alta" ? "text-amber-600" : "text-gray-600"
                  }`}>
                    {process.priority}
                  </span>
                </p>

              {process.result_percentage !== null && (
                <div className="mb-3">
                  <div className="flex justify-between text-[10px] font-medium mb-1">
                    <span>Score Final</span>
                    <span>{Math.round(process.result_percentage)}%</span>
                  </div>
                  <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        process.result_percentage >= 75 ? "bg-green-500" : process.result_percentage >= 60 ? "bg-amber-500" : "bg-red-500"
                      }`}
                      style={{ width: `${process.result_percentage}%` }}
                    ></div>
                  </div>
                </div>
              )}

              <div className="flex justify-between items-center pt-3 border-t border-gray-50">
                <span className="text-[10px] text-gray-400">Por {process.opener_name}</span>
                <Link
                   to={`/processos/${process.id}`}
                  className="text-xs font-medium text-blue-600 hover:underline"
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
