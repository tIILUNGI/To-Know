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
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Relatórios</h1>
          <p className="text-sm text-gray-500 mt-1">Ranking consolidado e avaliações por período</p>
        </div>
        <button onClick={handleExport} className="btn btn-outline">
          <Download size={18} strokeWidth={2} /> Exportar CSV
        </button>
      </div>

      <div className="flex gap-4 flex-wrap">
        <select value={filterType} onChange={(e) => setFilterType(e.target.value)} className="input sm:w-48">
          <option value="">Todos os tipos</option>
          <option value="Performance">Performance</option>
          <option value="Satisfaction">Satisfação</option>
        </select>
        <select value={filterPeriod} onChange={(e) => setFilterPeriod(e.target.value)} className="input sm:w-40">
          <option value="">Todos os períodos</option>
          {periods.map((p) => (
            <option key={p} value={p}>{p}</option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="card p-5">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp size={20} className="text-green-600" />
            <h3 className="text-sm font-semibold text-gray-900">Top Fornecedores</h3>
          </div>
          <div className="space-y-3">
            {evaluations
              .filter((e) => e.type === "Performance")
              .sort((a, b) => b.percentage - a.percentage)
              .slice(0, 5)
              .map((e, idx) => (
                <div key={e.id} className="flex items-center gap-3">
                  <span className="w-6 h-6 rounded bg-gray-100 text-gray-600 text-xs font-medium flex items-center justify-center">
                    #{idx + 1}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{e.entity_name}</p>
                    <p className="text-xs text-gray-500">{e.period}</p>
                  </div>
                  <span className="text-sm font-bold text-green-600">{Math.round(e.percentage)}%</span>
                </div>
              ))}
            {evaluations.filter((e) => e.type === "Performance").length === 0 && (
              <p className="text-sm text-gray-400 text-center py-4">Sem avaliações</p>
            )}
          </div>
        </div>

        <div className="card p-5">
          <div className="flex items-center gap-2 mb-4">
            <Users size={20} className="text-indigo-600" />
            <h3 className="text-sm font-semibold text-gray-900">Satisfação de Clientes</h3>
          </div>
          <div className="space-y-3">
            {evaluations
              .filter((e) => e.type === "Satisfaction")
              .sort((a, b) => b.percentage - a.percentage)
              .slice(0, 5)
              .map((e, idx) => (
                <div key={e.id} className="flex items-center gap-3">
                  <span className="w-6 h-6 rounded bg-gray-100 text-gray-600 text-xs font-medium flex items-center justify-center">
                    #{idx + 1}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{e.entity_name}</p>
                    <p className="text-xs text-gray-500">{e.period}</p>
                  </div>
                  <span className="text-sm font-bold text-indigo-600">{Math.round(e.percentage)}%</span>
                </div>
              ))}
            {evaluations.filter((e) => e.type === "Satisfaction").length === 0 && (
              <p className="text-sm text-gray-400 text-center py-4">Sem avaliações</p>
            )}
          </div>
        </div>
      </div>

      <div className="card overflow-hidden">
        <div className="p-4 border-b border-gray-100">
          <h3 className="text-sm font-semibold text-gray-900">Todas as Avaliações</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-gray-50 text-xs font-medium text-gray-500 uppercase tracking-wider border-b border-gray-100">
                <th className="px-4 py-3">Entidade</th>
                <th className="px-4 py-3">Tipo</th>
                <th className="px-4 py-3">Período</th>
                <th className="px-4 py-3">Score</th>
                <th className="px-4 py-3">Classificação</th>
                <th className="px-4 py-3">Data</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredEvaluations.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-gray-400">Sem dados</td>
                </tr>
              ) : (
                filteredEvaluations.map((e) => (
                  <tr key={e.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm font-medium text-gray-900">{e.entity_name}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{e.type}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{e.period || "-"}</td>
                    <td className="px-4 py-3 text-sm font-semibold text-gray-900">{Math.round(e.percentage)}%</td>
                    <td className="px-4 py-3">
                      <span className={`badge ${e.classification === "Excellent" || e.classification === "Good" ? "badge-success" : e.classification === "Fair" ? "badge-warning" : "badge-danger"}`}>
                        {e.classification || "-"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500">{new Date(e.created_at).toLocaleDateString("pt-BR")}</td>
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