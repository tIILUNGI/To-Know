import { useState, useEffect } from "react";
import {
  Building2, Briefcase, FileText, CheckCircle, 
  Clock, AlertTriangle, TrendingUp, Calendar,
  Users, ClipboardList, AlertCircle, Filter
} from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell,
} from "recharts";
import { useToast } from "../../context/ToastContext";

const KPICard = ({ title, value, icon: Icon, color, subtitle }: any) => (
  <div className="card p-3 sm:p-4 hover:border-blue-200 dark:hover:border-blue-700 transition-colors">
    <div className="flex items-start justify-between gap-2">
      <div className="min-w-0">
        <p className="text-[10px] sm:text-xs font-medium text-gray-500 dark:text-slate-400 uppercase tracking-wide truncate">{title}</p>
        <p className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white mt-0.5">{value}</p>
        {subtitle && <p className="text-[9px] sm:text-[10px] text-gray-400 dark:text-slate-500 truncate">{subtitle}</p>}
      </div>
      <div className={`p-2 rounded-lg flex-shrink-0 ${color}`}>
        <Icon size={14} strokeWidth={2} className="text-white" />
      </div>
    </div>
  </div>
);

const StatCard = ({ title, value, icon: Icon, color }: any) => (
  <div className="card p-2.5 sm:p-3 flex items-center gap-2 sm:gap-3">
    <div className={`p-2 rounded-lg flex-shrink-0 ${color}`}>
      <Icon size={14} strokeWidth={2} className="text-white" />
    </div>
    <div className="min-w-0">
      <p className="text-[10px] sm:text-xs text-gray-500 dark:text-slate-400 truncate">{title}</p>
      <p className="text-base sm:text-lg font-bold text-gray-900 dark:text-white">{value}</p>
    </div>
  </div>
);

