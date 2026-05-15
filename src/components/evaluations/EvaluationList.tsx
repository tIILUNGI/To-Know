import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Heart, Mail, Plus, RotateCcw, Trash2, Users, ClipboardList, TrendingUp, Search } from "lucide-react";
import { useToast } from "../../context/ToastContext";
import ConfirmModal from "../common/ConfirmModal";
import PageHeader from "../common/PageHeader";

export default function EvaluationList() {
  const [evaluations, setEvaluations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<any>(null);
  const { addToast } = useToast();

  const fetchEvaluations = () => {
    setLoading(true);
    fetch("/api/evaluations", {
      headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
    })
      .then((res) => res.json())
      .then((data) => {
        setEvaluations(data);
        setLoading(false);
      })
      .catch(() => {
        addToast("Erro ao carregar avaliações.", "error");
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchEvaluations();
  }, []);

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      const res = await fetch(`/api/evaluations/${deleteTarget.id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });
      if (res.ok) {
        addToast("Avaliação eliminada com sucesso.", "success");
        fetchEvaluations();
      } else {
        addToast("Erro ao eliminar avaliação.", "error");
      }
    } catch {
      addToast("Erro de conexão.", "error");
    }
    setDeleteTarget(null);
  };

  const getClassColor = (classification: string) => {
    switch (classification) {
      case "Excelente":
        return "bg-emerald-50 text-emerald-700";
      case "Bom":
        return "bg-blue-50 text-blue-700";
      case "Satisfatório":
        return "bg-amber-50 text-amber-700";
      case "Insatisfatório":
        return "bg-orange-50 text-orange-700";
      case "Crítico":
        return "bg-red-50 text-red-700";
      default:
        return "bg-slate-100 text-slate-600";
    }
  };

  const performanceCount = evaluations.filter((evaluation) => evaluation.evaluation_type === "Performance").length;
  const satisfactionCount = evaluations.filter((evaluation) => evaluation.evaluation_type === "Satisfaction").length;
  const reevaluationCount = evaluations.filter((evaluation) => evaluation.evaluation_type === "Reavaliação").length;

  const filteredEvaluations = evaluations.filter(ev => {
    const term = searchTerm.toLowerCase();
    return (
      ev.evaluation_number?.toLowerCase().includes(term) ||
      ev.name?.toLowerCase().includes(term) ||
      ev.entity_name?.toLowerCase().includes(term) ||
      ev.type?.toLowerCase().includes(term)
    );
  });

  return (
    <div className="space-y-6">
      <ConfirmModal
        open={!!deleteTarget}
        title="Eliminar Avaliação"
        message={`Tem certeza que deseja eliminar esta avaliação de ${deleteTarget?.entity_name}? Esta ação não pode ser desfeita.`}
        confirmLabel="Eliminar"
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />

      <PageHeader
        title="Avaliações"
        actions={
          <Link to="/avaliacoes/nova" className="btn btn-primary">
            <Plus size={16} strokeWidth={2} />
            Nova Avaliação
          </Link>
        }
      />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <div className="metric-card">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <p className="metric-label">Total Registado</p>
              <p className="metric-value">{evaluations.length}</p>
              <p className="metric-note">Todas as avaliações registadas</p>
            </div>
            <div className="module-icon shrink-0">
              <ClipboardList size={19} />
            </div>
          </div>
        </div>
        <div className="metric-card">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <p className="metric-label">Performance</p>
              <p className="metric-value">{performanceCount}</p>
              <p className="metric-note">Avaliações de performance</p>
            </div>
            <div className="module-icon shrink-0 text-emerald-600 bg-emerald-50">
              <TrendingUp size={19} />
            </div>
          </div>
        </div>
        <div className="metric-card">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <p className="metric-label">Satisfação</p>
              <p className="metric-value">{satisfactionCount}</p>
              <p className="metric-note">Avaliações de satisfação</p>
            </div>
            <div className="module-icon shrink-0 text-rose-600 bg-rose-50">
              <Heart size={19} />
            </div>
          </div>
        </div>
        <div className="metric-card">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <p className="metric-label">Reavaliações</p>
              <p className="metric-value">{reevaluationCount}</p>
              <p className="metric-note">Ciclos reabertos para revisão</p>
            </div>
            <div className="module-icon shrink-0 text-blue-600 bg-blue-50">
              <RotateCcw size={19} />
            </div>
          </div>
        </div>
      </div>

      <div className="toolbar-card space-y-4">
        <div>
          <h2 className="text-[1.35rem] font-semibold text-slate-900">Ações rápidas</h2>
          <p className="mt-1 text-[1rem] text-slate-500">Atalhos diretos para os fluxos mais usados da área de avaliações.</p>
        </div>

        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pt-2">
          <div className="flex flex-wrap gap-2">
            <Link to="/avaliacoes/nova" className="btn btn-primary">
              <Plus size={16} strokeWidth={2} />
              Avaliar Fornecedor
            </Link>
            <Link to="/avaliacoes/reevaluation" className="btn btn-secondary">
              <RotateCcw size={16} strokeWidth={2} />
              Reavaliação
            </Link>
            <Link to="/avaliacoes/cliente" className="btn btn-secondary">
              <Users size={16} strokeWidth={2} />
              Avaliar Cliente
            </Link>
          </div>
          <div className="relative w-full sm:w-64">
            <Search className="input-icon" size={16} />
            <input 
              type="text" 
              placeholder="Pesquisar avaliações..." 
              className="input-with-icon w-full"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
        
        <div className="flex flex-wrap gap-2">
          <Link to="/avaliacoes/360" className="btn btn-secondary">
            <Mail size={16} strokeWidth={2} />
            Avaliação 360°
          </Link>
          <Link to="/avaliacoes/nova?type=Satisfaction&entity=Supplier" className="btn btn-outline">
            <Heart size={16} strokeWidth={2} />
            Satisfação Fornecedor
          </Link>
          <Link to="/avaliacoes/cliente?type=Satisfaction" className="btn btn-outline">
            <Heart size={16} strokeWidth={2} />
            Satisfação Cliente
          </Link>
          <Link to="/avaliacoes/cliente/satisfacao" className="btn btn-outline">
            <Mail size={16} strokeWidth={2} />
            Pesquisa Customizada
          </Link>
        </div>
      </div>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr>
                <th>Data</th>
                <th>Código</th>
                <th>Nome da Avaliação</th>
                <th>Entidade</th>
                <th>Tipo</th>
                <th className="hidden sm:table-cell">Periodicidade</th>
                <th>Score</th>
                <th>Classificação</th>
                <th className="text-right">Ações</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={9} className="py-16 text-center text-slate-400">
                    A carregar avaliações...
                  </td>
                </tr>
              ) : filteredEvaluations.length === 0 ? (
                <tr>
                  <td colSpan={9} className="p-0">
                    <div className="empty-state">
                      <div className="empty-state-icon">
                        <Mail size={28} />
                      </div>
                      <p className="text-[1.2rem] font-semibold text-slate-800">Nenhuma avaliação encontrada</p>
                      <p>{searchTerm ? "Tente ajustar o termo de pesquisa." : "Crie a primeira avaliação para começar a alimentar o histórico do sistema."}</p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredEvaluations.map((evaluation) => (
                  <tr key={evaluation.id}>
                    <td className="text-slate-500">{new Date(evaluation.created_at).toLocaleDateString("pt-BR")}</td>
                    <td className="font-semibold text-slate-900">{evaluation.evaluation_number || "-"}</td>
                    <td className="font-semibold text-slate-900">{evaluation.name || "-"}</td>
                    <td className="font-medium text-slate-900">{evaluation.entity_name}</td>
                    <td>
                      <span
                        className={`badge ${
                          evaluation.type === "Performance" ? "bg-emerald-50 text-emerald-700" : "bg-indigo-50 text-indigo-700"
                        }`}
                      >
                        {evaluation.type}
                      </span>
                    </td>
                    <td className="hidden md:table-cell text-slate-500">{evaluation.periodicity || "—"}</td>
                    <td>
                      <span
                        className={`text-[1rem] font-semibold ${
                          evaluation.percentage >= 90
                            ? "text-emerald-600"
                            : evaluation.percentage >= 75
                              ? "text-blue-600"
                              : evaluation.percentage >= 60
                                ? "text-amber-600"
                                : "text-red-600"
                        }`}
                      >
                        {Math.round(evaluation.percentage)}%
                      </span>
                    </td>
                    <td>
                      <span className={`badge ${getClassColor(evaluation.classification)}`}>{evaluation.classification}</span>
                    </td>
                    <td className="text-right">
                      <button
                        onClick={() => setDeleteTarget(evaluation)}
                        className="topbar-icon-btn !h-10 !w-10 !rounded-[12px] !text-slate-400 hover:!text-red-600"
                      >
                        <Trash2 size={15} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
