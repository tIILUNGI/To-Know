import { useState, useEffect } from "react";
import { TrendingUp, Users, Download, Filter } from "lucide-react";
import { useToast } from "../../context/ToastContext";

export default function ReportsView() {
  const [evaluations, setEvaluations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState("");
  const [filterPeriod, setFilterPeriod] = useState("");
  const { addToast } = useToast();

  useEffect(() => {
    fetch("/api/evaluations", {
      headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
    })
      .then((res) => {
        if (!res.ok) throw new Error();
        return res.json();
      })
      .then((data) => {
        setEvaluations(data);
        setLoading(false);
      })
      .catch(() => {
        addToast("Erro ao carregar relatórios.", "error");
        setLoading(false);
      });
  }, []);

  const periods = [...new Set(evaluations.map((e) => e.period).filter(Boolean))];

  const filteredEvaluations = evaluations.filter((e) => {
    const matchesType = filterType === "" || e.type === filterType;
    const matchesPeriod = filterPeriod === "" || e.period === filterPeriod;
    return matchesType && matchesPeriod;
  });

  const handleExport = () => {
    if (filteredEvaluations.length === 0) {
      addToast("Sem dados para exportar.", "warning");
      return;
    }

    const headers = ["Data", "Entidade", "Tipo", "Período", "Avaliador", "Score (%)", "Classificação", "Ação Recomendada"];
    const rows = filteredEvaluations.map((e) => [
      new Date(e.created_at).toLocaleDateString("pt-BR"),
      `"${e.entity_name}"`,
      e.type,
      e.period || "",
      `"${e.evaluator_name || ""}"`,
      Math.round(e.percentage),
      e.classification || "",
      e.recommended_action || "Manter",
    ]);

    const csvContent = [headers.join(";"), ...rows.map((r) => r.join(";"))].join("\n");
    const BOM = "\uFEFF";
    const blob = new Blob([BOM + csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `toknow_relatorio_${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    addToast("Relatório exportado com sucesso!", "success");
  };

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-3 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
          <span className="text-sm text-gray-500">Carregando...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-5">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div>
          <h1 className="text-lg sm:text-xl font-bold text-gray-900">Relatórios e Histórico</h1>
          <p className="text-xs sm:text-sm text-gray-500 mt-0.5">Ranking consolidado e histórico de avaliações</p>
        </div>
        <button onClick={handleExport} className="btn btn-outline text-sm">
          <Download size={14} strokeWidth={2} /> Exportar
        </button>
      </div>

      <div className="flex flex-wrap gap-2">
        <select value={filterType} onChange={(e) => setFilterType(e.target.value)} className="input text-xs min-w-[100px]">
          <option value="">Todos os tipos</option>
          <option value="Performance">Performance</option>
          <option value="Satisfaction">Satisfação</option>
        </select>
        <select value={filterPeriod} onChange={(e) => setFilterPeriod(e.target.value)} className="input text-xs min-w-[90px]">
          <option value="">Todos os períodos</option>
          {periods.map((p) => (
            <option key={p} value={p}>{p}</option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
        <div className="card p-3 sm:p-4">
          <div className="flex items-center gap-2 mb-3">
            <TrendingUp size={16} className="text-green-600" />
            <h3 className="text-xs sm:text-sm font-semibold text-gray-900">Top Fornecedores</h3>
          </div>
          <div className="space-y-2">
            {evaluations
              .filter((e) => e.type === "Performance")
              .sort((a, b) => b.percentage - a.percentage)
              .slice(0, 5)
              .map((e, idx) => (
                <div key={e.id} className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded bg-gray-100 text-gray-500 text-[10px] font-medium flex items-center justify-center">
                    #{idx + 1}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-gray-900 truncate">{e.entity_name}</p>
                  </div>
                  <span className="text-xs font-bold text-green-600">{Math.round(e.percentage)}%</span>
                </div>
              ))}
            {evaluations.filter((e) => e.type === "Performance").length === 0 && (
              <p className="text-xs text-gray-400 text-center py-3">Sem avaliações</p>
            )}
          </div>
        </div>

        <div className="card p-3 sm:p-4">
          <div className="flex items-center gap-2 mb-3">
            <Users size={16} className="text-indigo-600" />
            <h3 className="text-xs sm:text-sm font-semibold text-gray-900">Satisfação de Clientes</h3>
          </div>
          <div className="space-y-2">
            {evaluations
              .filter((e) => e.type === "Satisfaction")
              .sort((a, b) => b.percentage - a.percentage)
              .slice(0, 5)
              .map((e, idx) => (
                <div key={e.id} className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded bg-gray-100 text-gray-500 text-[10px] font-medium flex items-center justify-center">
                    #{idx + 1}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-gray-900 truncate">{e.entity_name}</p>
                  </div>
                  <span className="text-xs font-bold text-indigo-600">{Math.round(e.percentage)}%</span>
                </div>
              ))}
            {evaluations.filter((e) => e.type === "Satisfaction").length === 0 && (
              <p className="text-xs text-gray-400 text-center py-3">Sem avaliações</p>
            )}
          </div>
        </div>
      </div>

      <div className="card overflow-hidden">
        <div className="p-3 sm:p-4 border-b border-gray-100">
          <h3 className="text-xs sm:text-sm font-semibold text-gray-900">Todas as Avaliações</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-gray-50 text-[10px] sm:text-xs font-medium text-gray-500 uppercase tracking-wider border-b border-gray-100">
                <th className="px-3 sm:px-4 py-2.5">Entidade</th>
                <th className="px-3 sm:px-4 py-2.5">Tipo</th>
                <th className="px-3 sm:px-4 py-2.5 hidden sm:table-cell">Período</th>
                <th className="px-3 sm:px-4 py-2.5">Score</th>
                <th className="px-3 sm:px-4 py-2.5">Classificação</th>
                <th className="px-3 sm:px-4 py-2.5 hidden md:table-cell">Data</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filteredEvaluations.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-3 sm:px-4 py-6 text-center text-gray-400 text-sm">Sem dados</td>
                </tr>
              ) : (
                filteredEvaluations.map((e) => (
                  <tr key={e.id} className="hover:bg-gray-50">
                    <td className="px-3 sm:px-4 py-2.5 text-sm font-medium text-gray-900">{e.entity_name}</td>
                    <td className="px-3 sm:px-4 py-2.5 text-xs sm:text-sm text-gray-600">{e.type}</td>
                    <td className="px-3 sm:px-4 py-2.5 text-xs sm:text-sm text-gray-600 hidden sm:table-cell">{e.period || "-"}</td>
                    <td className="px-3 sm:px-4 py-2.5 text-sm font-semibold text-gray-900">{Math.round(e.percentage)}%</td>
                    <td className="px-3 sm:px-4 py-2.5">
                      <span className={`badge ${e.classification === "Excellent" || e.classification === "Good" ? "badge-success" : e.classification === "Fair" ? "badge-warning" : "badge-danger"}`}>
                        {e.classification || "-"}
                      </span>
                    </td>
                    <td className="px-3 sm:px-4 py-2.5 text-xs sm:text-sm text-gray-500 hidden md:table-cell">{new Date(e.created_at).toLocaleDateString("pt-BR")}</td>
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