export default function Dashboard() {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    period: "all",
    entityType: "",
    processType: "",
    processStatus: "",
    sector: "",
    riskRating: "",
    impact: "",
    opener: "",
  });
  const { addToast } = useToast();

  const fetchDashboard = (filterParams: string) => {
    setLoading(true);
    let url = "/api/reports/dashboard";
    if (filterParams) url += `?${filterParams}`;

    fetch(url, {
      headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
    })
      .then((res) => {
        if (!res.ok) throw new Error("Falha ao carregar dados");
        return res.json();
      })
      .then((data) => {
        setStats(data);
        setLoading(false);
      })
      .catch((err) => {
        addToast(err.message || "Erro ao carregar dashboard.", "error");
        setLoading(false);
      });
  };

  const buildFilterParams = () => {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value) params.append(key, value.toString());
    });
    return params.toString();
  };

  useEffect(() => {
    fetchDashboard(buildFilterParams());
  }, [filters]);

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-3 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
          <span className="text-sm text-gray-500 dark:text-slate-400">Carregando...</span>
        </div>
      </div>
    );
  }

  const COLORS = ["#2563eb", "#ef4444", "#f59e0b"];

  const pieData = [
    { name: "Aprovados", value: stats.totals.approved.count || 0 },
    { name: "Rejeitados", value: stats.totals.rejected.count || 0 },
    { name: "Em Análise", value: stats.totals.processes_pending.count || 0 },
  ];

  const approvalRate = stats.totals.approved.count + stats.totals.rejected.count > 0
    ? Math.round((stats.totals.approved.count / (stats.totals.approved.count + stats.totals.rejected.count)) * 100)
    : 0;

  const handleFilterChange = (key: string, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  return (
    <div className="space-y-4 sm:space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 sm:gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-gray-900 dark:text-white tracking-tight">Dashboard</h1>
          <p className="text-xs sm:text-sm text-gray-500 dark:text-slate-400 mt-1">Visão geral do sistema de compliance</p>
        </div>
      </div>

      {/* Filters - Design Melhorado */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-xl sm:rounded-2xl p-0.5 shadow-lg shadow-blue-100 dark:shadow-none">
        <div className="bg-white dark:bg-[#1f2937] rounded-xl sm:rounded-[22px] p-4 sm:p-5">
          <div className="flex items-center gap-2 mb-4">
            <div className="p-1.5 bg-blue-100 dark:bg-blue-900/40 rounded-lg">
              <Filter size={14} className="text-blue-600 dark:text-blue-400" />
            </div>
            <h2 className="text-sm font-semibold text-gray-900 dark:text-white">Filtros</h2>
            <button 
              onClick={() => setFilters({period: "all", entityType: "", processType: "", processStatus: "", sector: "", riskRating: "", impact: "", opener: ""})}
              className="ml-auto text-xs text-blue-600 dark:text-blue-400 hover:underline"
            >
              Limpar filtros
            </button>
          </div>
          
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {/* Período */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Período</label>
              <div className="relative">
                <Calendar size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
                <select
                  value={filters.period}
                  onChange={(e) => handleFilterChange("period", e.target.value)}
                  className="input-with-icon text-xs w-full"
                >
                  <option value="all">Todo Período</option>
                  <option value="current_month">Mês Atual</option>
                  <option value="last_quarter">Último Trimestre</option>
                  <option value="last_year">Último Ano</option>
                </select>
              </div>
            </div>

            {/* Tipo de Entidade */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Entidade</label>
              <select
                value={filters.entityType}
                onChange={(e) => handleFilterChange("entityType", e.target.value)}
                className="input text-xs w-full"
              >
                <option value="">Todas</option>
                <option value="Supplier">Fornecedores</option>
                <option value="Client">Clientes</option>
              </select>
            </div>

            {/* Tipo de Processo */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Processo</label>
              <select
                value={filters.processType}
                onChange={(e) => handleFilterChange("processType", e.target.value)}
                className="input text-xs w-full"
              >
                <option value="">Todos</option>
                <option value="Aprovação">Aprovação</option>
                <option value="Avaliação">Avaliação</option>
                <option value="Reavaliação">Reavaliação</option>
              </select>
            </div>

            {/* Estado */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Estado</label>
                <select
                  value={filters.processStatus}
                  onChange={(e) => handleFilterChange("processStatus", e.target.value)}
                  className="input text-xs w-full"
                >
                  <option value="">Todos</option>
                  <option value="Rascunho">Rascunho</option>
                  <option value="Em análise">Em Análise</option>
                  <option value="Pendente">Pendente</option>
                  <option value="Submetido">Submetido</option>
                  <option value="Em aprovação">Em Aprovação</option>
                  <option value="Aprovado">Aprovado</option>
                  <option value="Aprovado com restrições">Aprovado c/ Restrições</option>
                  <option value="Reprovado">Reprovar</option>
                  <option value="Encerrado">Encerrado</option>
                </select>
            </div>

             {/* Risco */}
             <div className="space-y-1.5">
               <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Risco</label>
               <select
                 value={filters.riskRating}
                 onChange={(e) => handleFilterChange("riskRating", e.target.value)}
                 className="input text-xs w-full"
               >
                 <option value="">Todos</option>
                 <option value="Baixo">Baixo</option>
                 <option value="Médio">Médio</option>
                 <option value="Alto">Alto</option>
               </select>
             </div>

            {/* Sector */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Sector</label>
              <select
                value={filters.sector || ""}
                onChange={(e) => handleFilterChange("sector", e.target.value)}
                className="input text-xs w-full"
              >
                <option value="">Todos</option>
                {stats?.filters?.sectors?.map((s: any) => (
                  <option key={s.sector} value={s.sector}>{s.sector}</option>
                ))}
              </select>
            </div>

            {/* Responsável */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Responsável</label>
              <select
                value={filters.opener || ""}
                onChange={(e) => handleFilterChange("opener", e.target.value)}
                className="input text-xs w-full"
              >
                <option value="">Todos</option>
                {stats?.filters?.openers?.map((o: any) => (
                  <option key={o.opener_name} value={o.opener_name}>{o.opener_name}</option>
                ))}
              </select>
            </div>

            {/* Impacto */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Impacto</label>
              <select
                value={filters.impact || ""}
                onChange={(e) => handleFilterChange("impact", e.target.value)}
                className="input text-xs w-full"
              >
                <option value="">Todos</option>
                <option value="Low">Baixo</option>
                <option value="Medium">Médio</option>
                <option value="High">Alto</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* KPI Cards - Cadastros */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/30 dark:to-blue-800/20 rounded-xl sm:rounded-2xl p-4 sm:p-5 border border-blue-100 dark:border-blue-800">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-[10px] font-bold text-blue-500 dark:text-blue-400 uppercase tracking-wider">Fornecedores</p>
              <p className="text-2xl sm:text-3xl font-black text-blue-700 dark:text-blue-300 mt-1">{stats.totals.suppliers.count}</p>
              <p className="text-[10px] text-blue-400 dark:text-blue-500 mt-1">Cadastrados</p>
            </div>
            <div className="p-2.5 sm:p-3 bg-blue-600 rounded-xl sm:rounded-2xl shadow-lg shadow-blue-200">
              <Building2 size={18} strokeWidth={2} className="text-white" />
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-indigo-50 to-indigo-100 dark:from-indigo-900/30 dark:to-indigo-800/20 rounded-xl sm:rounded-2xl p-4 sm:p-5 border border-indigo-100 dark:border-indigo-800">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-[10px] font-bold text-indigo-500 dark:text-indigo-400 uppercase tracking-wider">Clientes</p>
              <p className="text-2xl sm:text-3xl font-black text-indigo-700 dark:text-indigo-300 mt-1">{stats.totals.clients.count}</p>
              <p className="text-[10px] text-indigo-400 dark:text-indigo-500 mt-1">Cadastrados</p>
            </div>
            <div className="p-2.5 sm:p-3 bg-indigo-600 rounded-xl sm:rounded-2xl shadow-lg shadow-indigo-200">
              <Briefcase size={18} strokeWidth={2} className="text-white" />
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-amber-50 to-amber-100 dark:from-amber-900/30 dark:to-amber-800/20 rounded-xl sm:rounded-2xl p-4 sm:p-5 border border-amber-100 dark:border-amber-800">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-[10px] font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider">Em Aprovação</p>
              <p className="text-2xl sm:text-3xl font-black text-amber-700 dark:text-amber-300 mt-1">{stats.totals.processes_pending.count}</p>
              <p className="text-[10px] text-amber-500 dark:text-amber-500 mt-1">Processos</p>
            </div>
            <div className="p-2.5 sm:p-3 bg-amber-500 rounded-xl sm:rounded-2xl shadow-lg shadow-amber-200">
              <Clock size={18} strokeWidth={2} className="text-white" />
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/30 dark:to-green-800/20 rounded-xl sm:rounded-2xl p-4 sm:p-5 border border-green-100 dark:border-green-800">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-[10px] font-bold text-green-600 dark:text-green-400 uppercase tracking-wider">Taxa Aprovação</p>
              <p className="text-2xl sm:text-3xl font-black text-green-700 dark:text-green-300 mt-1">{approvalRate}%</p>
              <p className="text-[10px] text-green-500 dark:text-green-500 mt-1">Aprovados/Rejeitados</p>
            </div>
            <div className="p-2.5 sm:p-3 bg-green-600 rounded-xl sm:rounded-2xl shadow-lg shadow-green-200">
              <CheckCircle size={18} strokeWidth={2} className="text-white" />
            </div>
          </div>
        </div>
      </div>

      {/* Secondary Stats - Processos */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-white dark:bg-[#1f2937] rounded-xl sm:rounded-2xl p-4 sm:p-5 border border-gray-100 dark:border-gray-700 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-green-100 dark:bg-green-900/40 rounded-xl">
              <CheckCircle size={16} className="text-green-600 dark:text-green-400" />
            </div>
            <div>
              <p className="text-[10px] text-gray-400 dark:text-gray-500 uppercase">Processos Aprovados</p>
              <p className="text-xl font-bold text-gray-900 dark:text-white">{stats.totals.approved.count}</p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-[#1f2937] rounded-xl sm:rounded-2xl p-4 sm:p-5 border border-gray-100 dark:border-gray-700 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-red-100 dark:bg-red-900/40 rounded-xl">
              <AlertCircle size={16} className="text-red-600 dark:text-red-400" />
            </div>
            <div>
              <p className="text-[10px] text-gray-400 dark:text-gray-500 uppercase">Processos Rejeitados</p>
              <p className="text-xl font-bold text-gray-900 dark:text-white">{stats.totals.rejected.count}</p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-[#1f2937] rounded-xl sm:rounded-2xl p-4 sm:p-5 border border-gray-100 dark:border-gray-700 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-purple-100 dark:bg-purple-900/40 rounded-xl">
              <ClipboardList size={16} className="text-purple-600 dark:text-purple-400" />
            </div>
            <div>
              <p className="text-[10px] text-gray-400 dark:text-gray-500 uppercase">Avaliações Pendentes</p>
              <p className="text-xl font-bold text-gray-900 dark:text-white">{stats.totals.eval_pending.count}</p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-[#1f2937] rounded-xl sm:rounded-2xl p-4 sm:p-5 border border-gray-100 dark:border-gray-700 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-orange-100 dark:bg-orange-900/40 rounded-xl">
              <TrendingUp size={16} className="text-orange-600 dark:text-orange-400" />
            </div>
            <div>
              <p className="text-[10px] text-gray-400 dark:text-gray-500 uppercase">Reavaliações</p>
              <p className="text-xl font-bold text-gray-900 dark:text-white">{stats.totals.reeval_pending.count}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Risk & Performance Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-white dark:bg-[#1f2937] rounded-xl sm:rounded-2xl p-4 sm:p-5 border border-gray-100 dark:border-gray-700 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-red-100 dark:bg-red-900/40 rounded-xl">
              <AlertTriangle size={16} className="text-red-600 dark:text-red-400" />
            </div>
            <div>
              <p className="text-[10px] text-gray-400 dark:text-gray-500 uppercase">Fornecedores Críticos</p>
              <p className="text-xl font-bold text-gray-900 dark:text-white">{stats.totals.critical_suppliers.count}</p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-[#1f2937] rounded-xl sm:rounded-2xl p-4 sm:p-5 border border-gray-100 dark:border-gray-700 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-rose-100 dark:bg-rose-900/40 rounded-xl">
              <AlertTriangle size={16} className="text-rose-600 dark:text-rose-400" />
            </div>
            <div>
              <p className="text-[10px] text-gray-400 dark:text-gray-500 uppercase">Clientes Baixa Perf.</p>
              <p className="text-xl font-bold text-gray-900 dark:text-white">{stats.totals.low_perf_clients.count}</p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-[#1f2937] rounded-xl sm:rounded-2xl p-4 sm:p-5 border border-gray-100 dark:border-gray-700 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-blue-100 dark:bg-blue-900/40 rounded-xl">
              <Users size={16} className="text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <p className="text-[10px] text-gray-400 dark:text-gray-500 uppercase">Índice Satisfação</p>
              <p className="text-xl font-bold text-gray-900 dark:text-white">{Math.round(stats.indices.avg_client_satisfaction.avg || 0)}%</p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-[#1f2937] rounded-xl sm:rounded-2xl p-4 sm:p-5 border border-gray-100 dark:border-gray-700 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-emerald-100 dark:bg-emerald-900/40 rounded-xl">
              <TrendingUp size={16} className="text-emerald-600 dark:text-emerald-400" />
            </div>
            <div>
              <p className="text-[10px] text-gray-400 dark:text-gray-500 uppercase">Índice Performance</p>
              <p className="text-xl font-bold text-gray-900 dark:text-white">{Math.round(stats.indices.avg_supplier_performance.avg || 0)}%</p>
            </div>
          </div>
        </div>
      </div>

      {/* Gauge Cards - Indices */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/30 dark:to-blue-800/20 rounded-xl sm:rounded-2xl p-4 sm:p-5 border border-blue-100 dark:border-blue-800">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xs sm:text-sm font-bold text-blue-700 dark:text-blue-300 uppercase tracking-wider">Satisfação de Clientes</h3>
              <p className="text-[10px] text-blue-500 dark:text-blue-400 mt-1">Índice médio de Satisfação</p>
            </div>
            <div className="relative w-16 h-16 sm:w-20 sm:h-20 flex-shrink-0">
              <svg className="w-full h-full -rotate-90">
                <circle cx="50%" cy="50%" r="40%" fill="none" stroke="#e2e8f0" strokeWidth="6" />
                <circle
                  cx="50%" cy="50%" r="40%" fill="none" stroke="#2563eb" strokeWidth="6"
                  strokeDasharray="251" strokeDashoffset={251 * (1 - (stats.indices.avg_client_satisfaction.avg || 0) / 100)}
                  strokeLinecap="round"
                />
              </svg>
              <span className="absolute inset-0 flex items-center justify-center text-sm sm:text-base font-black text-blue-600 dark:text-blue-400">
                {Math.round(stats.indices.avg_client_satisfaction.avg || 0)}%
              </span>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 dark:from-emerald-900/30 dark:to-emerald-800/20 rounded-xl sm:rounded-2xl p-4 sm:p-5 border border-emerald-100 dark:border-emerald-800">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xs sm:text-sm font-bold text-emerald-700 dark:text-emerald-300 uppercase tracking-wider">Performance de Fornecedores</h3>
              <p className="text-[10px] text-emerald-500 dark:text-emerald-400 mt-1">Índice médio de Performance</p>
            </div>
            <div className="relative w-16 h-16 sm:w-20 sm:h-20 flex-shrink-0">
              <svg className="w-full h-full -rotate-90">
                <circle cx="50%" cy="50%" r="40%" fill="none" stroke="#e2e8f0" strokeWidth="6" />
                <circle
                  cx="50%" cy="50%" r="40%" fill="none" stroke="#10b981" strokeWidth="6"
                  strokeDasharray="251" strokeDashoffset={251 * (1 - (stats.indices.avg_supplier_performance.avg || 0) / 100)}
                  strokeLinecap="round"
                />
              </svg>
              <span className="absolute inset-0 flex items-center justify-center text-sm sm:text-base font-black text-emerald-600 dark:text-emerald-400">
                {Math.round(stats.indices.avg_supplier_performance.avg || 0)}%
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 sm:gap-4">
         <div className="lg:col-span-2 bg-white dark:bg-[#1f2937] rounded-xl sm:rounded-2xl p-4 sm:p-5 border border-gray-100 dark:border-gray-700 shadow-sm">
           <h3 className="text-xs sm:text-sm font-bold text-gray-900 dark:text-white mb-4">Fluxo de Processos</h3>
           <div className="h-40 sm:h-52">
             <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
               <BarChart data={[...stats.monthly_evolution].reverse()}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 10 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 10 }} />
                <Tooltip
                  contentStyle={{ borderRadius: "8px", border: "1px solid #e2e8f0", boxShadow: "0 2px 4px rgb(0 0 0 / 0.1)" }}
                  labelStyle={{ fontSize: 11 }}
                />
                <Bar dataKey="count" fill="#2563eb" radius={[4, 4, 0, 0]} barSize={24} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

         <div className="bg-white dark:bg-[#1f2937] rounded-xl sm:rounded-2xl p-4 sm:p-5 border border-gray-100 dark:border-gray-700 shadow-sm">
           <h3 className="text-xs sm:text-sm font-bold text-gray-900 dark:text-white mb-4">Status de Processos</h3>
           <div className="h-28 sm:h-36">
             <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
               <PieChart>
                <Pie
                  data={pieData}
                  cx="50%" cy="50%"
                  innerRadius={30} outerRadius={50}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="space-y-2 mt-3">
            {pieData.map((entry, index) => (
              <div key={entry.name} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[index] }}></div>
                  <span className="text-xs font-medium text-gray-600 dark:text-slate-400">{entry.name}</span>
                </div>
                <span className="text-xs font-bold text-gray-900 dark:text-white">{entry.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
