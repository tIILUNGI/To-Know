import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Plus, Search, Filter, Calendar, Trash2, Eye, BarChart3, Users } from "lucide-react";
import { useToast } from "../../context/ToastContext";
import ConfirmModal from "../common/ConfirmModal";

export default function EvaluationList() {
  const [evaluations, setEvaluations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<any>(null);
  const { addToast } = useToast();
  const navigate = useNavigate();

  const fetchEvaluations = () => {
    setLoading(true);
    let url = "/api/evaluations";
    if (filterType) url += `?type=${filterType}`;

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
  }, [filterType]);

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
    return matchesSearch;
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
    <div className="space-y-8 animate-in fade-in duration-500">
      <ConfirmModal
        open={!!deleteTarget}
        title="Eliminar Avaliação"
        message={`Tem certeza que deseja eliminar esta avaliação de ${deleteTarget?.entity_name}? Esta ação não pode ser desfeita.`}
        confirmLabel="Eliminar"
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />

      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-black text-gray-900 tracking-tight">Avaliações</h2>
          <p className="text-gray-500 font-medium mt-1">
            Histórico de avaliações de performance e satisfação.
          </p>
        </div>
        <Link
          to="/evaluations/new"
          className="bg-blue-600 text-white px-6 py-3 rounded-2xl font-black flex items-center gap-2 hover:bg-blue-700 active:scale-95 transition-all shadow-xl shadow-blue-100"
        >
          <Plus size={22} /> Nova Avaliação
        </Link>
      </div>

      <div className="bg-white rounded-[32px] shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-8 border-b border-gray-50 flex flex-wrap gap-6 items-end bg-gray-50/30">
          <div className="flex-1 min-w-[250px] space-y-2">
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">
              Pesquisa
            </label>
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                placeholder="Entidade ou período..."
                className="w-full pl-12 pr-6 py-3.5 bg-white border border-gray-200 rounded-2xl text-sm font-bold focus:ring-4 focus:ring-blue-100 outline-none transition-all"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          <div className="w-52 space-y-2">
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">
              Tipo
            </label>
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="w-full px-4 py-3.5 bg-white border border-gray-200 rounded-2xl text-sm font-bold focus:ring-4 focus:ring-blue-100 outline-none transition-all appearance-none"
            >
              <option value="">Todos</option>
              <option value="Performance">Performance</option>
              <option value="Satisfaction">Satisfação</option>
            </select>
          </div>
        </div>

        {/* Summary cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 p-8 border-b border-gray-50">
          <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-6 rounded-2xl border border-blue-100">
            <div className="text-[10px] font-black text-blue-500 uppercase tracking-widest">Total</div>
            <div className="text-3xl font-black text-blue-700 mt-1">{evaluations.length}</div>
          </div>
          <div className="bg-gradient-to-br from-emerald-50 to-teal-50 p-6 rounded-2xl border border-emerald-100">
            <div className="text-[10px] font-black text-emerald-500 uppercase tracking-widest flex items-center gap-2">
              <BarChart3 size={14} /> Performance
            </div>
            <div className="text-3xl font-black text-emerald-700 mt-1">
              {evaluations.filter((e) => e.type === "Performance").length}
            </div>
          </div>
          <div className="bg-gradient-to-br from-indigo-50 to-purple-50 p-6 rounded-2xl border border-indigo-100">
            <div className="text-[10px] font-black text-indigo-500 uppercase tracking-widest flex items-center gap-2">
              <Users size={14} /> Satisfação
            </div>
            <div className="text-3xl font-black text-indigo-700 mt-1">
              {evaluations.filter((e) => e.type === "Satisfaction").length}
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left min-w-[800px]">
            <thead>
              <tr className="bg-white text-gray-400 text-[10px] uppercase tracking-[0.2em] font-black border-b border-gray-50">
                <th className="px-8 py-6">Data</th>
                <th className="px-8 py-6">Entidade</th>
                <th className="px-8 py-6">Tipo</th>
                <th className="px-8 py-6">Período</th>
                <th className="px-8 py-6">Avaliador</th>
                <th className="px-8 py-6">Score</th>
                <th className="px-8 py-6">Classificação</th>
                <th className="px-8 py-6 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loading ? (
                <tr>
                  <td colSpan={8} className="px-8 py-20 text-center font-black text-gray-300 text-lg uppercase tracking-widest">
                    Carregando...
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-8 py-20 text-center font-black text-gray-300 text-lg uppercase tracking-widest">
                    Nenhuma avaliação encontrada.
                  </td>
                </tr>
              ) : (
                filtered.map((ev) => (
                  <tr key={ev.id} className="hover:bg-blue-50/30 transition-all group">
                    <td className="px-8 py-5 text-sm font-bold text-gray-400">
                      {new Date(ev.created_at).toLocaleDateString("pt-BR")}
                    </td>
                    <td className="px-8 py-5 text-sm font-black text-gray-900 group-hover:text-blue-700 transition-colors">
                      {ev.entity_name}
                    </td>
                    <td className="px-8 py-5">
                      <span
                        className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest ${
                          ev.type === "Performance"
                            ? "bg-emerald-50 text-emerald-600"
                            : "bg-indigo-50 text-indigo-600"
                        }`}
                      >
                        {ev.type}
                      </span>
                    </td>
                    <td className="px-8 py-5 text-sm font-bold text-gray-500">{ev.period || "—"}</td>
                    <td className="px-8 py-5 text-sm font-bold text-gray-500">{ev.evaluator_name}</td>
                    <td className="px-8 py-5">
                      <div className="flex items-center gap-3">
                        <span
                          className={`text-sm font-black ${
                            ev.percentage >= 90
                              ? "text-emerald-600"
                              : ev.percentage >= 75
                              ? "text-blue-600"
                              : ev.percentage >= 60
                              ? "text-amber-600"
                              : "text-red-600"
                          }`}
                        >
                          {Math.round(ev.percentage)}%
                        </span>
                        <div className="w-16 h-1.5 bg-gray-100 rounded-full overflow-hidden hidden lg:block">
                          <div
                            className={`h-full rounded-full ${
                              ev.percentage >= 90
                                ? "bg-emerald-500"
                                : ev.percentage >= 75
                                ? "bg-blue-500"
                                : ev.percentage >= 60
                                ? "bg-amber-500"
                                : "bg-red-500"
                            }`}
                            style={{ width: `${ev.percentage}%` }}
                          ></div>
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-5">
                      <span className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest ${getClassColor(ev.classification)}`}>
                        {ev.classification}
                      </span>
                    </td>
                    <td className="px-8 py-5 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => setDeleteTarget(ev)}
                          className="inline-flex items-center justify-center w-9 h-9 bg-white border border-gray-100 rounded-xl text-gray-400 hover:text-red-600 hover:border-red-200 transition-all"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
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
