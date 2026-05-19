import { useState, useEffect } from "react";
import { Download, BarChart3, TrendingUp, Users, Calendar, Clock, CheckCircle, XCircle, AlertCircle, FileText } from "lucide-react";
import { useToast } from "../../context/ToastContext";
import PageHeader from "../common/PageHeader";

type ReportCategory = "suppliers" | "clients" | "management" | "collaboration";
type SupplierReportType = "approved" | "rejected" | "by-sector" | "by-criticality" | "expiring" | "performance-ranking" | "satisfaction-ranking" | "suspended";
type ClientReportType = "approved" | "by-risk" | "by-segment" | "performance" | "satisfaction" | "pending-reevaluation" | "restricted";
type ManagementReportType = "avg-approval-time" | "approval-rate" | "rejection-rate" | "satisfaction-trend" | "performance-trend" | "open-action-plans" | "processes-by-responsible";
type CollaborationReportType = "360-overall" | "360-by-department" | "360-by-position" | "360-trend" | "360-participation";

type ReportData = any[];

export default function ReportsView() {
  const { addToast } = useToast();
  const [category, setCategory] = useState<ReportCategory>("suppliers");
  const [supplierType, setSupplierType] = useState<SupplierReportType>("approved");
  const [clientType, setClientType] = useState<ClientReportType>("approved");
  const [managementType, setManagementType] = useState<ManagementReportType>("avg-approval-time");
  const [collaborationType, setCollaborationType] = useState<CollaborationReportType>("360-overall");
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
       
       const contentType = res.headers.get("content-type");
       const text = await res.text();
       
       if (!res.ok) {
         let errorMsg = `HTTP ${res.status}`;
         try {
           const json = JSON.parse(text);
           errorMsg = json.message || json.error || errorMsg;
         } catch {
           if (text.includes("<!DOCTYPE")) {
             errorMsg = "Página de erro recebida (HTML) - verifique rota ou autenticação";
           } else if (text.length > 0) {
             errorMsg = text.slice(0, 200);
           }
         }
         throw new Error(errorMsg);
       }
       
       if (!contentType || !contentType.includes("application/json")) {
         throw new Error(`Resposta inválida (Content-Type: ${contentType})`);
       }
       
       const json = JSON.parse(text);
       console.log(`[ReportsView] ✅ Fetched ${endpoint}:`, json);
       setData(json);
     } catch (err: any) {
       console.error(`[ReportsView] ❌ Error ${endpoint}:`, err);
       setError(err.message || "Erro ao carregar relatório");
       addToast("Erro: " + (err.message?.slice(0,100) || ""), "error");
       setData(null);
     } finally {
       setLoading(false);
     }
   };

  useEffect(() => {
    if (category === "suppliers") {
      fetchReport(`/api/reports/suppliers/${supplierType}`);
    } else if (category === "clients") {
      fetchReport(`/api/reports/clients/${clientType}`);
    } else if (category === "collaboration") {
      fetchReport(`/api/reports/collaboration/${collaborationType}`);
    } else {
      fetchReport(`/api/reports/management/${managementType}`);
    }
  }, [category, supplierType, clientType, managementType, collaborationType]);

  const handleExportCSV = () => {
    const rows: any[] = Array.isArray(data) ? data : data ? [data] : [];
    if (rows.length === 0) {
      addToast("Sem dados para exportar.", "warning");
      return;
    }
    const headers = Object.keys(rows[0]);
    const csvContent = [
      headers.join(";"),
      ...rows.map((r) => headers.map((h) => `"${r[h] || ''}"`).join(";")),
    ].join("\n");
    const blob = new Blob(["\uFEFF" + csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `toknow_relatorio_${category}_${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    addToast("Relatório exportado em CSV!", "success");
  };

  const handleExportExcel = () => {
    const rows: any[] = Array.isArray(data) ? data : data ? [data] : [];
    if (rows.length === 0) {
      addToast("Sem dados para exportar.", "warning");
      return;
    }
    const headers = Object.keys(rows[0]);
    let xml = '<?xml version="1.0" encoding="UTF-8"?><?mso-application progid="Excel.Sheet"?>';
    xml += '<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet" xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet">';
    xml += '<Worksheet ss:Name="Relatório"><Table>';
    xml += '<Row>' + headers.map(h => `<Cell><Data ss:Type="String">${h}</Data></Cell>`).join('') + '</Row>';
    rows.forEach((r: any) => {
      xml += '<Row>' + headers.map(h => `<Cell><Data ss:Type="String">${r[h] || ''}</Data></Cell>`).join('') + '</Row>';
    });
    xml += '</Table></Worksheet></Workbook>';
    const blob = new Blob([xml], { type: "application/vnd.ms-excel;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `toknow_relatorio_${category}_${new Date().toISOString().slice(0, 10)}.xls`;
    link.click();
    URL.revokeObjectURL(url);
    addToast("Relatório exportado em Excel!", "success");
  };

  const handleExportPDF = () => {
    const rows: any[] = Array.isArray(data) ? data : data ? [data] : [];
    if (rows.length === 0) {
      addToast("Sem dados para exportar.", "warning");
      return;
    }
    const headers = Object.keys(rows[0]);
    let html = `<html><head><style>
      body { font-family: var(--font-sans); padding: 20px; }
      h1 { color: #333; }
      table { width: 100%; border-collapse: collapse; margin-top: 20px; }
      th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
      th { background-color: #4a5568; color: white; }
      tr:nth-child(even) { background-color: #f9f9f9; }
    </style></head><body>`;
     html += `<h1>TOKNOW - Relatório de ${category}</h1>`;
    html += `<p>Data: ${new Date().toLocaleDateString('pt-PT')}</p>`;
    html += '<table><thead><tr>';
    headers.forEach(h => { html += `<th>${h}</th>`; });
    html += '</tr></thead><tbody>';
    rows.forEach((r: any) => {
      html += '<tr>';
      headers.forEach(h => { html += `<td>${r[h] || ''}</td>`; });
      html += '</tr>';
    });
    html += '</tbody></table></body></html>';
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(html);
      printWindow.document.close();
      printWindow.print();
    }
    addToast("Relatório aberto para PDF!", "success");
  };

  const renderSupplierContent = () => {
    switch (supplierType) {
      case "approved":
        return (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 bg-gray-50/50 rounded-2xl border border-gray-100">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-green-100 text-green-600 flex items-center justify-center shadow-sm border border-green-200/50">
                  <CheckCircle size={24} />
                </div>
                <div>
                  <h3 className="text-base font-bold text-gray-900 leading-none">Fornecedores Aprovados</h3>
                </div>
              </div>
              <div className="flex items-center gap-3 bg-white px-4 py-2 rounded-2xl border border-gray-100 shadow-sm">
                <span className="text-[10px] font-medium text-gray-400  tracking-widest">Total</span>
                <div className="w-px h-4 bg-gray-100 mx-1"></div>
                <span className="text-sm font-bold text-green-600">{data?.length || 0} Entidades</span>
              </div>
            </div>
            
            {!data || data.length === 0 ? (
               <div className="py-24 text-center bg-white rounded-3xl border border-gray-100 shadow-sm">
                  <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-6">
                    <CheckCircle size={32} className="text-gray-200" />
                  </div>
                  <h4 className="text-gray-900 font-bold mb-1">Base de Dados Vazia</h4>
                  <p className="text-xs text-gray-400 max-w-xs mx-auto">Não existem fornecedores aprovados no sistema para este filtro no momento.</p>
               </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {data.map((s: any) => (
                  <div key={s.id} className="p-6 bg-white border border-gray-100 rounded-2xl hover:shadow-xl hover:shadow-blue-50/50 hover:border-green-200 transition-all group relative">
                    <div className="flex items-start justify-between mb-5">
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-bold text-gray-900 truncate group-hover:text-green-700 transition-colors tracking-tight">{s.name}</p>
                        <p className="text-[10px] font-medium text-gray-400  tracking-widest mt-1.5">{s.sector || 'Geral'}</p>
                      </div>
                      <div className="w-2 h-2 rounded-full bg-green-500 shadow-sm shadow-green-200 ml-3 mt-1"></div>
                    </div>
                    <div className="pt-4 border-t border-gray-50 flex items-center justify-between">
                       <div className="flex flex-col gap-0.5">
                         <span className="text-[10px] text-gray-400  font-bold tracking-tighter">Status Relacional</span>
                         <span className="text-xs font-medium text-gray-700">{s.relationship_status || 'Regular'}</span>
                       </div>
                       <div className="p-2 bg-green-50 rounded-xl text-green-600 opacity-40 group-hover:opacity-100 transition-all transform group-hover:scale-110">
                         <TrendingUp size={16} />
                       </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      case "rejected":
        return (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 bg-red-50/30 rounded-2xl border border-red-100">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-red-100 text-red-600 flex items-center justify-center shadow-sm border border-red-200/50">
                  <XCircle size={24} />
                </div>
                <div>
                  <h3 className="text-base font-bold text-gray-900 leading-none">Fornecedores Reprovados</h3>
                </div>
              </div>
              <div className="flex items-center gap-3 bg-white px-4 py-2 rounded-2xl border border-red-100 shadow-sm">
                <span className="text-[10px] font-medium text-gray-400  tracking-widest">Total</span>
                <div className="w-px h-4 bg-gray-100 mx-1"></div>
                <span className="text-sm font-bold text-red-600">{data?.length || 0} Entidades</span>
              </div>
            </div>

            {!data || data.length === 0 ? (
               <div className="py-24 text-center bg-white rounded-3xl border border-gray-100 shadow-sm">
                  <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-6">
                    <XCircle size={32} className="text-gray-200" />
                  </div>
                  <h4 className="text-gray-900 font-bold mb-1">Nada a reportar</h4>
                  <p className="text-xs text-gray-400 max-w-xs mx-auto">Nenhum fornecedor encontra-se no estado de reprovado no momento.</p>
               </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {data.map((s: any) => (
                  <div key={s.id} className="p-6 bg-white border border-gray-100 rounded-2xl hover:shadow-xl hover:shadow-red-50/50 hover:border-red-200 transition-all group">
                    <div className="flex items-start justify-between mb-4">
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-bold text-gray-900 truncate group-hover:text-red-700 transition-colors tracking-tight">{s.name}</p>
                        <p className="text-[10px] font-medium text-gray-400  tracking-widest mt-1.5">{s.sector || 'Geral'}</p>
                      </div>
                      <div className="w-2 h-2 rounded-full bg-red-500 shadow-sm shadow-red-200 ml-3 mt-1"></div>
                    </div>
                    <div className="mt-4 p-4 bg-red-50 rounded-2xl border border-red-100/50">
                       <span className="text-[10px] text-red-400  font-bold tracking-tighter">Motivo Crítico</span>
                       <p className="text-xs text-red-700 mt-1 font-medium leading-relaxed italic">"{s.rejection_reason || 'Motivo não especificado'}"</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      case "by-sector":
        return (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 bg-blue-50/30 rounded-2xl border border-blue-100">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-blue-100 text-blue-600 flex items-center justify-center shadow-sm border border-blue-200/50">
                  <BarChart3 size={24} />
                </div>
                <div>
                  <h3 className="text-base font-bold text-gray-900 leading-none">Fornecedores por Sector</h3>
                </div>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {data?.map((s: any) => (
                <div key={s.sector} className="p-6 bg-white border border-gray-100 rounded-2xl hover:shadow-lg transition-all flex items-center justify-between group">
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-gray-900 tracking-tight">{s.sector || 'Não Definido'}</p>
                    <p className="text-[10px] font-medium text-gray-400  tracking-widest mt-1">Volume de Entidades</p>
                  </div>
                  <div className="text-right">
                    <p className="text-3xl font-bold text-blue-600 group-hover:scale-110 transition-transform">{s.count}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      case "by-criticality":
        return (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 bg-amber-50/30 rounded-2xl border border-amber-100">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-600 flex items-center justify-center shadow-sm border border-amber-200/50">
                  <AlertCircle size={24} />
                </div>
                <div>
                  <h3 className="text-base font-bold text-gray-900 leading-none">Fornecedores por Criticidade</h3>
                </div>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {data?.map((c: any) => (
                <div key={c.criticality} className="p-8 bg-white border border-gray-100 rounded-3xl text-center hover:shadow-xl transition-all group">
                  <div className="w-12 h-12 bg-amber-50 rounded-2xl flex items-center justify-center mx-auto mb-4 text-amber-600 group-hover:scale-110 transition-transform">
                    <AlertTriangle size={24} />
                  </div>
                  <p className="text-xs font-medium text-gray-400  tracking-widest mb-1">{c.criticality}</p>
                  <p className="text-2xl font-bold text-gray-900">{c.count}</p>
                  <p className="text-[10px] text-gray-400 font-bold mt-2  tracking-tighter">Entidades Registadas</p>
                </div>
              ))}
            </div>
          </div>
        );
      case "expiring":
        return (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 bg-gray-50/50 rounded-2xl border border-gray-100">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-600 flex items-center justify-center shadow-sm border border-amber-200/50">
                  <Clock size={24} />
                </div>
                <div>
                  <h3 className="text-base font-bold text-gray-900 leading-none">Avaliações a Expirar</h3>
                </div>
              </div>
              <div className="flex items-center gap-3 bg-white px-4 py-2 rounded-2xl border border-gray-100 shadow-sm">
                <span className="text-[10px] font-medium text-gray-400  tracking-widest">Crítico</span>
                <div className="w-px h-4 bg-gray-100 mx-1"></div>
                <span className="text-sm font-bold text-amber-600">{data?.length || 0} Entidades</span>
              </div>
            </div>

            {!data || data.length === 0 ? (
               <div className="py-24 text-center bg-white rounded-3xl border border-gray-100 shadow-sm">
                  <p className="text-sm text-gray-400 font-medium">Nenhuma avaliação prestes a expirar.</p>
               </div>
            ) : (
              <div className="overflow-hidden border border-gray-100 rounded-2xl bg-white shadow-sm">
                <table className="w-full text-left">
                  <thead>
                    <tr className="bg-gray-50/50 border-b border-gray-100 text-[10px] font-medium text-gray-400  tracking-widest">
                      <th className="px-6 py-4">Entidade</th>
                      <th className="px-6 py-4 hidden md:table-cell">Sector</th>
                      <th className="px-6 py-4">Última Avaliação</th>
                      <th className="px-6 py-4 text-right">Expira em</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {data?.map((e: any) => (
                      <tr key={e.entity_id} className="hover:bg-gray-50/50 transition-colors">
                        <td className="px-6 py-4">
                           <p className="text-sm font-bold text-gray-900 tracking-tight">{e.entity_name}</p>
                           <p className="text-[10px] text-gray-400 font-bold  tracking-tighter">Registo Activo</p>
                        </td>
                        <td className="px-6 py-4 text-xs font-medium text-gray-600  tracking-tighter hidden md:table-cell">{e.sector}</td>
                        <td className="px-6 py-4 text-xs font-medium text-gray-400">{new Date(e.last_evaluation).toLocaleDateString('pt-PT')}</td>
                        <td className="px-6 py-4 text-right">
                          <span className={`inline-flex items-center px-3 py-1 rounded-full text-[10px] font-medium  tracking-tighter ${parseInt(e.days_until_expiry) < 30 ? "bg-red-50 text-red-600 shadow-sm shadow-red-100" : "bg-amber-50 text-amber-600"}`}>
                            {e.days_until_expiry} dias
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        );
      case "performance-ranking":
        return (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 bg-blue-50/30 rounded-2xl border border-blue-100">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-blue-100 text-blue-600 flex items-center justify-center shadow-sm border border-blue-200/50">
                  <TrendingUp size={24} />
                </div>
                <div>
                  <h3 className="text-base font-bold text-gray-900 leading-none">Ranking de Performance</h3>
                </div>
              </div>
            </div>
            <div className="space-y-3">
              {data?.map((e: any, idx: number) => (
                <div key={e.evaluation_id} className="flex items-center gap-4 p-5 bg-white border border-gray-100 rounded-2xl hover:shadow-lg hover:border-blue-200 transition-all group">
                  <span className="w-10 h-10 rounded-xl bg-gray-50 text-gray-400 text-xs font-medium flex items-center justify-center group-hover:bg-blue-600 group-hover:text-white transition-all shadow-inner">
                    #{idx + 1}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-gray-900 truncate tracking-tight">{e.entity_name}</p>
                    <p className="text-[10px] font-medium text-gray-400 tracking-widest mt-1">{e.period}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-blue-600">{Math.round(e.percentage)}%</p>
                    <p className="text-[10px] font-medium text-gray-400  tracking-tighter">{e.classification}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      case "satisfaction-ranking":
        return (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 bg-indigo-50/30 rounded-2xl border border-indigo-100">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-indigo-100 text-indigo-600 flex items-center justify-center shadow-sm border border-indigo-200/50">
                  <Heart size={24} />
                </div>
                <div>
                  <h3 className="text-base font-bold text-gray-900 leading-none">Ranking de Satisfação</h3>
                </div>
              </div>
            </div>
            <div className="space-y-3">
              {data?.map((e: any, idx: number) => (
                <div key={e.evaluation_id} className="flex items-center gap-4 p-5 bg-white border border-gray-100 rounded-2xl hover:shadow-lg hover:border-indigo-200 transition-all group">
                  <span className="w-10 h-10 rounded-xl bg-gray-50 text-gray-400 text-xs font-medium flex items-center justify-center group-hover:bg-indigo-600 group-hover:text-white transition-all shadow-inner">
                    #{idx + 1}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-gray-900 truncate tracking-tight">{e.entity_name}</p>
                    <p className="text-[10px] font-medium text-gray-400 tracking-widest mt-1">{e.period}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-indigo-600">{Math.round(e.percentage)}%</p>
                    <p className="text-[10px] font-medium text-gray-400  tracking-tighter">{e.classification}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      case "suspended":
        return (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 bg-amber-50/30 rounded-2xl border border-amber-100">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-600 flex items-center justify-center shadow-sm border border-amber-200/50">
                  <Clock size={24} />
                </div>
                <div>
                  <h3 className="text-base font-bold text-gray-900 leading-none">Fornecedores Suspensos</h3>
                </div>
              </div>
              <div className="flex items-center gap-3 bg-white px-4 py-2 rounded-2xl border border-amber-100 shadow-sm">
                <span className="text-[10px] font-medium text-gray-400  tracking-widest">Total</span>
                <div className="w-px h-4 bg-gray-100 mx-1"></div>
                <span className="text-sm font-bold text-amber-600">{data?.length || 0} Entidades</span>
              </div>
            </div>

            {!data || data.length === 0 ? (
               <div className="py-24 text-center bg-white rounded-3xl border border-gray-100 shadow-sm">
                  <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-6">
                    <Clock size={32} className="text-gray-200" />
                  </div>
                  <h4 className="text-gray-900 font-bold mb-1">Nenhuma Suspensão</h4>
                  <p className="text-xs text-gray-400 max-w-xs mx-auto">Não existem fornecedores suspensos no momento.</p>
               </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {data.map((s: any) => (
                  <div key={s.id} className="p-6 bg-white border border-gray-100 rounded-2xl hover:shadow-xl hover:shadow-amber-50/50 hover:border-amber-200 transition-all group">
                    <div className="flex items-start justify-between mb-4">
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-bold text-gray-900 truncate tracking-tight">{s.name}</p>
                        <p className="text-[10px] font-medium text-amber-600  tracking-widest mt-1.5">Bloqueio Temporário</p>
                      </div>
                      <div className="w-2 h-2 rounded-full bg-amber-500 shadow-sm shadow-amber-200 ml-3 mt-1"></div>
                    </div>
                    <div className="mt-4 p-4 bg-amber-50 rounded-2xl border border-amber-100/50">
                       <p className="text-[10px] text-amber-400  font-bold tracking-tighter">Motivo da Suspensão</p>
                       <p className="text-xs text-amber-800 mt-1 font-medium leading-relaxed italic">"{s.reason || 'Não especificado'}"</p>
                       <div className="mt-3 pt-3 border-t border-amber-100 flex justify-between items-center">
                         <span className="text-[10px] text-amber-400 font-bold ">Data de Início</span>
                         <span className="text-[10px] font-medium text-amber-700">{new Date(s.suspension_date).toLocaleDateString('pt-PT')}</span>
                       </div>
                    </div>
                  </div>
                ))}
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
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 bg-blue-50/30 rounded-2xl border border-blue-100">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-blue-100 text-blue-600 flex items-center justify-center shadow-sm border border-blue-200/50">
                  <CheckCircle size={24} />
                </div>
                <div>
                  <h3 className="text-base font-bold text-gray-900 leading-none">Clientes Aprovados</h3>
                </div>
              </div>
              <div className="flex items-center gap-3 bg-white px-4 py-2 rounded-2xl border border-blue-100 shadow-sm">
                <span className="text-[10px] font-medium text-gray-400 tracking-widest">Activos</span>
                <div className="w-px h-4 bg-gray-100 mx-1"></div>
                <span className="text-sm font-bold text-blue-600">{data?.length || 0} Entidades</span>
              </div>
            </div>

            {!data || data.length === 0 ? (
               <div className="py-24 text-center bg-white rounded-3xl border border-gray-100 shadow-sm">
                  <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-6">
                    <CheckCircle size={32} className="text-gray-200" />
                  </div>
                  <h4 className="text-gray-900 font-bold mb-1">Nenhum Aprovado</h4>
                  <p className="text-xs text-gray-400 max-w-xs mx-auto">Ainda não existem clientes que cumpriram todos os requisitos de aprovação.</p>
               </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {data.map((c: any) => (
                  <div key={c.id} className="p-6 bg-white border border-gray-100 rounded-2xl hover:shadow-xl hover:shadow-indigo-50/50 hover:border-indigo-200 transition-all group">
                    <div className="flex items-start justify-between mb-5">
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-bold text-gray-900 truncate group-hover:text-indigo-700 transition-colors tracking-tight">{c.name}</p>
                        <p className="text-[10px] font-medium text-gray-400  tracking-widest mt-1.5">{c.segment || 'Geral'}</p>
                      </div>
                      <div className="px-2.5 py-1 rounded-lg bg-green-50 text-green-600 text-[10px] font-medium  tracking-tighter border border-green-100 shadow-sm shadow-green-100/50">Activo</div>
                    </div>
                    <div className="pt-5 border-t border-gray-50 flex items-center justify-between">
                       <div className="flex flex-col gap-0.5">
                         <span className="text-[10px] text-gray-400  font-bold tracking-tighter">Relacionamento</span>
                         <span className="text-xs font-medium text-gray-700">{c.relationship_status || 'Regular'}</span>
                       </div>
                       <div className="p-2 bg-indigo-50 rounded-xl text-indigo-600 opacity-40 group-hover:opacity-100 transition-all transform group-hover:scale-110">
                         <TrendingUp size={16} />
                       </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      case "by-risk":
        return (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 bg-indigo-50/30 rounded-2xl border border-indigo-100">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-indigo-100 text-indigo-600 flex items-center justify-center shadow-sm border border-indigo-200/50">
                  <Shield size={24} />
                </div>
                <div>
                  <h3 className="text-base font-bold text-gray-900 leading-none">Clientes por Nível de Risco</h3>
                </div>
              </div>
            </div>

            {!data || data.length === 0 ? (
               <div className="py-24 text-center bg-white rounded-3xl border border-gray-100 shadow-sm">
                  <p className="text-sm text-gray-400 font-medium">Nenhum dado de risco disponível.</p>
               </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                {data?.map((r: any) => (
                  <div key={r.final_risk_rating} className="p-8 bg-white border border-gray-100 rounded-3xl text-center hover:shadow-xl transition-all group">
                    <div className={`w-4 h-4 rounded-full mx-auto mb-4 shadow-sm ${r.final_risk_rating === "Alto" ? "bg-red-500 shadow-red-200" : r.final_risk_rating === "Médio" ? "bg-amber-500 shadow-amber-200" : "bg-green-500 shadow-green-200"}`}></div>
                    <p className="text-xs font-medium text-gray-400  tracking-widest mb-1">{r.final_risk_rating}</p>
                    <p className="text-2xl font-bold text-gray-900">{r.count}</p>
                    <p className="text-[10px] text-gray-400 font-bold mt-2  tracking-tighter">Entidades Classificadas</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      case "by-segment":
        return (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 bg-blue-50/30 rounded-2xl border border-blue-100">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-blue-100 text-blue-600 flex items-center justify-center shadow-sm border border-blue-200/50">
                  <BarChart3 size={24} />
                </div>
                <div>
                  <h3 className="text-base font-bold text-gray-900 leading-none">Clientes por Segmento</h3>
                </div>
              </div>
            </div>

            {!data || data.length === 0 ? (
               <div className="py-24 text-center bg-white rounded-3xl border border-gray-100 shadow-sm">
                  <p className="text-sm text-gray-400 font-medium">Sem dados de segmentação.</p>
               </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {data?.map((s: any) => (
                  <div key={s.segment} className="p-6 bg-white border border-gray-100 rounded-2xl hover:shadow-lg transition-all flex items-center justify-between group">
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-gray-900 tracking-tight">{s.segment || 'Não Definido'}</p>
                      <p className="text-[10px] font-medium text-gray-400  tracking-widest mt-1">Total de Clientes</p>
                    </div>
                    <div className="text-right">
                      <p className="text-3xl font-bold text-blue-600 group-hover:scale-110 transition-transform">{s.count}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      case "performance":
        return (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 bg-green-50/30 rounded-2xl border border-green-100">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-green-100 text-green-600 flex items-center justify-center shadow-sm border border-green-200/50">
                  <TrendingUp size={24} />
                </div>
                <div>
                  <h3 className="text-base font-bold text-gray-900 leading-none">Performance de Clientes</h3>
                </div>
              </div>
            </div>

            {!data || data.length === 0 ? (
               <div className="py-24 text-center bg-white rounded-3xl border border-gray-100 shadow-sm">
                  <p className="text-sm text-gray-400 font-medium">Sem rankings de performance disponíveis.</p>
               </div>
            ) : (
              <div className="space-y-3">
                {data?.map((e: any, idx: number) => (
                  <div key={e.evaluation_id} className="flex items-center gap-4 p-5 bg-white border border-gray-100 rounded-2xl hover:shadow-lg transition-all group">
                    <span className="w-10 h-10 rounded-xl bg-gray-50 text-gray-400 text-xs font-medium flex items-center justify-center group-hover:bg-green-600 group-hover:text-white transition-all shadow-inner">
                      #{idx + 1}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-gray-900 truncate tracking-tight">{e.entity_name}</p>
                      <p className="text-[10px] font-medium text-gray-400 tracking-widest mt-1">{e.period}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-green-600">{Math.round(e.percentage)}%</p>
                      <p className="text-[10px] font-medium text-gray-400  tracking-tighter">Índice de Performance</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      case "satisfaction":
        return (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 bg-indigo-50/30 rounded-2xl border border-indigo-100">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-indigo-100 text-indigo-600 flex items-center justify-center shadow-sm border border-indigo-200/50">
                  <Heart size={24} />
                </div>
                <div>
                  <h3 className="text-base font-bold text-gray-900 leading-none">Satisfação de Clientes</h3>
                </div>
              </div>
            </div>

            {!data || data.length === 0 ? (
               <div className="py-24 text-center bg-white rounded-3xl border border-gray-100 shadow-sm">
                  <p className="text-sm text-gray-400 font-medium">Sem rankings de satisfação disponíveis.</p>
               </div>
            ) : (
              <div className="space-y-3">
                {data?.map((e: any, idx: number) => (
                  <div key={e.evaluation_id} className="flex items-center gap-4 p-5 bg-white border border-gray-100 rounded-2xl hover:shadow-lg transition-all group">
                    <span className="w-10 h-10 rounded-xl bg-gray-50 text-gray-400 text-xs font-medium flex items-center justify-center group-hover:bg-indigo-600 group-hover:text-white transition-all shadow-inner">
                      #{idx + 1}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-gray-900 truncate tracking-tight">{e.entity_name}</p>
                      <p className="text-[10px] font-medium text-gray-400 tracking-widest mt-1">{e.period}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-indigo-600">{Math.round(e.percentage)}%</p>
                      <p className="text-[10px] font-medium text-gray-400 tracking-tight">Índice NPS</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      case "pending-reevaluation":
        return (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 bg-gray-50/50 rounded-2xl border border-gray-100">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-blue-100 text-blue-600 flex items-center justify-center shadow-sm border border-blue-200/50">
                  <RotateCcw size={24} />
                </div>
                <div>
                  <h3 className="text-base font-bold text-gray-900 leading-none">Pendentes de Reavaliação</h3>
                </div>
              </div>
              <div className="flex items-center gap-3 bg-white px-4 py-2 rounded-2xl border border-gray-100 shadow-sm">
                <span className="text-[10px] font-medium text-gray-400  tracking-widest">Total</span>
                <div className="w-px h-4 bg-gray-100 mx-1"></div>
                <span className="text-sm font-bold text-blue-600">{data?.length || 0} Entidades</span>
              </div>
            </div>

            {!data || data.length === 0 ? (
               <div className="py-24 text-center bg-white rounded-3xl border border-gray-100 shadow-sm">
                  <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-6">
                    <CheckCircle size={32} className="text-gray-200" />
                  </div>
                  <h4 className="text-gray-900 font-bold mb-1">Tudo em Dia</h4>
                  <p className="text-xs text-gray-400 max-w-xs mx-auto">Não existem reavaliações pendentes neste momento.</p>
               </div>
            ) : (
              <div className="overflow-hidden border border-gray-100 rounded-2xl bg-white shadow-sm">
                <table className="w-full text-left">
                  <thead>
                    <tr className="bg-gray-50/50 border-b border-gray-100 text-[10px] font-medium text-gray-400  tracking-widest">
                      <th className="px-6 py-4">Cliente</th>
                      <th className="px-6 py-4 hidden md:table-cell">Última Avaliação</th>
                      <th className="px-6 py-4 text-right">Dias sem Avaliar</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {data?.map((c: any) => (
                      <tr key={c.entity_id} className="hover:bg-gray-50/50 transition-colors group">
                        <td className="px-6 py-4">
                          <p className="text-sm font-bold text-gray-900 tracking-tight">{c.entity_name}</p>
                          <p className="text-[10px] text-gray-400 font-bold  tracking-tighter">Entidade Activa</p>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600 font-medium hidden md:table-cell">
                          {new Date(c.last_evaluation).toLocaleDateString('pt-PT', { day: '2-digit', month: 'long', year: 'numeric' })}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <span className={`inline-flex items-center px-3 py-1 rounded-full text-[10px] font-medium  tracking-tighter ${c.days_without_evaluation > 180 ? "bg-red-50 text-red-600 shadow-sm shadow-red-100" : "bg-gray-100 text-gray-600"}`}>
                            {c.days_without_evaluation} dias
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        );
      case "restricted":
        return (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 bg-orange-50/30 rounded-2xl border border-orange-100">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-orange-100 text-orange-600 flex items-center justify-center shadow-sm border border-orange-200/50">
                  <AlertTriangle size={24} />
                </div>
                <div>
                  <h3 className="text-base font-bold text-gray-900 leading-none">Clientes com Restrição</h3>
                </div>
              </div>
              <div className="flex items-center gap-3 bg-white px-4 py-2 rounded-2xl border border-orange-100 shadow-sm">
                <span className="text-[10px] font-medium text-gray-400  tracking-widest">Total</span>
                <div className="w-px h-4 bg-gray-100 mx-1"></div>
                <span className="text-sm font-bold text-orange-600">{data?.length || 0} Entidades</span>
              </div>
            </div>

            {!data || data.length === 0 ? (
               <div className="py-24 text-center bg-white rounded-3xl border border-gray-100 shadow-sm">
                  <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-6">
                    <CheckCircle size={32} className="text-gray-200" />
                  </div>
                  <h4 className="text-gray-900 font-bold mb-1">Sem Restrições</h4>
                  <p className="text-xs text-gray-400 max-w-xs mx-auto">Todos os clientes encontram-se em situação regular.</p>
               </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {data.map((c: any) => (
                  <div key={c.id} className="p-6 bg-white border border-gray-100 rounded-2xl hover:shadow-xl hover:shadow-orange-50/50 hover:border-orange-200 transition-all group">
                    <div className="flex items-start justify-between mb-5">
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-bold text-gray-900 truncate tracking-tight">{c.name}</p>
                        <p className="text-[10px] font-medium text-orange-600  tracking-widest mt-1.5">{c.relationship_status}</p>
                      </div>
                      <div className="w-2.5 h-2.5 rounded-full bg-orange-500 shadow-sm shadow-orange-200 ml-3 mt-1.5"></div>
                    </div>
                    <div className="mt-5 p-5 bg-orange-50/50 rounded-2xl border border-orange-100/50">
                       <p className="text-[10px] text-orange-400  font-bold tracking-widest">Observação de Restrição</p>
                       <p className="text-xs text-orange-900 mt-1.5 font-semibold leading-relaxed italic">"{c.restriction_reason || 'Restrição aplicada'}"</p>
                    </div>
                  </div>
                ))}
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
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 bg-gray-50/50 rounded-2xl border border-gray-100">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-blue-100 text-blue-600 flex items-center justify-center shadow-sm border border-blue-200/50">
                  <Clock size={24} />
                </div>
                <div>
                  <h3 className="text-base font-bold text-gray-900 leading-none">Tempo Médio de Aprovação</h3>
                </div>
              </div>
            </div>

            <div className="overflow-hidden border border-gray-100 rounded-2xl bg-white shadow-sm">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-gray-50/50 border-b border-gray-100 text-[10px] font-medium text-gray-400  tracking-widest">
                    <th className="px-6 py-4">Responsável</th>
                    <th className="px-6 py-4 text-center">Processos Aprovados</th>
                    <th className="px-6 py-4 text-right">Tempo Médio</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {data?.map((row: any) => (
                    <tr key={row.responsible} className="hover:bg-gray-50/50 transition-colors group">
                      <td className="px-6 py-4">
                         <div className="flex items-center gap-3">
                           <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-[10px] shadow-sm border border-blue-100">
                             {row.responsible.charAt(0)}
                           </div>
                           <div className="min-w-0">
                             <p className="text-sm font-bold text-gray-900 tracking-tight truncate">{row.responsible}</p>
                             <p className="text-[10px] text-gray-400 font-bold  tracking-tighter">Analista de Compliance</p>
                           </div>
                         </div>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className="px-3 py-1 rounded-full bg-gray-100 text-gray-700 text-xs font-medium">{row.approved_count}</span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <span className="text-2xl font-bold text-blue-600">{row.avg_days ? row.avg_days.toFixed(1) : '0.0'}</span>
                        <span className="text-[10px] font-medium text-gray-400 ml-1.5  tracking-tighter">dias</span>
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
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 bg-green-50/30 rounded-2xl border border-green-100">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-green-100 text-green-600 flex items-center justify-center shadow-sm border border-green-200/50">
                  <CheckCircle size={24} />
                </div>
                <div>
                  <h3 className="text-base font-bold text-gray-900 leading-none">Taxa de Aprovação</h3>
                </div>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {data?.map((row: any) => (
                <div key={row.responsible} className="p-6 bg-white border border-gray-100 rounded-2xl hover:shadow-xl transition-all group">
                  <div className="flex items-center gap-3 mb-5 pb-4 border-b border-gray-50">
                    <div className="w-10 h-10 rounded-xl bg-green-50 text-green-600 flex items-center justify-center font-bold text-sm shadow-sm">
                      {row.responsible.charAt(0)}
                    </div>
                    <p className="text-sm font-bold text-gray-900 tracking-tight truncate">{row.responsible}</p>
                  </div>
                  <div className="flex items-end justify-between">
                    <div>
                      <p className="text-3xl font-bold text-green-600 leading-none">{Math.round(row.approval_rate)}%</p>
                      <p className="text-[10px] font-medium text-gray-400  tracking-widest mt-2">{row.approved}/{row.total} Processos</p>
                    </div>
                    <div className="text-right border-l border-gray-50 pl-4">
                      <p className="text-[10px] font-medium text-gray-400  tracking-widest">Média</p>
                      <p className="text-sm font-bold text-gray-700">{row.avg_days ? row.avg_days.toFixed(1) : '0.0'}d</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      case "rejection-rate":
        return (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 bg-red-50/30 rounded-2xl border border-red-100">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-red-100 text-red-600 flex items-center justify-center shadow-sm border border-red-200/50">
                  <AlertCircle size={24} />
                </div>
                <div>
                  <h3 className="text-base font-bold text-gray-900 leading-none">Taxa de Reprovação</h3>
                </div>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {data?.map((row: any) => (
                <div key={row.responsible} className="p-6 bg-white border border-gray-100 rounded-2xl hover:shadow-xl hover:border-red-100 transition-all group">
                  <div className="flex items-center gap-3 mb-5 pb-4 border-b border-gray-50">
                    <div className="w-10 h-10 rounded-xl bg-red-50 text-red-600 flex items-center justify-center font-bold text-sm shadow-sm">
                      {row.responsible.charAt(0)}
                    </div>
                    <p className="text-sm font-bold text-gray-900 tracking-tight truncate">{row.responsible}</p>
                  </div>
                  <div className="flex items-end justify-between">
                    <div>
                      <p className="text-3xl font-bold text-red-600 leading-none">{Math.round(row.rejection_rate)}%</p>
                      <p className="text-[10px] font-medium text-gray-400  tracking-widest mt-2">{row.rejected}/{row.total} Reprovados</p>
                    </div>
                    <div className="text-right border-l border-gray-50 pl-4 max-w-[120px]">
                      <p className="text-[10px] font-medium text-gray-400  tracking-widest">Causa</p>
                      <p className="text-[10px] font-medium text-red-700 truncate" title={row.common_reason}>{row.common_reason || "N/A"}</p>
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
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2">
             <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 bg-blue-50/30 rounded-2xl border border-blue-100">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-blue-100 text-blue-600 flex items-center justify-center shadow-sm border border-blue-200/50">
                  <TrendingUp size={24} />
                </div>
                <div>
                  <h3 className="text-base font-bold text-gray-900 leading-none">Tendência de {isSat ? "Satisfação" : "Performance"}</h3>
                </div>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {data?.map((row: any) => (
                <div key={row.period} className="bg-white border border-gray-100 rounded-2xl p-6 hover:shadow-lg transition-all">
                  <div className="flex justify-between items-center mb-4">
                    <span className="text-xs font-medium text-gray-400  tracking-widest">{row.period}</span>
                    <span className="text-2xl font-bold text-blue-600">{Math.round(row.avg_score)}%</span>
                  </div>
                  <div className="w-full bg-gray-50 rounded-full h-2.5 overflow-hidden border border-gray-100 shadow-inner">
                    <div className="bg-blue-600 h-full rounded-full transition-all duration-1000 ease-out" style={{ width: `${row.avg_score}%` }}></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      case "open-action-plans":
        return (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 bg-orange-50/30 rounded-2xl border border-orange-100">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-orange-100 text-orange-600 flex items-center justify-center shadow-sm border border-orange-200/50">
                  <ClipboardList size={24} />
                </div>
                <div>
                  <h3 className="text-base font-bold text-gray-900 leading-none">Planos de Acção em Aberto</h3>
                </div>
              </div>
              <div className="flex items-center gap-3 bg-white px-4 py-2 rounded-2xl border border-orange-100 shadow-sm">
                <span className="text-[10px] font-medium text-gray-400  tracking-widest">Pendente</span>
                <div className="w-px h-4 bg-gray-100 mx-1"></div>
                <span className="text-sm font-bold text-orange-600">{data?.length || 0} Planos</span>
              </div>
            </div>

            {!data || data.length === 0 ? (
               <div className="py-24 text-center bg-white rounded-3xl border border-gray-100 shadow-sm">
                  <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-6">
                    <CheckCircle size={32} className="text-gray-200" />
                  </div>
                  <h4 className="text-gray-900 font-bold mb-1">Nenhum Pendente</h4>
                  <p className="text-xs text-gray-400 max-w-xs mx-auto">Todos os planos de acção foram concluídos com sucesso.</p>
               </div>
            ) : (
              <div className="overflow-hidden border border-gray-100 rounded-2xl bg-white shadow-sm">
                <table className="w-full text-left">
                  <thead>
                    <tr className="bg-gray-50/50 border-b border-gray-100 text-[10px] font-medium text-gray-400  tracking-widest">
                      <th className="px-6 py-4">Entidade / Acção</th>
                      <th className="px-6 py-4">Responsável</th>
                      <th className="px-6 py-4">Prazo</th>
                      <th className="px-6 py-4 text-right">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {data?.map((a: any) => (
                      <tr key={a.id} className="hover:bg-gray-50/50 transition-colors group">
                        <td className="px-6 py-4">
                          <p className="text-sm font-bold text-gray-900 tracking-tight">{a.entity_name}</p>
                          <p className="text-[10px] text-gray-500 font-bold mt-1.5 line-clamp-1 italic tracking-tight leading-relaxed group-hover:text-orange-600 transition-colors">"{a.action_description}"</p>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                             <div className="w-6 h-6 rounded-full bg-gray-100 text-gray-400 flex items-center justify-center text-[8px] font-bold border border-gray-200 ">{a.responsible.charAt(0)}</div>
                             <span className="text-xs font-medium text-gray-700 tracking-tighter ">{a.responsible}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex flex-col">
                             <span className="text-[10px] font-medium text-gray-400  tracking-tighter">Vencimento</span>
                             <span className="text-xs font-medium text-gray-700 mt-0.5">{new Date(a.deadline).toLocaleDateString('pt-PT')}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <span className={`inline-flex items-center px-3 py-1 rounded-full text-[10px] font-medium  tracking-tighter ${a.status === "Concluído" ? "bg-green-50 text-green-600 shadow-sm shadow-green-100 border border-green-100" : a.status === "Atrasado" ? "bg-red-50 text-red-600 shadow-sm shadow-red-100 border border-red-100" : "bg-amber-50 text-amber-600 shadow-sm shadow-amber-100 border border-amber-100"}`}>
                            {a.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        );
      case "processes-by-responsible":
        return (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 bg-indigo-50/30 rounded-2xl border border-indigo-100">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-indigo-100 text-indigo-600 flex items-center justify-center shadow-sm border border-indigo-200/50">
                  <Users size={24} />
                </div>
                <div>
                  <h3 className="text-base font-bold text-gray-900 leading-none">Processos por Responsável</h3>
                </div>
              </div>
            </div>

            {!data || data.length === 0 ? (
               <div className="py-24 text-center bg-white rounded-3xl border border-gray-100 shadow-sm">
                  <p className="text-sm text-gray-400 font-medium">Sem dados de responsáveis disponíveis.</p>
               </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {data?.map((p: any) => (
                  <div key={p.responsible} className="p-6 bg-white border border-gray-100 rounded-2xl hover:shadow-xl transition-all group">
                    <div className="flex items-center gap-3 mb-5 pb-4 border-b border-gray-50">
                      <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold text-sm shadow-sm">
                        {p.responsible.charAt(0)}
                      </div>
                      <p className="text-sm font-bold text-gray-900 tracking-tight truncate">{p.responsible}</p>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="p-3 bg-gray-50/50 rounded-xl border border-gray-100">
                        <p className="text-xl font-bold text-gray-900 leading-none">{p.total}</p>
                        <p className="text-[10px] font-medium text-gray-400  tracking-widest mt-1.5">Total</p>
                      </div>
                      <div className="p-3 bg-green-50/50 rounded-xl border border-green-100/50">
                        <p className="text-xl font-bold text-green-600 leading-none">{p.approved}</p>
                        <p className="text-[10px] font-medium text-green-500  tracking-widest mt-1.5">Aprovados</p>
                      </div>
                      <div className="p-3 bg-red-50/50 rounded-xl border border-red-100/50">
                        <p className="text-xl font-bold text-red-600 leading-none">{p.rejected}</p>
                        <p className="text-[10px] font-medium text-red-500  tracking-widest mt-1.5">Reprovados</p>
                      </div>
                      <div className="p-3 bg-amber-50/50 rounded-xl border border-amber-100/50">
                        <p className="text-xl font-bold text-amber-600 leading-none">{p.pending}</p>
                        <p className="text-[10px] font-medium text-amber-500  tracking-widest mt-1.5">Pendentes</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      default:
        return <p className="text-gray-500">Selecione um tipo de relatório.</p>;
    }
  };

  const renderCollaborationContent = () => {
    switch (collaborationType) {
      case "360-overall":
        return (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 bg-indigo-50/30 rounded-2xl border border-indigo-100">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-indigo-100 text-indigo-600 flex items-center justify-center shadow-sm border border-indigo-200/50">
                  <Users size={24} />
                </div>
                <div>
                  <h3 className="text-base font-bold text-gray-900 leading-none">Avaliação 360° - Geral</h3>
                </div>
              </div>
              <div className="flex items-center gap-3 bg-white px-4 py-2 rounded-2xl border border-indigo-100 shadow-sm">
                <span className="text-[10px] font-medium text-gray-400  tracking-widest">Total</span>
                <div className="w-px h-4 bg-gray-100 mx-1"></div>
                <span className="text-sm font-bold text-indigo-600">{data?.length || 0} Avaliações</span>
              </div>
            </div>

            {!data || data.length === 0 ? (
               <div className="py-24 text-center bg-white rounded-3xl border border-gray-100 shadow-sm">
                  <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-6">
                    <Users size={32} className="text-gray-200" />
                  </div>
                  <h4 className="text-gray-900 font-bold mb-1">Sem Registos</h4>
                  <p className="text-xs text-gray-400 max-w-xs mx-auto">Não foram encontradas avaliações 360° concluídas no período.</p>
               </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {data.map((ev: any) => (
                  <div key={ev.evaluation_id} className="p-6 bg-white border border-gray-100 rounded-2xl hover:shadow-xl hover:shadow-indigo-50/50 hover:border-indigo-200 transition-all group">
                    <div className="flex items-start justify-between mb-5">
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-bold text-gray-900 truncate tracking-tight">{ev.evaluated_name || ev.employee_name || "Colaborador"}</p>
                        <p className="text-[10px] font-medium text-gray-400  tracking-widest mt-1.5">{ev.form_title || "Avaliação 360°"}</p>
                      </div>
                      <div className={`px-2.5 py-1 rounded-lg text-[10px] font-medium  tracking-tighter ${ev.percentage >= 75 ? "bg-green-50 text-green-600 shadow-sm shadow-green-100" : ev.percentage >= 60 ? "bg-blue-50 text-blue-600 shadow-sm shadow-blue-100" : "bg-amber-50 text-amber-600 shadow-sm shadow-amber-100"}`}>
                        {Math.round(ev.percentage)}%
                      </div>
                    </div>
                    <div className="pt-4 border-t border-gray-50 flex items-center justify-between">
                       <span className="text-[10px] text-gray-400 font-bold  tracking-tighter">{new Date(ev.response_date).toLocaleDateString('pt-PT')}</span>
                       <div className="p-2 bg-indigo-50 rounded-xl text-indigo-600 opacity-40 group-hover:opacity-100 transition-all">
                         <TrendingUp size={16} />
                       </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      case "360-by-department":
        return (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 bg-purple-50/30 rounded-2xl border border-purple-100">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-purple-100 text-purple-600 flex items-center justify-center shadow-sm border border-purple-200/50">
                  <BarChart3 size={24} />
                </div>
                <div>
                  <h3 className="text-base font-bold text-gray-900 leading-none">360° por Departamento</h3>
                </div>
              </div>
            </div>
            {!data || data.length === 0 ? (
               <div className="py-24 text-center bg-white rounded-3xl border border-gray-100 shadow-sm">
                  <p className="text-sm text-gray-400">Sem dados por departamento.</p>
               </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                {data.map((row: any) => (
                  <div key={row.department} className="p-8 bg-white border border-gray-100 rounded-3xl text-center hover:shadow-xl transition-all group">
                    <p className="text-xs font-medium text-gray-400  tracking-widest mb-1">{row.department || "Geral"}</p>
                    <p className="text-4xl font-bold text-purple-600">{row.count}</p>
                    <p className="text-[10px] text-gray-400 font-bold mt-2  tracking-tighter">Feedbacks Recebidos</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      case "360-by-position":
        return (
          <div className="space-y-3">
            <h3 className="text-sm font-bold text-gray-900">Avaliações 360° por Posição</h3>
            {data?.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="bg-gray-50 text-[10px] font-semibold text-gray-500 ">
                      <th className="px-4 py-2.5">Posição</th>
                      <th className="px-4 py-2.5 text-center">Qtd</th>
                      <th className="px-4 py-2.5 text-center">Média %</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {data?.map((row: any) => (
                      <tr key={row.position}>
                        <td className="px-4 py-2.5 text-sm font-medium">{row.position || "Não definido"}</td>
                        <td className="px-4 py-2.5 text-center text-sm">{row.count}</td>
                        <td className="px-4 py-2.5 text-center">
                          <span className={`text-sm font-bold ${row.avg_percentage >= 75 ? "text-green-600" : row.avg_percentage >= 60 ? "text-blue-600" : "text-red-600"}`}>
                            {Math.round(row.avg_percentage)}%
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="py-10 text-center text-gray-400 border-2 border-dashed border-gray-100 rounded-xl">
                Sem dados.
              </div>
            )}
          </div>
        );
      case "360-trend":
        return (
          <div className="space-y-3">
            <h3 className="text-sm font-bold text-gray-900">Tendência de Avaliações 360° (Últimos 6 meses)</h3>
            {data?.length > 0 ? (
              <div className="space-y-4">
                {data?.map((row: any) => (
                  <div key={row.month} className="border border-gray-100 rounded-xl p-4">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm font-semibold text-gray-900">{row.month}</span>
                      <span className="text-lg font-bold text-indigo-600">{Math.round(row.avg_percentage)}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div className="bg-indigo-600 h-2 rounded-full" style={{ width: `${row.avg_percentage}%` }}></div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-10 text-center text-gray-400 border-2 border-dashed border-gray-100 rounded-xl">
                Sem dados de tendência.
              </div>
            )}
          </div>
        );
      case "360-participation":
        return (
          <div className="space-y-3">
            <h3 className="text-sm font-bold text-gray-900">Taxa de Participação em Avaliações 360°</h3>
            {data?.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-6 bg-indigo-50 border border-indigo-100 rounded-2xl text-center">
                  <p className="text-xs font-medium text-indigo-600  tracking-wider mb-2">Total de Colaboradores</p>
                  <p className="text-3xl font-bold text-indigo-700">{data[0]?.total_employees || 0}</p>
                </div>
                <div className="p-6 bg-emerald-50 border border-emerald-100 rounded-2xl text-center">
                  <p className="text-xs font-medium text-emerald-600  tracking-wider mb-2">Avaliados</p>
                  <p className="text-3xl font-bold text-emerald-700">{data[0]?.evaluated_count || 0}</p>
                </div>
              </div>
            ) : (
              <div className="py-10 text-center text-gray-400 border-2 border-dashed border-gray-100 rounded-xl">
                Sem dados.
              </div>
            )}
          </div>
        );
      default:
        return <p className="text-gray-500">Selecione um tipo de relatório.</p>;
    }
  };

  const renderContent = () => {
     // 🔍 DEBUG: Always show data status
     console.log('[DEBUG] renderContent data:', data, 'type:', Array.isArray(data) ? 'Array' : typeof data, 'length:', data?.length || 0);
     
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
     if (category === "collaboration") return renderCollaborationContent();
     return renderManagementContent();
   };

   const supplierOptions: { value: SupplierReportType; label: string }[] = [
     { value: "approved", label: "Aprovados" },
     { value: "rejected", label: "Reprovados" },
     { value: "by-sector", label: "Por Sector" },
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
     { value: "open-action-plans", label: "Planos Acção em Aberto" },
     { value: "processes-by-responsible", label: "Processos por Responsável" },
   ];

   const collaborationOptions: { value: CollaborationReportType; label: string }[] = [
     { value: "360-overall", label: "Resultado Geral 360°" },
     { value: "360-by-department", label: "Por Departamento" },
     { value: "360-by-position", label: "Por Posição/Cargo" },
     { value: "360-trend", label: "Tendência 360°" },
     { value: "360-participation", label: "Taxa de Participação" },
   ];

  return (
    <div className="space-y-4 sm:space-y-5">
      <PageHeader 
        title="Relatórios & BI"
        actions={
          <div className="flex gap-2">
            <button onClick={handleExportCSV} className="btn btn-outline text-xs">
              <Download size={14} /> CSV
            </button>
            <button onClick={handleExportExcel} className="btn btn-outline text-xs">
              <Download size={14} /> Excel
            </button>
            <button onClick={handleExportPDF} className="btn btn-outline text-xs">
              <Download size={14} /> PDF
            </button>
          </div>
        }
      />

       {/* Category Tabs */}
       <div className="flex flex-wrap gap-2 p-1 bg-gray-100/50 rounded-2xl w-fit border border-gray-100">
         <button
           onClick={() => setCategory("suppliers")}
           className={`px-6 py-2.5 rounded-xl text-xs font-medium  tracking-widest transition-all duration-300 ${
             category === "suppliers" ? "bg-white text-blue-600 shadow-sm border border-blue-100" : "text-gray-500 hover:text-gray-700 hover:bg-gray-50"
           }`}
         >
           <Users size={14} className="inline mr-2" /> Fornecedores
         </button>
         <button
           onClick={() => setCategory("clients")}
           className={`px-6 py-2.5 rounded-xl text-xs font-medium  tracking-widest transition-all duration-300 ${
             category === "clients" ? "bg-white text-indigo-600 shadow-sm border border-indigo-100" : "text-gray-500 hover:text-gray-700 hover:bg-gray-50"
           }`}
         >
           <Users size={14} className="inline mr-2" /> Clientes
         </button>
         <button
           onClick={() => setCategory("management")}
           className={`px-6 py-2.5 rounded-xl text-xs font-medium  tracking-widest transition-all duration-300 ${
             category === "management" ? "bg-white text-purple-600 shadow-sm border border-purple-100" : "text-gray-500 hover:text-gray-700 hover:bg-gray-50"
           }`}
         >
           <BarChart3 size={14} className="inline mr-2" /> Gestão
         </button>
         <button
           onClick={() => setCategory("collaboration")}
           className={`px-6 py-2.5 rounded-xl text-xs font-medium  tracking-widest transition-all duration-300 ${
             category === "collaboration" ? "bg-white text-emerald-600 shadow-sm border border-emerald-100" : "text-gray-500 hover:text-gray-700 hover:bg-gray-50"
           }`}
         >
           <Users size={14} className="inline mr-2" /> Colaboradores
         </button>
       </div>

        {/* Report Type Selector */}
        <div className="relative group w-full sm:w-auto mt-2">
          {category === "suppliers" && (
            <select value={supplierType} onChange={(e) => setSupplierType(e.target.value as SupplierReportType)} className="input text-xs font-medium min-w-[240px] appearance-none bg-white border-gray-200 rounded-xl hover:border-blue-400 transition-colors shadow-sm pr-10">
              {supplierOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          )}
          {category === "clients" && (
            <select value={clientType} onChange={(e) => setClientType(e.target.value as ClientReportType)} className="input text-xs font-medium min-w-[240px] appearance-none bg-white border-gray-200 rounded-xl hover:border-indigo-400 transition-colors shadow-sm pr-10">
              {clientOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          )}
          {category === "management" && (
            <select value={managementType} onChange={(e) => setManagementType(e.target.value as ManagementReportType)} className="input text-xs font-medium min-w-[240px] appearance-none bg-white border-gray-200 rounded-xl hover:border-purple-400 transition-colors shadow-sm pr-10">
              {managementOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          )}
          {category === "collaboration" && (
            <select value={collaborationType} onChange={(e) => setCollaborationType(e.target.value as CollaborationReportType)} className="input text-xs font-medium min-w-[240px] appearance-none bg-white border-gray-200 rounded-xl hover:border-emerald-400 transition-colors shadow-sm pr-10">
              {collaborationOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          )}
          <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400 group-hover:text-gray-600 transition-colors">
             <Calendar size={14} />
          </div>
        </div>

      {/* Report Content */}
      <div className="card p-4 sm:p-6">
        {renderContent()}
      </div>
    </div>
  );
}
