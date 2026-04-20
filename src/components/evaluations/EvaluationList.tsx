import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Plus, Search, Filter, Calendar, Trash2, Eye, BarChart3, Users, RotateCcw, Heart } from "lucide-react";
import { useToast } from "../../context/ToastContext";
import ConfirmModal from "../common/ConfirmModal";

export default function EvaluationList() {
  const [evaluations, setEvaluations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState("");
  const [filterEvaluationType, setFilterEvaluationType] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<any>(null);
  const { addToast } = useToast();
  const navigate = useNavigate();

  const fetchEvaluations = () => {
    setLoading(true);
    let url = "/api/evaluations";
    const params = [];
    if (filterType) params.push(`type=${filterType}`);
    if (filterEvaluationType) params.push(`evaluation_type=${filterEvaluationType}`);
    if (params.length > 0) url += "?" + params.join("&");
    fetch(url, {
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
  }, [filterType, filterEvaluationType]);

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

  const filtered = evaluations.filter((e) => {
    const matchesSearch =
      searchTerm === "" ||
      e.entity_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      e.period?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = filterType === "" || e.type === filterType;
    const matchesEvalType = filterEvaluationType === "" || e.evaluation_type === filterEvaluationType;
    return matchesSearch && matchesType && matchesEvalType;
  });

  const getClassColor = (cls: string) => {
    switch (cls) {
      case "Excelente": return "bg-emerald-50 text-emerald-700";
      case "Bom": return "bg-blue-50 text-blue-700";
      case "Satisfatório": return "bg-amber-50 text-amber-700";
      case "Insatisfatório": return "bg-orange-50 text-orange-700";
      case "Crítico": return "bg-red-50 text-red-700";
      default: return "bg-gray-50 text-gray-600";
    }
  };

  return (
    <div className="space-y-4 sm:space-y-5 animate-in fade-in duration-500">
      <ConfirmModal
        open={!!deleteTarget}
        title="Eliminar Avaliação"
        message={`Tem certeza que deseja eliminar esta avaliação de ${deleteTarget?.entity_name}? Esta ação não pode ser desfeita.`}
        confirmLabel="Eliminar"
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />

        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
          <div>
            <h2 className="text-lg sm:text-xl font-bold text-gray-900">Avaliações</h2>
            <p className="text-xs sm:text-sm text-gray-500 mt-0.5">
              Histórico de avaliações de performance e satisfação.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Link
              to="/avaliacoes/nova"
              className="btn btn-primary text-sm"
            >
              <Plus size={16} strokeWidth={2} /> Avaliar Fornecedor
            </Link>
            <Link
              to="/avaliacoes/reevaluation"
              className="btn btn-secondary text-sm"
            >
              <RotateCcw size={16} strokeWidth={2} /> Reavaliação
            </Link>
             <Link
               to="/avaliacoes/cliente"
               className="btn btn-secondary text-sm"
             >
               <Users size={16} strokeWidth={2} /> Avaliar Cliente
             </Link>
             <Link
               to="/avaliacoes/nova?type=Satisfaction&entity=Supplier"
               className="btn btn-secondary text-sm"
             >
               <Heart size={16} strokeWidth={2} /> Satisfação Fornecedor
             </Link>
             <Link
               to="/avaliacoes/cliente?type=Satisfaction"
               className="btn btn-secondary text-sm"
             >
               <Heart size={16} strokeWidth={2} /> Satisfação Cliente
             </Link>
           </div>
        </div>

      <div className="card overflow-hidden">
        <div className="p-3 sm:p-4 border-b border-gray-100 flex flex-col sm:flex-row gap-2 sm:gap-3 flex-wrap">
          <div className="flex-1 min-w-[180px] relative">
            <Search className="input-icon" size={16} />
            <input
              type="text"
              placeholder="Pesquisar..."
              className="input-with-icon block w-full text-sm"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="input text-xs min-w-[100px]"
          >
            <option value="">Todos os Tipos</option>
            <option value="Performance">Performance</option>
            <option value="Satisfaction">Satisfação</option>
          </select>
          <select
            value={filterEvaluationType}
            onChange={(e) => setFilterEvaluationType(e.target.value)}
            className="input text-xs min-w-[100px]"
          >
            <option value="">Todas</option>
            <option value="Nova">Nova</option>
            <option value="Reavaliação">Reavaliação</option>
          </select>
        </div>

        {/* Summary cards - grid responsive */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 sm:gap-3 p-3 sm:p-4 border-b border-gray-100">
          <div className="bg-blue-50 p-2 sm:p-3 rounded-lg border border-blue-100">
            <div className="text-[10px] font-medium text-blue-600 uppercase">Total</div>
            <div className="text-lg sm:text-xl font-bold text-blue-700">{evaluations.length}</div>
          </div>
          <div className="bg-emerald-50 p-2 sm:p-3 rounded-lg border border-emerald-100">
            <div className="text-[10px] font-medium text-emerald-600 uppercase">Performance</div>
            <div className="text-lg sm:text-xl font-bold text-emerald-700">
              {evaluations.filter((e) => e.type === "Performance").length}
            </div>
          </div>
          <div className="bg-indigo-50 p-2 sm:p-3 rounded-lg border border-indigo-100">
            <div className="text-[10px] font-medium text-indigo-600 uppercase">Satisfação</div>
            <div className="text-lg sm:text-xl font-bold text-indigo-700">
              {evaluations.filter((e) => e.type === "Satisfaction").length}
            </div>
          </div>
          <div className="bg-amber-50 p-2 sm:p-3 rounded-lg border border-amber-100">
            <div className="text-[10px] font-medium text-amber-600 uppercase">Reavaliações</div>
            <div className="text-lg sm:text-xl font-bold text-amber-700">
              {evaluations.filter((e) => e.evaluation_type === "Reavaliação").length}
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-gray-50 text-[10px] sm:text-xs font-semibold text-gray-500 uppercase tracking-wider border-b border-gray-100">
                <th className="px-3 sm:px-4 py-2.5">Data</th>
                <th className="px-3 sm:px-4 py-2.5">Código</th>
                <th className="px-3 sm:px-4 py-2.5">Nome da Avaliação</th>
                <th className="px-3 sm:px-4 py-2.5">Entidade</th>
                <th className="px-3 sm:px-4 py-2.5">Tipo</th>
                <th className="px-3 sm:px-4 py-2.5 hidden sm:table-cell">Periodicidade</th>
                <th className="px-3 sm:px-4 py-2.5">Score</th>
                <th className="px-3 sm:px-4 py-2.5">Classificação</th>
                <th className="px-3 sm:px-4 py-2.5 text-right">Acções</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loading ? (
                <tr>
                  <td colSpan={8} className="px-3 sm:px-4 py-8 text-center text-gray-400 text-sm">
                    Carregando...
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-3 sm:px-4 py-8 text-center text-gray-400 text-sm">
                    Nenhuma avaliação encontrada.
                  </td>
                </tr>
              ) : (
                filtered.map((ev) => (
                  <tr key={ev.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-3 sm:px-4 py-2.5 text-xs sm:text-sm text-gray-500">
                      {new Date(ev.created_at).toLocaleDateString("pt-BR")}
                    </td>
                    <td className="px-3 sm:px-4 py-2.5 text-sm font-medium text-gray-900">
                      {ev.evaluation_number || "-"}
                    </td>
                    <td className="px-3 sm:px-4 py-2.5 text-sm font-medium text-gray-900">
                      {ev.name || "-"}
                    </td>
                    <td className="px-3 sm:px-4 py-2.5 text-sm font-medium text-gray-900">
                      {ev.entity_name}
                    </td>
                    <td className="px-3 sm:px-4 py-2.5">
                      <span className={`text-[10px] px-2 py-0.5 rounded font-medium ${
                        ev.type === "Performance" ? "bg-emerald-50 text-emerald-600" : "bg-indigo-50 text-indigo-600"
                      }`}>
                        {ev.type}
                      </span>
                    </td>
                    <td className="px-3 sm:px-4 py-2.5 text-xs text-gray-500 hidden md:table-cell">{ev.periodicity || "—"}</td>
                    <td className="px-3 sm:px-4 py-2.5">
                      <span className={`text-sm font-semibold ${
                        ev.percentage >= 90 ? "text-emerald-600" : ev.percentage >= 75 ? "text-blue-600" : ev.percentage >= 60 ? "text-amber-600" : "text-red-600"
                      }`}>
                        {Math.round(ev.percentage)}%
                      </span>
                    </td>
                    <td className="px-3 sm:px-4 py-2.5">
                      <span className={`text-[10px] px-2 py-0.5 rounded font-medium ${getClassColor(ev.classification)}`}>
                        {ev.classification}
                      </span>
                    </td>
                    <td className="px-3 sm:px-4 py-2.5 text-right">
                      <button
                        onClick={() => setDeleteTarget(ev)}
                        className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        <Trash2 size={14} />
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
