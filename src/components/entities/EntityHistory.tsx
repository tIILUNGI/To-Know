import { useEffect, useMemo, useState } from "react";
import { useParams, Link } from "react-router-dom";
import {
  ArrowLeft,
  Clock,
  FileText,
  CheckCircle,
  AlertCircle,
  Upload,
  Calendar,
  Building2,
  ShieldCheck,
  ChevronRight,
} from "lucide-react";
import PageHeader from "../common/PageHeader";

export default function EntityHistory() {
  const { id } = useParams();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/entities/${id}/history`, {
      headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
    })
      .then((res) => {
        if (!res.ok) throw new Error();
        return res.json();
      })
      .then((response) => {
        setData(response);
        setLoading(false);
      })
      .catch(() => {
        setLoading(false);
      });
  }, [id]);

  const entity = data?.entity;
  const auditHistory = data?.audit_history ?? [];
  const processes = data?.processes ?? [];
  const evaluations = data?.evaluations ?? [];
  const documents = data?.documents ?? [];

  const entityListHref = useMemo(() => {
    const entityType = entity?.entity_type || entity?.type;
    return entityType === "Client" ? "/entities/clients" : "/entities/suppliers";
  }, [entity]);

  if (loading) {
    return (
      <div className="card p-8">
        <div className="empty-state min-h-[420px]">
          <div className="w-10 h-10 rounded-full border-4 border-blue-100 border-t-blue-600 animate-spin" />
          <p className="text-[1.05rem] font-medium text-slate-500">A carregar histórico...</p>
        </div>
      </div>
    );
  }

  if (!data || !entity) {
    return (
      <div className="card p-8">
        <div className="empty-state min-h-[420px]">
          <div className="empty-state-icon">
            <AlertCircle size={28} />
          </div>
          <p className="text-[1.2rem] font-semibold text-slate-800">Erro ao carregar histórico</p>
          <p>Não foi possível obter os registos completos desta entidade.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Histórico Completo"
        actions={
          <>
            <Link to={entityListHref} className="btn btn-outline">
              <ArrowLeft size={16} />
              Voltar à Lista
            </Link>
            <Link to={`/entities/${id}`} className="btn btn-secondary">
              Ver Ficha
            </Link>
          </>
        }
      />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <div className="metric-card">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="metric-label">Entidade</p>
              <p className="metric-value text-[2.2rem]">{entity.name?.charAt(0)?.toUpperCase() || "E"}</p>
              <p className="metric-note">Identificador visual da entidade analisada</p>
            </div>
            <div className="module-icon">
              <Building2 size={19} />
            </div>
          </div>
        </div>

        <div className="metric-card">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="metric-label">Eventos</p>
              <p className="metric-value">{auditHistory.length}</p>
              <p className="metric-note">Entradas capturadas no audit trail</p>
            </div>
            <div className="module-icon">
              <Clock size={19} />
            </div>
          </div>
        </div>

        <div className="metric-card">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="metric-label">Processos</p>
              <p className="metric-value">{processes.length}</p>
              <p className="metric-note">Fluxos históricos associados à entidade</p>
            </div>
            <div className="module-icon">
              <ShieldCheck size={19} />
            </div>
          </div>
        </div>

        <div className="metric-card">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="metric-label">Documentos</p>
              <p className="metric-value">{documents.length}</p>
              <p className="metric-note">Ficheiros e anexos disponíveis no registo</p>
            </div>
            <div className="module-icon">
              <Upload size={19} />
            </div>
          </div>
        </div>
      </div>

      <div className="card p-6">
        <div className="mb-5 flex items-center gap-3">
          <div className="module-icon">
            <FileText size={18} />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-900">Dados Cadastrais Atuais</h2>
          </div>
        </div>

        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-[16px] border border-slate-100 bg-slate-50/70 p-4">
            <span className="text-[0.82rem]  tracking-wide text-slate-500">Denominação Social</span>
            <p className="mt-2 text-[1.08rem] font-semibold text-slate-900">{entity.name}</p>
          </div>
          <div className="rounded-[16px] border border-slate-100 bg-slate-50/70 p-4">
            <span className="text-[0.82rem]  tracking-wide text-slate-500">Estado</span>
            <div className="mt-2">
              <span
                className={`badge ${
                  entity.status === "Activo"
                    ? "badge-success"
                    : entity.status === "Bloqueado" || entity.status === "Desqualificado"
                      ? "badge-danger"
                      : entity.status === "Em revisão" || entity.status === "Em observação"
                        ? "badge-warning"
                        : "badge-neutral"
                }`}
              >
                {entity.status}
              </span>
            </div>
          </div>
          <div className="rounded-[16px] border border-slate-100 bg-slate-50/70 p-4">
            <span className="text-[0.82rem]  tracking-wide text-slate-500">Relacionamento</span>
            <div className="mt-2">
              <span
                className={`badge ${
                  entity.relationship_status === "Homologado" || entity.relationship_status === "Elegível"
                    ? "badge-success"
                    : entity.relationship_status === "Restrito" || entity.relationship_status === "Suspenso"
                      ? "badge-warning"
                      : entity.relationship_status === "Desqualificado"
                        ? "badge-danger"
                        : "badge-neutral"
                }`}
              >
                {entity.relationship_status}
              </span>
            </div>
          </div>
          <div className="rounded-[16px] border border-slate-100 bg-slate-50/70 p-4">
            <span className="text-[0.82rem]  tracking-wide text-slate-500">Risco Final</span>
            <div className="mt-2 flex items-center gap-2">
              <span
                className={`h-2.5 w-2.5 rounded-full ${
                  entity.final_risk_rating === "Alto"
                    ? "bg-red-500"
                    : entity.final_risk_rating === "Médio"
                      ? "bg-amber-500"
                      : "bg-emerald-500"
                }`}
              />
              <span className="text-[1.05rem] font-semibold text-slate-900">{entity.final_risk_rating || "Pendente"}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="card overflow-hidden">
        <div className="border-b border-slate-100 bg-slate-50/80 p-5">
          <h2 className="flex items-center gap-3 text-[1.45rem] font-semibold text-slate-900">
            <Clock size={18} className="text-emerald-600" />
            Audit Trail ({auditHistory.length} eventos)
          </h2>
        </div>
        <div className="p-5">
          {auditHistory.length > 0 ? (
            <div className="space-y-5">
              {auditHistory.map((item: any) => (
                <div key={item.id} className="relative flex gap-4 border-l-2 border-emerald-100 pl-5">
                  <div className="absolute -left-[7px] top-1 h-3 w-3 rounded-full border-2 border-white bg-emerald-600" />
                  <div className="flex-1 space-y-2">
                    <div className="flex flex-col gap-1 md:flex-row md:items-center md:justify-between">
                      <span className="text-[0.9rem] font-semibold  tracking-wide text-slate-900">{item.action}</span>
                      <span className="text-[0.82rem] text-slate-400">{new Date(item.timestamp).toLocaleString("pt-BR")}</span>
                    </div>
                    <p className="text-[1rem] text-slate-600">{item.details}</p>
                    <div className="flex items-center gap-2">
                      <div className="flex h-7 w-7 items-center justify-center rounded-full bg-blue-100 text-[0.72rem] font-bold text-blue-600">
                        {item.user_name?.charAt(0)}
                      </div>
                      <span className="text-[0.95rem] font-medium text-slate-500">{item.user_name}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="empty-state min-h-[220px]">
              <div className="empty-state-icon">
                <Clock size={26} />
              </div>
              <p className="text-[1.1rem] font-semibold text-slate-800">Nenhum evento registado</p>
              <p>O trilho de auditoria desta entidade ainda não tem entradas disponíveis.</p>
            </div>
          )}
        </div>
      </div>

      <div className="card overflow-hidden">
        <div className="border-b border-slate-100 bg-slate-50/80 p-5">
          <h2 className="flex items-center gap-3 text-[1.45rem] font-semibold text-slate-900">
            <CheckCircle size={18} className="text-blue-600" />
            Processos ({processes.length})
          </h2>
        </div>
        <div className="overflow-x-auto">
          <table>
            <thead>
              <tr>
                <th>Processo</th>
                <th className="hidden md:table-cell">Tipo</th>
                <th>Status</th>
                <th className="hidden lg:table-cell">Aberto por</th>
                <th className="hidden lg:table-cell">Aprovador</th>
                <th>Data</th>
              </tr>
            </thead>
            <tbody>
              {processes.length > 0 ? (
                processes.map((process: any) => (
                  <tr key={process.id}>
                    <td>
                      <Link to={`/processos/${process.id}`} className="inline-flex items-center gap-2 font-semibold text-blue-600 hover:underline">
                        {process.code || `#${process.id.toString().slice(-6)}`}
                        <ChevronRight size={14} />
                      </Link>
                    </td>
                    <td className="hidden md:table-cell text-slate-600">{process.process_type}</td>
                    <td>
                      <span
                        className={`badge ${
                          process.status === "Aprovado"
                            ? "badge-success"
                            : process.status === "Reprovado"
                              ? "badge-danger"
                              : process.status === "Pendente"
                                ? "bg-amber-50 text-amber-700"
                                : process.status === "Aprovado com restrições"
                                  ? "bg-orange-50 text-orange-700"
                                  : "badge-neutral"
                        }`}
                      >
                        {process.status}
                      </span>
                    </td>
                    <td className="hidden lg:table-cell text-slate-600">{process.opener_name}</td>
                    <td className="hidden lg:table-cell text-slate-600">{process.approver_name || "-"}</td>
                    <td className="text-slate-500">{new Date(process.created_at).toLocaleDateString("pt-BR")}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="py-14 text-center text-slate-400">
                    Nenhum processo encontrado.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="card overflow-hidden">
        <div className="border-b border-slate-100 bg-slate-50/80 p-5">
          <h2 className="flex items-center gap-3 text-[1.45rem] font-semibold text-slate-900">
            <AlertCircle size={18} className="text-violet-600" />
            Avaliações e Reavaliações ({evaluations.length})
          </h2>
        </div>
        <div className="overflow-x-auto">
          <table>
            <thead>
              <tr>
                <th>Tipo</th>
                <th className="hidden md:table-cell">Período</th>
                <th>Score</th>
                <th>Classificação</th>
                <th className="hidden lg:table-cell">Avaliador</th>
                <th>Data</th>
              </tr>
            </thead>
            <tbody>
              {evaluations.length > 0 ? (
                evaluations.map((evaluation: any) => (
                  <tr key={evaluation.id}>
                    <td className="font-semibold text-slate-900">{evaluation.type}</td>
                    <td className="hidden md:table-cell text-slate-600">{evaluation.period || "-"}</td>
                    <td className="font-semibold text-slate-900">{Math.round(evaluation.percentage)}%</td>
                    <td>
                      <span
                        className={`badge ${
                          evaluation.classification === "Excellent" || evaluation.classification === "Good"
                            ? "badge-success"
                            : evaluation.classification === "Fair"
                              ? "badge-warning"
                              : "badge-danger"
                        }`}
                      >
                        {evaluation.classification}
                      </span>
                    </td>
                    <td className="hidden lg:table-cell text-slate-600">{evaluation.evaluator_name}</td>
                    <td className="text-slate-500">{new Date(evaluation.created_at).toLocaleDateString("pt-BR")}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="py-14 text-center text-slate-400">
                    Nenhuma avaliação registada.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="card overflow-hidden">
        <div className="border-b border-slate-100 bg-slate-50/80 p-5">
          <h2 className="flex items-center gap-3 text-[1.45rem] font-semibold text-slate-900">
            <Upload size={18} className="text-orange-600" />
            Documentos ({documents.length})
          </h2>
        </div>
        <div className="p-5">
          {documents.length > 0 ? (
            <div className="grid gap-4 md:grid-cols-2">
              {documents.map((document: any) => (
                <div key={document.id} className="flex items-center gap-4 rounded-[18px] border border-slate-100 bg-slate-50/70 p-4">
                  <div className="module-icon">
                    <FileText size={18} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[1rem] font-semibold text-slate-900">{document.name}</p>
                    <p className="mt-1 flex items-center gap-1 text-[0.88rem] text-slate-500">
                      <Calendar size={12} />
                      {new Date(document.upload_date).toLocaleDateString("pt-BR")}
                    </p>
                  </div>
                  <a href={document.url} target="_blank" rel="noreferrer" className="topbar-icon-btn !rounded-[12px]">
                    <Upload size={15} />
                  </a>
                </div>
              ))}
            </div>
          ) : (
            <div className="empty-state min-h-[220px]">
              <div className="empty-state-icon">
                <Upload size={28} />
              </div>
              <p className="text-[1.1rem] font-semibold text-slate-800">Nenhum documento anexado</p>
              <p>Os anexos desta entidade ainda não foram carregados.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
