import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { AlertTriangle, ExternalLink, Plus, Search, Trash2, Clock, Building2, ShieldCheck, Layers3 } from "lucide-react";
import { useToast } from "../../context/ToastContext";
import ConfirmModal from "../common/ConfirmModal";
import PageHeader from "../common/PageHeader";

export default function EntityList({ type }: { type: "Supplier" | "Client" }) {
  const [entities, setEntities] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterSector, setFilterSector] = useState("");
  const [filterRisk, setFilterRisk] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<any>(null);
  const { addToast } = useToast();

  const fetchEntities = () => {
    setLoading(true);
    fetch(`/api/entities?type=${type}`, {
      headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
    })
      .then((res) => {
        if (!res.ok) throw new Error();
        return res.json();
      })
      .then((data) => {
        setEntities(data);
        setLoading(false);
      })
      .catch(() => {
        addToast("Erro ao carregar entidades.", "error");
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchEntities();
  }, [type]);

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      const res = await fetch(`/api/entities/${deleteTarget.id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });
      if (res.ok) {
        addToast(`${deleteTarget.name} eliminado com sucesso.`, "success");
        fetchEntities();
      } else {
        const data = await res.json();
        addToast(data.message || "Erro ao eliminar.", "error");
      }
    } catch {
      addToast("Erro de conexão.", "error");
    }
    setDeleteTarget(null);
  };

  const sectors = [...new Set(entities.map((entity) => entity.sector).filter(Boolean))];
  const risks = ["Baixo", "Médio", "Alto"];

  const filteredEntities = entities.filter((entity) => {
    const matchesSearch =
      entity.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (entity.code && entity.code.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesSector = filterSector === "" || entity.sector === filterSector;
    const matchesRisk = filterRisk === "" || entity.final_risk_rating === filterRisk;
    return matchesSearch && matchesSector && matchesRisk;
  });

  const activeCount = entities.filter((entity) => entity.status === "Ativo").length;
  const highRiskCount = entities.filter((entity) => entity.final_risk_rating === "Alto").length;

  const pageTitle = type === "Supplier" ? "Fornecedores" : "Clientes";
  const pageSubtitle =
    type === "Supplier"
      ? "Gestão centralizada da base de fornecedores, risco, relacionamento e estado de qualificação."
      : "Gestão centralizada da carteira de clientes, estado operacional e exposição de performance.";

  return (
    <div className="space-y-6">
      <ConfirmModal
        open={!!deleteTarget}
        title="Eliminar Entidade"
        message={`Tem certeza que deseja eliminar "${deleteTarget?.name}"? Todos os processos, avaliações e documentos serão eliminados permanentemente.`}
        confirmLabel="Eliminar"
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />

      <PageHeader
        title={pageTitle}
        subtitle={pageSubtitle}
        actions={
          <Link to="/entities/new" state={{ type }} className="btn btn-primary">
            <Plus size={16} strokeWidth={2} />
            Nova Entidade
          </Link>
        }
      />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <div className="metric-card">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="metric-label">Total Registado</p>
              <p className="metric-value">{entities.length}</p>
              <p className="metric-note">Base total disponível para análise e operação</p>
            </div>
            <div className="module-icon">
              <Building2 size={19} />
            </div>
          </div>
        </div>
        <div className="metric-card">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="metric-label">Estado Ativo</p>
              <p className="metric-value">{activeCount}</p>
              <p className="metric-note">Entidades disponíveis para utilização imediata</p>
            </div>
            <div className="module-icon">
              <ShieldCheck size={19} />
            </div>
          </div>
        </div>
        <div className="metric-card">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="metric-label">Risco Alto</p>
              <p className="metric-value">{highRiskCount}</p>
              <p className="metric-note">Entidades que exigem observação mais apertada</p>
            </div>
            <div className="module-icon">
              <AlertTriangle size={19} />
            </div>
          </div>
        </div>
        <div className="metric-card">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="metric-label">Sectores</p>
              <p className="metric-value">{sectors.length}</p>
              <p className="metric-note">Distribuição setorial atualmente registada</p>
            </div>
            <div className="module-icon">
              <Layers3 size={19} />
            </div>
          </div>
        </div>
      </div>

      <div className="card overflow-hidden">
        <div className="flex flex-col gap-3 border-b border-slate-100 p-5 lg:flex-row lg:items-center">
          <div className="relative flex-1 min-w-0">
            <Search className="input-icon" size={16} />
            <input
              type="text"
              placeholder="Pesquisar entidade..."
              className="input-with-icon block w-full"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <select value={filterSector} onChange={(e) => setFilterSector(e.target.value)} className="input min-w-[180px]">
              <option value="">Todos os sectores</option>
              {sectors.map((sector) => (
                <option key={sector} value={sector}>
                  {sector}
                </option>
              ))}
            </select>

            <select value={filterRisk} onChange={(e) => setFilterRisk(e.target.value)} className="input min-w-[160px]">
              <option value="">Todo o risco</option>
              {risks.map((risk) => (
                <option key={risk} value={risk}>
                  {risk}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr>
                <th>Entidade</th>
                <th className="hidden md:table-cell">Sector</th>
                <th className="hidden lg:table-cell">NIF</th>
                <th>Estado</th>
                <th>Relacionamento</th>
                <th>Risco</th>
                <th className="text-right">Ações</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-16 text-center text-slate-400">
                    A carregar entidades...
                  </td>
                </tr>
              ) : filteredEntities.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-0">
                    <div className="empty-state">
                      <div className="empty-state-icon">
                        <Building2 size={28} />
                      </div>
                      <p className="text-[1.2rem] font-semibold text-slate-800">Nenhuma entidade encontrada</p>
                      <p>Ajuste os filtros ou crie um novo registo para iniciar a base.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredEntities.map((entity) => (
                  <tr key={entity.id}>
                    <td>
                      <div className="flex items-center gap-3">
                        <div
                          className={`flex h-11 w-11 items-center justify-center rounded-[14px] text-base font-semibold text-white ${
                            type === "Supplier" ? "bg-blue-600" : "bg-indigo-600"
                          }`}
                        >
                          {entity.name.charAt(0)}
                        </div>
                        <div className="min-w-0">
                          <p className="truncate text-[1.02rem] font-semibold text-slate-900">{entity.name}</p>
                          <p className="text-[0.9rem] text-slate-500">{entity.code || `ID-${entity.id}`}</p>
                        </div>
                      </div>
                    </td>
                    <td className="hidden md:table-cell">{entity.sector || "N/A"}</td>
                    <td className="hidden lg:table-cell text-slate-500">{entity.tax_id || "-"}</td>
                    <td>
                      <span
                        className={`badge ${
                          entity.status === "Ativo"
                            ? "badge-success"
                            : entity.status === "Em análise"
                              ? "bg-blue-50 text-blue-700"
                              : entity.status === "Bloqueado"
                                ? "bg-red-50 text-red-700"
                                : entity.status === "Em revisão"
                                  ? "bg-amber-50 text-amber-700"
                                  : "badge-neutral"
                        }`}
                      >
                        {entity.status}
                      </span>
                    </td>
                    <td>
                      <span
                        className={`badge ${
                          entity.relationship_status === "Homologado"
                            ? "badge-success"
                            : entity.relationship_status === "Elegível"
                              ? "bg-emerald-50 text-emerald-700"
                              : entity.relationship_status === "Em observação"
                                ? "bg-amber-50 text-amber-700"
                                : entity.relationship_status === "Restrito"
                                  ? "bg-orange-50 text-orange-700"
                                  : entity.relationship_status === "Suspenso"
                                    ? "bg-yellow-50 text-yellow-700"
                                    : entity.relationship_status === "Desqualificado"
                                      ? "bg-red-50 text-red-700"
                                      : "badge-neutral"
                        }`}
                      >
                        {entity.relationship_status || "Elegível"}
                      </span>
                    </td>
                    <td>
                      <div className="flex items-center gap-2">
                        <span
                          className={`h-2.5 w-2.5 rounded-full ${
                            entity.final_risk_rating === "Alto"
                              ? "bg-red-500"
                              : entity.final_risk_rating === "Médio"
                                ? "bg-amber-500"
                                : entity.final_risk_rating === "Baixo"
                                  ? "bg-emerald-500"
                                  : "bg-slate-300"
                          }`}
                        />
                        <span
                          className={`text-[0.95rem] font-medium ${
                            entity.final_risk_rating === "Alto"
                              ? "text-red-600"
                              : entity.final_risk_rating === "Médio"
                                ? "text-amber-600"
                                : entity.final_risk_rating === "Baixo"
                                  ? "text-emerald-600"
                                  : "text-slate-400"
                          }`}
                        >
                          {entity.final_risk_rating || "Pendente"}
                        </span>
                      </div>
                    </td>
                    <td className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Link
                          to={`/entities/${entity.id}`}
                          className="topbar-icon-btn !h-10 !w-10 !rounded-[12px] !text-slate-500 hover:!text-blue-600"
                        >
                          <ExternalLink size={15} strokeWidth={2} />
                        </Link>
                        <Link
                          to={`/entities/${entity.id}/history`}
                          className="topbar-icon-btn !h-10 !w-10 !rounded-[12px] !text-slate-500 hover:!text-emerald-600"
                          title="Histórico"
                        >
                          <Clock size={15} strokeWidth={2} />
                        </Link>
                        <button
                          onClick={() => setDeleteTarget(entity)}
                          className="topbar-icon-btn !h-10 !w-10 !rounded-[12px] !text-slate-500 hover:!text-red-600"
                        >
                          <Trash2 size={15} strokeWidth={2} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {!loading && filteredEntities.length > 0 ? (
          <div className="border-t border-slate-100 bg-slate-50/80 px-5 py-3 text-[0.95rem] text-slate-500">
            {filteredEntities.length} de {entities.length} registos visíveis
          </div>
        ) : null}
      </div>
    </div>
  );
}
