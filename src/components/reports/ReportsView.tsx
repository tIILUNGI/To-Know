import { useState, useEffect } from "react";
import { Download, BarChart3, TrendingUp, Users, Calendar, Clock, CheckCircle, XCircle, AlertCircle, FileText } from "lucide-react";
import { useToast } from "../../context/ToastContext";

type ReportCategory = "suppliers" | "clients" | "management";
type SupplierReportType = "approved" | "rejected" | "by-sector" | "by-criticality" | "expiring" | "performance-ranking" | "satisfaction-ranking" | "suspended";
type ClientReportType = "approved" | "by-risk" | "by-segment" | "performance" | "satisfaction" | "pending-reevaluation" | "restricted";
type ManagementReportType = "avg-approval-time" | "approval-rate" | "rejection-rate" | "satisfaction-trend" | "performance-trend" | "open-action-plans" | "processes-by-responsible";

type ReportData = any[];

export default function ReportsView() {
  const { addToast } = useToast();
  const [category, setCategory] = useState<ReportCategory>("suppliers");
  const [supplierType, setSupplierType] = useState<SupplierReportType>("approved");
  const [clientType, setClientType] = useState<ClientReportType>("approved");
  const [managementType, setManagementType] = useState<ManagementReportType>("avg-approval-time");
  const [data, setData] = useState<ReportData>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchReport = async (endpoint: string) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(endpoint, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });
      if (!res.ok) {
        const errText = await res.text();
        throw new Error(`HTTP ${res.status}: ${errText}`);
      }
      const json = await res.json();
      console.log(`[ReportsView] Fetched ${endpoint}:`, json);
      setData(json);
    } catch (err: any) {
      console.error(`[ReportsView] Error fetching ${endpoint}:`, err);
      setError(err.message || "Erro ao carregar relatório");
      addToast("Erro ao carregar relatório: " + (err.message || ""), "error");
      setData({});
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (category === "suppliers") {
      fetchReport(`/api/reports/suppliers/${supplierType}`);
    } else if (category === "clients") {
      fetchReport(`/api/reports/clients/${clientType}`);
    } else {
      fetchReport(`/api/reports/management/${managementType}`);
    }
  }, [category, supplierType, clientType, managementType]);

  const handleExportCSV = () => {
    const rows: any[] = Array.isArray(data) ? data : [data];
    if (rows.length === 0) {
      addToast("Sem dados para exportar.", "warning");
      return;
    }
    const headers = Object.keys(rows[0]);
    const csvContent = [
      headers.join(";"),
      ...rows.map((r) => headers.map((h) => `"${r[h]}"`).join(";")),
    ].join("\n");
    const blob = new Blob(["\uFEFF" + csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `toknow_relatorio_${category}_${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    addToast("Relatório exportado com sucesso!", "success");
  };

  const renderSupplierContent = () => {
    switch (supplierType) {
      case "approved":
        return (
          <div className="space-y-3">
            <h3 className="text-sm font-bold text-gray-900">Fornecedores Aprovados ({data.length})</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {data?.map((s: any) => (
                <div key={s.id} className="p-4 border border-gray-100 rounded-xl hover:border-green-200 transition-all">
                  <div className="flex items-start justify-between mb-2">
                    <p className="text-sm font-semibold text-gray-900 truncate">{s.name}</p>
                    <span className="badge badge-success text-xs">{s.status}</span>
                  </div>
                  <p className="text-xs text-gray-500">{s.sector}</p>
                  <p className="text-xs text-gray-500">{s.relationship_status}</p>
                </div>
              ))}
            </div>
          </div>
        );
      case "rejected":
        return (
          <div className="space-y-3">
            <h3 className="text-sm font-bold text-gray-900">Fornecedores Reprovados ({data.length})</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {data?.map((s: any) => (
                <div key={s.id} className="p-4 border border-gray-100 rounded-xl hover:border-red-200 transition-all">
                  <div className="flex items-start justify-between mb-2">
                    <p className="text-sm font-semibold text-gray-900 truncate">{s.name}</p>
                    <span className="badge badge-danger text-xs">{s.status}</span>
                  </div>
                  <p className="text-xs text-gray-500">{s.sector}</p>
                  <p className="text-xs text-red-600 mt-2">{s.rejection_reason}</p>
                </div>
              ))}
            </div>
          </div>
        );
      case "by-sector":
        return (
          <div className="space-y-3">
            <h3 className="text-sm font-bold text-gray-900">Fornecedores por Setor</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {data?.map((s: any) => (
                <div key={s.sector} className="p-4 border border-gray-100 rounded-xl">
                  <p className="text-sm font-semibold text-gray-900">{s.sector}</p>
                  <p className="text-2xl font-bold text-blue-600 mt-1">{s.count}</p>
                </div>
              ))}
            </div>
          </div>
        );
      case "by-criticality":
        return (
          <div className="space-y-3">
            <h3 className="text-sm font-bold text-gray-900">Fornecedores por Criticidade</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {data?.map((c: any) => (
                <div key={c.criticality} className="p-4 border border-gray-100 rounded-xl text-center">
                  <p className="text-sm font-semibold text-gray-900">{c.criticality}</p>
                  <p className="text-3xl font-bold text-blue-600 mt-2">{c.count}</p>
                  <p className="text-xs text-gray-500 mt-1">fornecedores</p>
                </div>
              ))}
            </div>
          </div>
        );
      case "expiring":
        return (
          <div className="space-y-3">
            <h3 className="text-sm font-bold text-gray-900">Fornecedores com Avaliações a Expirar (próximos 90 dias)</h3>
            {data?.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="bg-gray-50 text-[10px] font-semibold text-gray-500 uppercase">
                      <th className="px-4 py-2.5">Entidade</th>
                      <th className="px-4 py-2.5 hidden md:table-cell">Setor</th>
                      <th className="px-4 py-2.5">Última Avaliação</th>
                      <th className="px-4 py-2.5">Expira em</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {data?.map((e: any) => (
                      <tr key={e.entity_id}>
                        <td className="px-4 py-2.5 text-sm font-medium">{e.entity_name}</td>
                        <td className="px-4 py-2.5 text-sm text-gray-600 hidden md:table-cell">{e.sector}</td>
                        <td className="px-4 py-2.5 text-xs text-gray-500">{new Date(e.last_evaluation).toLocaleDateString('pt-BR')}</td>
                        <td className="px-4 py-2.5">
                          <span className={`badge ${parseInt(e.days_until_expiry) < 30 ? "badge-warning" : "badge-neutral"}`}>
                            {e.days_until_expiry} dias
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="py-10 text-center text-gray-400 border-2 border-dashed border-gray-100 rounded-xl">
                Nenhuma avaliação prestes a expirar.
              </div>
            )}
          </div>
        );
      case "performance-ranking":
        return (
          <div className="space-y-3">
            <h3 className="text-sm font-bold text-gray-900">Ranking de Performance</h3>
            <div className="space-y-2">
              {data?.map((e: any, idx: number) => (
                <div key={e.evaluation_id} className="flex items-center gap-3 p-3 border border-gray-100 rounded-lg hover:border-blue-200 transition-all">
                  <span className="w-6 h-6 rounded bg-blue-600 text-white text-xs font-bold flex items-center justify-center">#{idx + 1}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-900 truncate">{e.entity_name}</p>
                    <p className="text-xs text-gray-500">{e.period}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-green-600">{Math.round(e.percentage)}%</p>
                    <p className="text-xs text-gray-500">{e.classification}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      case "satisfaction-ranking":
        return (
          <div className="space-y-3">
            <h3 className="text-sm font-bold text-gray-900">Ranking de Satisfação</h3>
            <div className="space-y-2">
              {data?.map((e: any, idx: number) => (
                <div key={e.evaluation_id} className="flex items-center gap-3 p-3 border border-gray-100 rounded-lg hover:border-indigo-200 transition-all">
                  <span className="w-6 h-6 rounded bg-indigo-600 text-white text-xs font-bold flex items-center justify-center">#{idx + 1}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-900 truncate">{e.entity_name}</p>
                    <p className="text-xs text-gray-500">{e.period}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-indigo-600">{Math.round(e.percentage)}%</p>
                    <p className="text-xs text-gray-500">{e.classification}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      case "suspended":
        return (
          <div className="space-y-3">
            <h3 className="text-sm font-bold text-gray-900">Fornecedores Suspensos ({data.length})</h3>
            {data?.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {data?.map((s: any) => (
                  <div key={s.id} className="p-4 border border-amber-200 rounded-xl bg-amber-50">
                    <div className="flex items-start justify-between mb-2">
                      <p className="text-sm font-semibold text-gray-900">{s.name}</p>
                      <span className="badge bg-amber-100 text-amber-800 text-xs">Suspenso</span>
                    </div>
                    <p className="text-xs text-gray-600 mb-2">{s.reason || "Sem motivo especificado"}</p>
                    <p className="text-[10px] text-gray-400">Suspenso em: {new Date(s.suspension_date).toLocaleDateString('pt-BR')}</p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-10 text-center text-gray-400 border-2 border-dashed border-gray-100 rounded-xl">
                Nenhum fornecedor suspenso no momento.
              </div>
            )}
          </div>
        );
      default:
        return <p className="text-gray-500">Selecione um tipo de relatório.</p>;
    }
  };

  const renderClientContent = () => {
    switch (clientType) {
      case "approved":
        return (
          <div className="space-y-3">
            <h3 className="text-sm font-bold text-gray-900">Clientes Aprovados ({data.length})</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {data?.map((c: any) => (
                <div key={c.id} className="p-4 border border-gray-100 rounded-xl hover:border-green-200 transition-all">
                  <div className="flex items-start justify-between mb-2">
                    <p className="text-sm font-semibold text-gray-900 truncate">{c.name}</p>
                    <span className="badge badge-success text-xs">{c.status}</span>
                  </div>
                  <p className="text-xs text-gray-500">{c.segment || "Sem segmento"}</p>
                  <p className="text-xs text-gray-500">{c.relationship_status}</p>
                </div>
              ))}
            </div>
          </div>
        );
      case "by-risk":
        return (
          <div className="space-y-3">
            <h3 className="text-sm font-bold text-gray-900">Clientes por Nível de Risco</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {data?.map((r: any) => (
                <div key={r.final_risk_rating} className="p-4 border border-gray-100 rounded-xl text-center">
                  <div className={`w-3 h-3 rounded-full mx-auto mb-2 ${r.final_risk_rating === "Alto" ? "bg-red-500" : r.final_risk_rating === "Médio" ? "bg-amber-500" : "bg-green-500"}`}></div>
                  <p className="text-sm font-semibold text-gray-900">{r.final_risk_rating}</p>
                  <p className="text-3xl font-bold text-blue-600 mt-2">{r.count}</p>
                </div>
              ))}
            </div>
          </div>
        );
      case "by-segment":
        return (
          <div className="space-y-3">
            <h3 className="text-sm font-bold text-gray-900">Clientes por Segmento</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {data?.map((s: any) => (
                <div key={s.segment} className="p-4 border border-gray-100 rounded-xl">
                  <p className="text-sm font-semibold text-gray-900">{s.segment}</p>
                  <p className="text-2xl font-bold text-blue-600 mt-1">{s.count}</p>
                </div>
              ))}
            </div>
          </div>
        );
      case "performance":
        return (
          <div className="space-y-3">
            <h3 className="text-sm font-bold text-gray-900">Performance de Clientes</h3>
            <div className="space-y-2">
              {data?.map((e: any, idx: number) => (
                <div key={e.evaluation_id} className="flex items-center gap-3 p-3 border border-gray-100 rounded-lg">
                  <span className="w-6 h-6 rounded bg-green-600 text-white text-xs font-bold flex items-center justify-center">#{idx + 1}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-900 truncate">{e.entity_name}</p>
                    <p className="text-xs text-gray-500">{e.period}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-green-600">{Math.round(e.percentage)}%</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      case "satisfaction":
        return (
          <div className="space-y-3">
            <h3 className="text-sm font-bold text-gray-900">Satisfação de Clientes</h3>
            <div className="space-y-2">
              {data?.map((e: any, idx: number) => (
                <div key={e.evaluation_id} className="flex items-center gap-3 p-3 border border-gray-100 rounded-lg">
                  <span className="w-6 h-6 rounded bg-indigo-600 text-white text-xs font-bold flex items-center justify-center">#{idx + 1}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-900 truncate">{e.entity_name}</p>
                    <p className="text-xs text-gray-500">{e.period}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-indigo-600">{Math.round(e.percentage)}%</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      case "pending-reevaluation":
        return (
          <div className="space-y-3">
            <h3 className="text-sm font-bold text-gray-900">Clientes Pendentes de Reavaliação ({data.length})</h3>
            {data?.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="bg-gray-50 text-[10px] font-semibold text-gray-500 uppercase">
                      <th className="px-4 py-2.5">Cliente</th>
                      <th className="px-4 py-2.5 hidden md:table-cell">Última Avaliação</th>
                      <th className="px-4 py-2.5">Dias sem Avaliar</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {data?.map((c: any) => (
                      <tr key={c.entity_id}>
                        <td className="px-4 py-2.5 text-sm font-medium">{c.entity_name}</td>
                        <td className="px-4 py-2.5 text-sm text-gray-600 hidden md:table-cell">{new Date(c.last_evaluation).toLocaleDateString('pt-BR')}</td>
                        <td className="px-4 py-2.5">
                          <span className={`badge ${c.days_without_evaluation > 180 ? "badge-warning" : "badge-neutral"}`}>
                            {c.days_without_evaluation} dias
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="py-10 text-center text-gray-400 border-2 border-dashed border-gray-100 rounded-xl">
                Todos os clientes estão com avaliações em dia.
              </div>
            )}
          </div>
        );
      case "restricted":
        return (
          <div className="space-y-3">
            <h3 className="text-sm font-bold text-gray-900">Clientes com Restrição ({data.length})</h3>
            {data?.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {data?.map((c: any) => (
                  <div key={c.id} className="p-4 border border-orange-200 rounded-xl bg-orange-50">
                    <div className="flex items-start justify-between mb-2">
                      <p className="text-sm font-semibold text-gray-900">{c.name}</p>
                      <span className="badge bg-orange-100 text-orange-800 text-xs">{c.relationship_status}</span>
                    </div>
                    <p className="text-xs text-gray-600">{c.restriction_reason || "Restrição aplicada"}</p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-10 text-center text-gray-400 border-2 border-dashed border-gray-100 rounded-xl">
                Nenhum cliente com restrição.
              </div>
            )}
          </div>
        );
      default:
        return <p className="text-gray-500">Selecione um tipo de relatório.</p>;
    }
  };

  const renderManagementContent = () => {
    switch (managementType) {
      case "avg-approval-time":
        return (
          <div className="space-y-3">
            <h3 className="text-sm font-bold text-gray-900">Tempo Médio de Aprovação por Responsável</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-gray-50 text-[10px] font-semibold text-gray-500 uppercase">
                    <th className="px-4 py-2.5">Responsável</th>
                    <th className="px-4 py-2.5 text-center">Processos Aprovados</th>
                    <th className="px-4 py-2.5 text-center">Tempo Médio (dias)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {data?.map((row: any) => (
                    <tr key={row.responsible}>
                      <td className="px-4 py-2.5 text-sm font-medium">{row.responsible}</td>
                      <td className="px-4 py-2.5 text-center text-sm">{row.approved_count}</td>
                      <td className="px-4 py-2.5 text-center">
                        <span className="text-lg font-bold text-blue-600">{row.avg_days.toFixed(1)}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        );
      case "approval-rate":
        return (
          <div className="space-y-3">
            <h3 className="text-sm font-bold text-gray-900">Taxa de Aprovação por Responsável</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {data?.map((row: any) => (
                <div key={row.responsible} className="p-4 border border-gray-100 rounded-xl">
                  <p className="text-sm font-semibold text-gray-900 mb-2">{row.responsible}</p>
                  <div className="flex items-end justify-between">
                    <div>
                      <p className="text-2xl font-bold text-green-600">{Math.round(row.approval_rate)}%</p>
                      <p className="text-xs text-gray-500">{row.approved}/{row.total} processos</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-gray-500">Tempo médio</p>
                      <p className="text-sm font-semibold text-gray-700">{row.avg_days.toFixed(1)} dias</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      case "rejection-rate":
        return (
          <div className="space-y-3">
            <h3 className="text-sm font-bold text-gray-900">Taxa de Reprovação por Responsável</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {data?.map((row: any) => (
                <div key={row.responsible} className="p-4 border border-red-100 rounded-xl bg-red-50">
                  <p className="text-sm font-semibold text-gray-900 mb-2">{row.responsible}</p>
                  <div className="flex items-end justify-between">
                    <div>
                      <p className="text-2xl font-bold text-red-600">{Math.round(row.rejection_rate)}%</p>
                      <p className="text-xs text-gray-500">{row.rejected}/{row.total} processos</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-gray-500">Motivo principal</p>
                      <p className="text-sm font-semibold text-gray-700 truncate max-w-[120px]">{row.common_reason || "N/A"}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      case "satisfaction-trend":
      case "performance-trend":
        const isSat = managementType === "satisfaction-trend";
        return (
          <div className="space-y-3">
            <h3 className="text-sm font-bold text-gray-900">{isSat ? "Satisfação" : "Performance"} - Últimos 6 Meses</h3>
            <div className="space-y-4">
              {data?.map((row: any) => (
                <div key={row.period} className="border border-gray-100 rounded-xl p-4">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-semibold text-gray-900">{row.period}</span>
                    <span className="text-lg font-bold text-blue-600">{Math.round(row.avg_score)}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div className="bg-blue-600 h-2 rounded-full" style={{ width: `${row.avg_score}%` }}></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      case "open-action-plans":
        return (
          <div className="space-y-3">
            <h3 className="text-sm font-bold text-gray-900">Planos de Ação em Aberto ({data.length})</h3>
            {data?.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="bg-gray-50 text-[10px] font-semibold text-gray-500 uppercase">
                      <th className="px-4 py-2.5">Entidade</th>
                      <th className="px-4 py-2.5">Ação</th>
                      <th className="px-4 py-2.5">Responsável</th>
                      <th className="px-4 py-2.5">Prazo</th>
                      <th className="px-4 py-2.5">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {data?.map((a: any) => (
                      <tr key={a.id}>
                        <td className="px-4 py-2.5 text-sm font-medium">{a.entity_name}</td>
                        <td className="px-4 py-2.5 text-sm text-gray-600 max-w-xs truncate">{a.action_description}</td>
                        <td className="px-4 py-2.5 text-sm text-gray-600">{a.responsible}</td>
                        <td className="px-4 py-2.5 text-sm text-gray-600">{new Date(a.deadline).toLocaleDateString('pt-BR')}</td>
                        <td className="px-4 py-2.5">
                          <span className={`badge ${a.status === "Concluído" ? "badge-success" : a.status === "Atrasado" ? "badge-danger" : "badge-warning"}`}>
                            {a.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="py-10 text-center text-gray-400 border-2 border-dashed border-gray-100 rounded-xl">
                Nenhum plano de ação em aberto.
              </div>
            )}
          </div>
        );
      case "processes-by-responsible":
        return (
          <div className="space-y-3">
            <h3 className="text-sm font-bold text-gray-900">Processos por Responsável</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {data?.map((p: any) => (
                <div key={p.responsible} className="p-4 border border-gray-100 rounded-xl">
                  <p className="text-sm font-semibold text-gray-900">{p.responsible}</p>
                  <div className="grid grid-cols-2 gap-3 mt-3">
                    <div className="text-center p-2 bg-gray-50 rounded">
                      <p className="text-xl font-bold text-blue-600">{p.total}</p>
                      <p className="text-xs text-gray-500">Total</p>
                    </div>
                    <div className="text-center p-2 bg-green-50 rounded">
                      <p className="text-xl font-bold text-green-600">{p.approved}</p>
                      <p className="text-xs text-gray-500">Aprovados</p>
                    </div>
                    <div className="text-center p-2 bg-red-50 rounded">
                      <p className="text-xl font-bold text-red-600">{p.rejected}</p>
                      <p className="text-xs text-gray-500">Reprovados</p>
                    </div>
                    <div className="text-center p-2 bg-amber-50 rounded">
                      <p className="text-xl font-bold text-amber-600">{p.pending}</p>
                      <p className="text-xs text-gray-500">Pendentes</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      default:
        return <p className="text-gray-500">Selecione um tipo de relatório.</p>;
    }
  };

  const renderContent = () => {
    if (loading) {
      return (
        <div className="h-64 flex items-center justify-center">
          <div className="flex flex-col items-center gap-3">
            <div className="w-8 h-8 border-3 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
            <span className="text-sm text-gray-500">Carregando relatório...</span>
          </div>
        </div>
      );
    }

    if (error) {
      return (
        <div className="h-64 flex items-center justify-center">
          <div className="text-center">
            <AlertCircle size={48} className="mx-auto text-red-500 mb-3" />
            <p className="text-sm font-semibold text-red-600">{error}</p>
            <p className="text-xs text-gray-500 mt-1">Verifique o console para detalhes</p>
          </div>
        </div>
      );
    }

    if (category === "suppliers") return renderSupplierContent();
    if (category === "clients") return renderClientContent();
    return renderManagementContent();
  };

  const supplierOptions: { value: SupplierReportType; label: string }[] = [
    { value: "approved", label: "Aprovados" },
    { value: "rejected", label: "Reprovados" },
    { value: "by-sector", label: "Por Setor" },
    { value: "by-criticality", label: "Por Criticidade" },
    { value: "expiring", label: "Avaliações a Expirar" },
    { value: "performance-ranking", label: "Ranking Performance" },
    { value: "satisfaction-ranking", label: "Ranking Satisfação" },
    { value: "suspended", label: "Suspensos" },
  ];

  const clientOptions: { value: ClientReportType; label: string }[] = [
    { value: "approved", label: "Aprovados" },
    { value: "by-risk", label: "Por Risco" },
    { value: "by-segment", label: "Por Segmento" },
    { value: "performance", label: "Performance" },
    { value: "satisfaction", label: "Satisfação" },
    { value: "pending-reevaluation", label: "Pendentes Reavaliação" },
    { value: "restricted", label: "Com Restrição" },
  ];

  const managementOptions: { value: ManagementReportType; label: string }[] = [
    { value: "avg-approval-time", label: "Tempo Médio Aprovação" },
    { value: "approval-rate", label: "Taxa Aprovação" },
    { value: "rejection-rate", label: "Taxa Reprovação" },
    { value: "satisfaction-trend", label: "Tendência Satisfação" },
    { value: "performance-trend", label: "Tendência Performance" },
    { value: "open-action-plans", label: "Planos Ação em Aberto" },
    { value: "processes-by-responsible", label: "Processos por Responsável" },
  ];

  return (
    <div className="space-y-4 sm:space-y-5">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div>
          <h1 className="text-lg sm:text-xl font-bold text-gray-900">Relatórios do Sistema</h1>
          <p className="text-xs sm:text-sm text-gray-500 mt-0.5">Análises e indicadores consolidated</p>
        </div>
        <button onClick={handleExportCSV} className="btn btn-outline text-sm">
          <Download size={14} strokeWidth={2} /> Exportar
        </button>
      </div>

      {/* Category Tabs */}
      <div className="flex gap-2 border-b border-gray-100 pb-2">
        <button
          onClick={() => setCategory("suppliers")}
          className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
            category === "suppliers" ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
          }`}
        >
          <Users size={14} className="inline mr-2" /> Fornecedores
        </button>
        <button
          onClick={() => setCategory("clients")}
          className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
            category === "clients" ? "bg-indigo-600 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
          }`}
        >
          <Users size={14} className="inline mr-2" /> Clientes
        </button>
        <button
          onClick={() => setCategory("management")}
          className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
            category === "management" ? "bg-purple-600 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
          }`}
        >
          <BarChart3 size={14} className="inline mr-2" /> Gestão
        </button>
      </div>

      {/* Report Type Selector */}
      <div className="flex gap-2">
        {category === "suppliers" && (
          <select value={supplierType} onChange={(e) => setSupplierType(e.target.value as SupplierReportType)} className="input text-xs min-w-[180px]">
            {supplierOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        )}
        {category === "clients" && (
          <select value={clientType} onChange={(e) => setClientType(e.target.value as ClientReportType)} className="input text-xs min-w-[180px]">
            {clientOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        )}
        {category === "management" && (
          <select value={managementType} onChange={(e) => setManagementType(e.target.value as ManagementReportType)} className="input text-xs min-w-[200px]">
            {managementOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        )}
      </div>

      {/* Report Content */}
      <div className="card p-4 sm:p-6">
        {renderContent()}
      </div>
    </div>
  );
}
