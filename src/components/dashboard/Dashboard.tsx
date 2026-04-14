import { useState, useEffect } from "react";
import {
  Building2, Briefcase, FileText, CheckCircle, 
  Clock, AlertTriangle, TrendingUp, Calendar
} from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell,
} from "recharts";
import { useToast } from "../../context/ToastContext";

const KPICard = ({ title, value, icon: Icon, color, subtitle }: any) => (
  <div className="card p-4 sm:p-5 hover:border-blue-200 dark:hover:border-blue-700 transition-colors">
    <div className="flex items-start justify-between">
      <div>
        <p className="text-xs font-medium text-gray-500 dark:text-slate-400 uppercase tracking-wide">{title}</p>
        <p className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white mt-1">{value}</p>
        {subtitle && <p className="text-xs text-gray-400 dark:text-slate-500 mt-1">{subtitle}</p>}
      </div>
      <div className={`p-2.5 sm:p-3 rounded-lg ${color}`}>
        <Icon size={18} strokeWidth={2} className="text-white" />
      </div>
    </div>
  </div>
);

const StatCard = ({ title, value, icon: Icon, color }: any) => (
  <div className="card p-3 sm:p-4 flex items-center gap-3 sm:gap-4">
    <div className={`p-2.5 sm:p-3 rounded-lg ${color}`}>
      <Icon size={18} strokeWidth={2} className="text-white" />
    </div>
    <div>
      <p className="text-xs text-gray-500 dark:text-slate-400">{title}</p>
      <p className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white">{value}</p>
    </div>
  </div>
);

export default function Dashboard() {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [filterPeriod, setFilterPeriod] = useState("all");
  const { addToast } = useToast();

  const fetchDashboard = (period: string) => {
    setLoading(true);
    let url = "/api/reports/dashboard";
    if (period !== "all") url += `?period=${period}`;

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

  useEffect(() => {
    fetchDashboard(filterPeriod);
  }, [filterPeriod]);

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

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">Dashboard</h1>
          <p className="text-sm text-gray-500 dark:text-slate-400 mt-0.5 sm:mt-1">Visão geral do sistema de compliance</p>
        </div>
        <div className="flex items-center gap-2 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg p-1">
          <Calendar size={14} strokeWidth={2} className="text-gray-400 ml-2" />
          <select
            value={filterPeriod}
            onChange={(e) => setFilterPeriod(e.target.value)}
            className="px-2 sm:px-3 py-1.5 bg-transparent text-xs sm:text-sm text-gray-700 dark:text-slate-300 outline-none border-none cursor-pointer"
          >
            <option value="all">Todo o Período</option>
            <option value="current_month">Mês Atual</option>
            <option value="last_quarter">Último Trimestre</option>
          </select>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <KPICard title="Fornecedores" value={stats.totals.suppliers.count} icon={Building2} color="bg-blue-600" />
        <KPICard title="Clientes" value={stats.totals.clients.count} icon={Briefcase} color="bg-indigo-600" />
        <KPICard title="Em Análise" value={stats.totals.processes_pending.count} icon={Clock} color="bg-amber-500" />
        <KPICard title="Taxa de Aprovação" value={`${approvalRate}%`} icon={CheckCircle} color="bg-green-600" subtitle="Dos últimos processos" />
      </div>

      {/* Secondary Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <StatCard title="Avaliações Pendentes" value={stats.totals.eval_pending.count} icon={FileText} color="bg-purple-500" />
        <StatCard title="Reavaliações" value={stats.totals.reeval_pending.count} icon={TrendingUp} color="bg-orange-500" />
        <StatCard title="Fornecedores Críticos" value={stats.totals.critical_suppliers.count} icon={AlertTriangle} color="bg-red-500" />
        <StatCard title="Clientes Baixa Perf." value={stats.totals.low_perf_clients.count} icon={AlertTriangle} color="bg-rose-600" />
      </div>

      {/* Gauge Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
        <div className="card p-4 sm:p-5">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">Satisfação de Clientes</h3>
          <div className="flex items-center gap-4 sm:gap-6">
            <div className="relative w-20 h-20 sm:w-24 sm:h-24 flex-shrink-0">
              <svg className="w-full h-full -rotate-90">
                <circle cx="50%" cy="50%" r="40%" fill="none" stroke="#e2e8f0" strokeWidth="8" />
                <circle
                  cx="50%" cy="50%" r="40%" fill="none" stroke="#2563eb" strokeWidth="8"
                  strokeDasharray="251" strokeDashoffset={251 * (1 - (stats.indices.avg_client_satisfaction.avg || 0) / 100)}
                  strokeLinecap="round"
                />
              </svg>
              <span className="absolute inset-0 flex items-center justify-center text-lg sm:text-xl font-bold text-blue-600 dark:text-blue-400">
                {Math.round(stats.indices.avg_client_satisfaction.avg || 0)}%
              </span>
            </div>
            <div>
              <p className="text-xs text-gray-500 dark:text-slate-400">Índice médio de satisfação</p>
              <p className="text-xs sm:text-sm text-gray-600 dark:text-slate-300 mt-1">Baseado em avaliações dos clientes</p>
            </div>
          </div>
        </div>

        <div className="card p-4 sm:p-5">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">Performance de Fornecedores</h3>
          <div className="flex items-center gap-4 sm:gap-6">
            <div className="relative w-20 h-20 sm:w-24 sm:h-24 flex-shrink-0">
              <svg className="w-full h-full -rotate-90">
                <circle cx="50%" cy="50%" r="40%" fill="none" stroke="#e2e8f0" strokeWidth="8" />
                <circle
                  cx="50%" cy="50%" r="40%" fill="none" stroke="#10b981" strokeWidth="8"
                  strokeDasharray="251" strokeDashoffset={251 * (1 - (stats.indices.avg_supplier_performance.avg || 0) / 100)}
                  strokeLinecap="round"
                />
              </svg>
              <span className="absolute inset-0 flex items-center justify-center text-lg sm:text-xl font-bold text-green-600 dark:text-green-400">
                {Math.round(stats.indices.avg_supplier_performance.avg || 0)}%
              </span>
            </div>
            <div>
              <p className="text-xs text-gray-500 dark:text-slate-400">Média de performance</p>
              <p className="text-xs sm:text-sm text-gray-600 dark:text-slate-300 mt-1">Indicadores de prazo e qualidade</p>
            </div>
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
        <div className="lg:col-span-2 card p-4 sm:p-5">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">Fluxo de Processos</h3>
          <div className="h-48 sm:h-56 lg:h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={[...stats.monthly_evolution].reverse()}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 11 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 11 }} />
                <Tooltip
                  contentStyle={{ borderRadius: "8px", border: "1px solid #e2e8f0", boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)" }}
                />
                <Bar dataKey="count" fill="#2563eb" radius={[4, 4, 0, 0]} barSize={24} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="card p-4 sm:p-5">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">Status de Processos</h3>
          <div className="h-32 sm:h-40">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%" cy="50%"
                  innerRadius={35} outerRadius={55}
                  paddingAngle={5}
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
          <div className="space-y-2 mt-3 sm:mt-4">
            {pieData.map((entry, index) => (
              <div key={entry.name} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[index] }}></div>
                  <span className="text-xs text-gray-600 dark:text-slate-400">{entry.name}</span>
                </div>
                <span className="text-sm font-semibold text-gray-900 dark:text-white">{entry.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
