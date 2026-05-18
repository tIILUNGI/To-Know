import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  AlertCircle,
  CheckCircle2,
  Clock,
  FileText,
  Lock,
  Plus,
  Send,
  ShieldCheck,
  Trash2,
  TrendingUp,
  XCircle,
} from "lucide-react";
import { useToast } from "../../context/ToastContext";
import ConfirmModal from "../common/ConfirmModal";
import PageHeader from "../common/PageHeader";

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
      case "Aprovado":
        return <CheckCircle2 className="text-emerald-500" size={18} />;
      case "Aprovado com restrições":
        return <AlertCircle className="text-orange-500" size={18} />;
      case "Reprovado":
        return <XCircle className="text-red-500" size={18} />;
      case "Rascunho":
        return <Clock className="text-slate-400" size={18} />;
      case "Pendente":
        return <Clock className="text-amber-500" size={18} />;
      case "Em análise":
        return <AlertCircle className="text-blue-500" size={18} />;
      case "Em aprovação":
        return <ShieldCheck className="text-amber-500" size={18} />;
      case "Submetido":
        return <Send className="text-indigo-500" size={18} />;
      case "Encerrado":
        return <Lock className="text-slate-500" size={18} />;
      default:
        return <AlertCircle className="text-slate-400" size={18} />;
    }
  };

  const getStatusBadge = (status: string) => {
    const map: Record<string, string> = {
      Rascunho: "bg-slate-100 text-slate-600",
      Pendente: "bg-amber-50 text-amber-700",
      "Em análise": "bg-blue-50 text-blue-700",
      Submetido: "bg-indigo-50 text-indigo-700",
      "Em aprovação": "bg-amber-50 text-amber-700",
      Aprovado: "bg-emerald-50 text-emerald-700",
      "Aprovado com restrições": "bg-orange-50 text-orange-700",
      Reprovado: "bg-red-50 text-red-700",
      Encerrado: "bg-slate-100 text-slate-600",
    };
    return map[status] || "bg-slate-100 text-slate-600";
  };

  const filteredProcesses = filterStatus ? processes.filter((process) => process.status === filterStatus) : processes;
  const statuses: string[] = Array.from(new Set(processes.map((process) => String(process.status)).filter(Boolean)));

  const approvedCount = processes.filter((process) => process.status === "Aprovado").length;
  const pendingCount = processes.filter((process) => process.status === "Pendente").length;
  const analysisCount = processes.filter((process) => process.status === "Em análise").length;
  const rejectedCount = processes.filter((process) => process.status === "Reprovado").length;

  return (
    <div className="space-y-6">
      <ConfirmModal
        open={!!deleteTarget}
        title="Eliminar Processo"
        message={`Tem certeza que deseja eliminar o processo ${deleteTarget?.process_number}? Esta ação não pode ser desfeita.`}
        confirmLabel="Eliminar"
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />

<PageHeader
         title="Processos"
         actions={
           <>
             <Link to="/processos/novo?type=approval&entity=Supplier" className="btn btn-primary">
               <Plus size={16} />
               Aprovar Fornecedor
             </Link>
             <Link to="/processos/novo?type=approval&entity=Client" className="btn btn-secondary">
               <Plus size={16} />
               Aprovar Cliente
             </Link>
<Link to="/processos/novo?type=approval&entity=Employee" className="btn btn-secondary">
                <Plus size={16} />
                Aprovar Colaborador
              </Link>
              <Link to="/processos/novo?type=rescission" className="btn btn-secondary">
                <XCircle size={16} />
                Rescisão de Contrato
              </Link>
           </>
         }
       />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <div className="metric-card">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <p className="metric-label">Total de Processos</p>
              <p className="metric-value">{processes.length}</p>
              <p className="metric-note">Registos operacionais carregados</p>
            </div>
            <div className="module-icon shrink-0">
              <FileText size={19} />
            </div>
          </div>
        </div>
        <div className="metric-card">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <p className="metric-label">Pendentes</p>
              <p className="metric-value">{pendingCount}</p>
              <p className="metric-note">Processos que aguardam decisão</p>
            </div>
            <div className="module-icon shrink-0 text-amber-600 bg-amber-50">
              <Clock size={19} />
            </div>
          </div>
        </div>
        <div className="metric-card">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <p className="metric-label">Em Análise</p>
              <p className="metric-value">{analysisCount}</p>
              <p className="metric-note">Itens em validação interna</p>
            </div>
            <div className="module-icon shrink-0 text-blue-600 bg-blue-50">
              <AlertCircle size={19} />
            </div>
          </div>
        </div>
        <div className="metric-card">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <p className="metric-label">Aprovados</p>
              <p className="metric-value">{approvedCount}</p>
              <p className="metric-note">Fluxos concluídos com aceite</p>
            </div>
            <div className="module-icon shrink-0 text-emerald-600 bg-emerald-50">
              <CheckCircle2 size={19} />
            </div>
          </div>
        </div>
      </div>

      <div className="toolbar-card space-y-4">
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setFilterStatus("")}
            className={`badge ${filterStatus === "" ? "bg-blue-50 text-blue-700" : "badge-neutral"} px-3 py-2`}
          >
            Todos
          </button>
          {statuses.map((status) => (
            <button
              key={status}
              onClick={() => setFilterStatus((current) => (current === status ? "" : status))}
              className={`badge px-3 py-2 ${filterStatus === status ? getStatusBadge(status) : "badge-neutral"}`}
            >
              {status}
            </button>
          ))}
          {rejectedCount > 0 ? <span className="badge badge-danger px-3 py-2">Reprovados: {rejectedCount}</span> : null}
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {loading ? (
            <div className="empty-state col-span-full min-h-[260px]">
              <div className="w-10 h-10 rounded-full border-4 border-blue-100 border-t-blue-600 animate-spin" />
              <p className="text-[1.05rem] font-medium text-slate-500">A carregar processos...</p>
            </div>
          ) : filteredProcesses.length === 0 ? (
            <div className="empty-state col-span-full min-h-[260px]">
              <div className="empty-state-icon">
                <FileText size={28} />
              </div>
              <p className="text-[1.2rem] font-semibold text-slate-800">Nenhum processo encontrado</p>
              <p>Ajuste o estado selecionado ou crie um novo fluxo para iniciar o acompanhamento.</p>
            </div>
          ) : (
            filteredProcesses.map((process) => (
              <div key={process.id} className="module-card min-h-0">
                <div className="flex items-start justify-between gap-4">
                  <div className="space-y-2">
                    <span className="badge bg-blue-50 text-blue-700">{process.process_number}</span>
                    <h3 className="module-title text-[1.45rem]">{process.entity_name || process.employee_name || "N/A"}</h3>
                    <p className="module-description">
                      {process.type} • Prioridade{" "}
                      <span
                        className={
                          process.priority === "Crítica"
                            ? "text-red-600"
                            : process.priority === "Alta"
                              ? "text-amber-600"
                              : "text-slate-600"
                        }
                      >
                        {process.priority}
                      </span>
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {getStatusIcon(process.status)}
                    <button
                      onClick={() => setDeleteTarget(process)}
                      className="topbar-icon-btn !h-10 !w-10 !rounded-[12px] !text-slate-400 hover:!text-red-600"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between gap-3">
                  <span className={`badge ${getStatusBadge(process.status)}`}>{process.status}</span>
                  <span className="text-[0.95rem] text-slate-500">Por {process.opener_name}</span>
                </div>

                {/* Workflow Progress */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-[0.85rem] font-medium text-slate-500">
                    <span>Progresso do Fluxo</span>
                    <span>{Math.round(((Number(process.current_step) || 1) / 8) * 100)}%</span>
                  </div>
                  <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
                    <div
                      className="h-full rounded-full bg-blue-500 transition-all duration-500"
                      style={{ width: `${((Number(process.current_step) || 1) / 8) * 100}%` }}
                    />
                  </div>
                </div>

                {process.result_percentage != null && !isNaN(Number(process.result_percentage)) ? (
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-[0.85rem] font-medium text-slate-500">
                      <span>Conformidade (Score)</span>
                      <span>{Math.round(Number(process.result_percentage))}%</span>
                    </div>
                    <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          Number(process.result_percentage) >= 75
                            ? "bg-emerald-500"
                            : Number(process.result_percentage) >= 60
                              ? "bg-amber-500"
                              : "bg-red-500"
                        }`}
                        style={{ width: `${Number(process.result_percentage)}%` }}
                      />
                    </div>
                  </div>
                ) : null}

                <div className="mt-auto flex items-center justify-end pt-2">
                  <Link to={`/processos/${process.id}`} className="module-button w-full">
                    Ver Detalhes
                  </Link>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
