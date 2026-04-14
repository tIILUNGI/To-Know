import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Plus, Search, ExternalLink, Trash2 } from "lucide-react";
import { useToast } from "../../context/ToastContext";
import ConfirmModal from "../common/ConfirmModal";

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

  const sectors = [...new Set(entities.map((e) => e.sector).filter(Boolean))];
  const risks = ["Low", "Medium", "High"];

  const filteredEntities = entities.filter((e) => {
    const matchesSearch =
      e.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (e.code && e.code.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesSector = filterSector === "" || e.sector === filterSector;
    const matchesRisk = filterRisk === "" || e.final_risk_rating === filterRisk;
    return matchesSearch && matchesSector && matchesRisk;
  });

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

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {type === "Supplier" ? "Fornecedores" : "Clientes"}
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Gerencie sua base de {type === "Supplier" ? "parceiros de suprimentos" : "clientes comerciais"}.
          </p>
        </div>
        <Link
          to="/entities/new"
          state={{ type }}
          className="btn btn-primary"
        >
          <Plus size={18} strokeWidth={2} /> Novo Registro
        </Link>
      </div>

      <div className="card overflow-hidden">
        <div className="p-4 border-b border-gray-100 flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="input-icon" size={18} />
            <input
              type="text"
              placeholder="Pesquisar por nome ou código..."
              className="input-with-icon block w-full"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <select
            value={filterSector}
            onChange={(e) => setFilterSector(e.target.value)}
            className="input sm:w-48"
          >
            <option value="">Todos os setores</option>
            {sectors.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
          <select
            value={filterRisk}
            onChange={(e) => setFilterRisk(e.target.value)}
            className="input sm:w-40"
          >
            <option value="">Qualquer risco</option>
            {risks.map((r) => (
              <option key={r} value={r}>{r}</option>
            ))}
          </select>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-gray-50 text-xs font-semibold text-gray-500 uppercase tracking-wider border-b border-gray-100">
                <th className="px-4 py-3">Entidade</th>
                <th className="px-4 py-3 hidden md:table-cell">Setor</th>
                <th className="px-4 py-3 hidden lg:table-cell">NIF</th>
                <th className="px-4 py-3">Estado</th>
                <th className="px-4 py-3">Risco</th>
                <th className="px-4 py-3 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center text-gray-400">
                    Carregando dados...
                  </td>
                </tr>
              ) : filteredEntities.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center text-gray-400">
                    Nenhum registro encontrado.
                  </td>
                </tr>
              ) : (
                filteredEntities.map((entity) => (
                  <tr key={entity.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-10 h-10 rounded-lg flex items-center justify-center font-semibold text-white ${
                            type === "Supplier" ? "bg-blue-600" : "bg-indigo-600"
                          }`}
                        >
                          {entity.name.charAt(0)}
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-gray-900">{entity.name}</p>
                          <p className="text-xs text-gray-500">{entity.code || `ID-${entity.id}`}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell">
                      <span className="text-sm text-gray-600">{entity.sector || "N/A"}</span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500 hidden lg:table-cell">
                      {entity.tax_id || "-"}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`badge ${
                          entity.status === "Active"
                            ? "badge-success"
                            : entity.status === "In Analysis"
                            ? "bg-blue-100 text-blue-800"
                            : "badge-neutral"
                        }`}
                      >
                        {entity.status}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div
                          className={`w-2.5 h-2.5 rounded-full ${
                            entity.final_risk_rating === "High"
                              ? "bg-red-500"
                              : entity.final_risk_rating === "Medium"
                              ? "bg-amber-500"
                              : entity.final_risk_rating === "Low"
                              ? "bg-green-500"
                              : "bg-gray-300"
                          }`}
                        ></div>
                        <span
                          className={`text-xs font-medium ${
                            entity.final_risk_rating === "High"
                              ? "text-red-600"
                              : entity.final_risk_rating === "Medium"
                              ? "text-amber-600"
                              : entity.final_risk_rating === "Low"
                              ? "text-green-600"
                              : "text-gray-400"
                          }`}
                        >
                          {entity.final_risk_rating || "Pendente"}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Link
                          to={`/entities/${entity.id}`}
                          className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        >
                          <ExternalLink size={16} strokeWidth={2} />
                        </Link>
                        <button
                          onClick={() => setDeleteTarget(entity)}
                          className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        >
                          <Trash2 size={16} strokeWidth={2} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {!loading && filteredEntities.length > 0 && (
          <div className="px-4 py-3 border-t border-gray-100 bg-gray-50">
            <span className="text-xs text-gray-500">
              Mostrando {filteredEntities.length} de {entities.length} registros
            </span>
          </div>
        )}
      </div>
    </div>
  );
}