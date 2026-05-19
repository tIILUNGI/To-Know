import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  BarChart3,
  Briefcase,
  Building2,
  CheckCircle2,
  ClipboardList,
  FileText,
  Settings,
  Shield,
  TrendingUp,
  UserPlus,
  Users,
  ChevronRight,
} from "lucide-react";
import { useToast } from "../../context/ToastContext";
import { useAuth } from "../../context/AuthContext";
import PageHeader from "../common/PageHeader";

interface ExecutiveCardProps {
  title: string;
  value: number | string;
  subtitle: string;
  icon: any;
}

interface ModuleCardProps {
  title: string;
  description: string;
  to: string;
  icon: any;
  stats: Array<{ label: string; value: number; className?: string }>;
}

function ExecutiveCard({ title, value, subtitle, icon: Icon }: ExecutiveCardProps) {
  return (
    <div className="metric-card">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="metric-label">{title}</p>
          <p className="metric-value">{value}</p>
          <p className="metric-note">{subtitle}</p>
        </div>
        <div className="module-icon shrink-0">
          <Icon size={19} />
        </div>
      </div>
    </div>
  );
}

const safeNumber = (value: unknown) => (typeof value === "number" && Number.isFinite(value) ? value : 0);

export default function Dashboard() {
  const { addToast } = useToast();
  const { user } = useAuth();
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);

    fetch("/api/reports/dashboard", {
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
      .catch((error) => {
        addToast(error.message || "Erro ao carregar dashboard.", "error");
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div className="card p-8">
        <div className="empty-state min-h-[420px]">
          <div className="w-10 h-10 rounded-full border-4 border-blue-100 border-t-blue-600 animate-spin" />
          <p className="text-[1.05rem] font-medium text-slate-500">A preparar o painel executivo...</p>
        </div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="card p-8">
        <div className="empty-state min-h-[420px]">
          <div className="empty-state-icon">
            <BarChart3 size={28} />
          </div>
          <p className="text-[1.12rem] font-semibold text-slate-700">Não foi possível carregar o dashboard.</p>
          <p className="text-[1rem]">Atualize a página ou verifique a ligação com a API.</p>
        </div>
      </div>
    );
  }

  const suppliers = safeNumber(stats?.totals?.suppliers?.count);
  const clients = safeNumber(stats?.totals?.clients?.count);
  const approved = safeNumber(stats?.totals?.approved?.count);
  const rejected = safeNumber(stats?.totals?.rejected?.count);
  const processPending = safeNumber(stats?.totals?.processes_pending?.count);
  const evaluationPending = safeNumber(stats?.totals?.eval_pending?.count);
  const reevaluationPending = safeNumber(stats?.totals?.reeval_pending?.count);
  const criticalSuppliers = safeNumber(stats?.totals?.critical_suppliers?.count);
  const lowPerfClients = safeNumber(stats?.totals?.low_perf_clients?.count);
  const employees = safeNumber(stats?.totals?.employees?.count);
  const clientSatisfaction = Math.round(safeNumber(stats?.indices?.avg_client_satisfaction?.avg));
  const supplierPerformance = Math.round(safeNumber(stats?.indices?.avg_supplier_performance?.avg));

  const entityTotal = suppliers + clients;
  const processTotal = approved + rejected + processPending;
  const evaluationTotal = evaluationPending + reevaluationPending;
  const approvalRate = approved + rejected > 0 ? Math.round((approved / (approved + rejected)) * 100) : 0;

  const modules = [
    {
      title: "Fornecedores",
      description: "Gestão da base de fornecedores, risco e histórico de relacionamento.",
      to: "/entities/suppliers",
      icon: Building2,
      stats: [
        { label: "Total", value: suppliers },
        { label: "Crítico", value: criticalSuppliers, className: "text-amber-500" },
        { label: "Activo", value: Math.max(suppliers - criticalSuppliers, 0), className: "text-emerald-500" },
      ],
    },
    {
      title: "Clientes",
      description: "Acompanhamento de clientes, performance, estado e exposição operacional.",
      to: "/entities/clients",
      icon: Briefcase,
      stats: [
        { label: "Total", value: clients },
        { label: "Atenção", value: lowPerfClients, className: "text-amber-500" },
        { label: "Activo", value: Math.max(clients - lowPerfClients, 0), className: "text-emerald-500" },
      ],
    },
    {
      title: "Processos",
      description: "Fluxo operacional dos processos de aprovação, análise, decisão e fecho.",
      to: "/processos",
      icon: FileText,
      stats: [
        { label: "Total", value: processTotal },
        { label: "Pendente", value: processPending, className: "text-amber-500" },
        { label: "Aprovado", value: approved, className: "text-emerald-500" },
      ],
    },
    {
      title: "Avaliações",
      description: "Monitorização das avaliações em curso, reavaliações e registos concluídos.",
      to: "/avaliacoes",
      icon: ClipboardList,
      stats: [
        { label: "Total", value: evaluationTotal },
        { label: "Pendente", value: evaluationPending, className: "text-amber-500" },
        { label: "Reaval.", value: reevaluationPending, className: "text-emerald-500" },
      ],
    },
    {
      title: "Colaboradores",
      description: "Gestão dos colaboradores ligados ao ciclo interno de avaliação e acompanhamento.",
      to: "/colaboradores",
      icon: UserPlus,
      stats: [
        { label: "Total", value: employees },
        { label: "Satisf.", value: clientSatisfaction, className: "text-amber-500" },
        { label: "Activo", value: employees, className: "text-emerald-500" },
      ],
    },
    {
      title: "Relatórios",
      description: "Leitura executiva dos indicadores e dos resultados de conformidade do sistema.",
      to: "/relatorios",
      icon: TrendingUp,
      stats: [
        { label: "Índice", value: supplierPerformance },
        { label: "Aprov.", value: approvalRate, className: "text-amber-500" },
        { label: "Activo", value: clientSatisfaction, className: "text-emerald-500" },
      ],
    },
  ];

  if (user?.role === "Administrator" || user?.role === "ADMIN") {
    modules.push({
      title: "Configurações",
      description: "Parâmetros administrativos, tipologias, utilizadores e estruturas auxiliares.",
      to: "/configuracoes",
      icon: Settings,
      stats: [
        { label: "Total", value: 0 },
        { label: "Pendente", value: 0, className: "text-amber-500" },
        { label: "Activo", value: 0, className: "text-emerald-500" },
      ],
    });
  }

  return (
    <div className="space-y-10">
      <PageHeader
        title="Painel Executivo"
      />

      <div className="grid gap-5 xl:grid-cols-4 md:grid-cols-2">
        <ExecutiveCard
          title="Entidades Registadas"
          value={entityTotal}
          subtitle=""
          icon={Users}
        />
        <ExecutiveCard
          title="Processos Pendentes"
          value={processPending}
          subtitle=""
          icon={FileText}
        />
        <ExecutiveCard
          title="Avaliações em Aberto"
          value={evaluationTotal}
          subtitle=""
          icon={ClipboardList}
        />
        <ExecutiveCard
          title="Taxa de Aprovação"
          value={`${approvalRate}%`}
          subtitle=""
          icon={Shield}
        />
      </div>

      <section className="space-y-5">
        <div>
          <h2 className="section-title">Módulos do Sistema</h2>
        </div>

        <div className="grid gap-5 xl:grid-cols-4 md:grid-cols-2">
          {modules.map((module: ModuleCardProps) => {
            const Icon = module.icon;

            return (
              <div key={module.title} className="module-card">
                <div className="module-icon">
                  <Icon size={20} />
                </div>

                <div className="space-y-3">
                  <h3 className="module-title">{module.title}</h3>
                </div>

                <div className="module-stats">
                  {module.stats.map((stat) => (
                    <div key={stat.label}>
                      <span className={`module-stat-value ${stat.className ?? ""}`}>{stat.value}</span>
                      <span className="module-stat-label">{stat.label}</span>
                    </div>
                  ))}
                </div>

                <Link to={module.to} className="module-button mt-auto">
                  {module.title} de Acesso
                  <ChevronRight size={17} />
                </Link>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
