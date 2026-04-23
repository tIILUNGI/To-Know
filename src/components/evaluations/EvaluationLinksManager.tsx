import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, Copy, Check, Mail, Calendar, Trash2, ExternalLink, AlertCircle, BarChart3 } from "lucide-react";
import { useToast } from "../../context/ToastContext";

export default function EvaluationLinksManager() {
  const navigate = useNavigate();
  const { addToast } = useToast();
  const [links, setLinks] = useState<any[]>([]);
  const [evaluations, setEvaluations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [selectedEvaluation, setSelectedEvaluation] = useState("");
  const [clientEmail, setClientEmail] = useState("");
  const [clientName, setClientName] = useState("");
  const [expiresDays, setExpiresDays] = useState(30);
  const [creating, setCreating] = useState(false);
  const [copiedToken, setCopiedToken] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([
      fetch("/api/evaluation-links", {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      }).then(r => r.json()).catch(() => []),
      fetch("/api/evaluations?type=Satisfaction", {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      }).then(r => r.json()).catch(() => [])
    ]).then(([linksData, evalsData]) => {
      setLinks(linksData);
      setEvaluations(evalsData);
      setLoading(false);
    });
  }, []);

  const handleCreateLink = async (e) => {
    e.preventDefault();
    if (!selectedEvaluation) {
      addToast("Selecione uma avaliação de satisfação.", "error");
      return;
    }
    setCreating(true);

    try {
      const res = await fetch(`/api/evaluations/${selectedEvaluation}/generate-link`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          client_email: clientEmail,
          expires_days: expiresDays
        })
      });

      if (res.ok) {
        const newLink = await res.json();
        addToast("Link gerado com sucesso!", "success");
        setShowForm(false);
        setSelectedEvaluation("");
        setClientEmail("");
        setClientName("");
        setExpiresDays(30);
        // Refresh links
        const updatedLinks = await fetch("/api/evaluation-links", {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        }).then(r => r.json());
        setLinks(updatedLinks);
      } else {
        const err = await res.json();
        addToast(err.message || "Erro ao gerar link.", "error");
      }
    } catch {
      addToast("Erro de conexão.", "error");
    }
    setCreating(false);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedToken(text);
    addToast("Link copiado para a área de transferência!", "success");
    setTimeout(() => setCopiedToken(null), 2000);
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Eliminar este link?")) return;
    try {
      const res = await fetch(`/api/evaluation-links/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });
      if (res.ok) {
        addToast("Link eliminado.", "success");
        setLinks(links.filter(l => l.id !== id));
      } else {
        addToast("Erro ao eliminar.", "error");
      }
    } catch {
      addToast("Erro de conexão.", "error");
    }
  };

  const isExpired = (expiresAt: string) => {
    return new Date(expiresAt) < new Date();
  };

  if (loading) {
    return (
      <div className="h-64 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-3 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
          <span className="text-sm text-gray-500">Carregando links...</span>
        </div>
      </div>
    );
  }

  const satisfactionEvaluations = evaluations.filter((e: any) => e.type === "Satisfaction" || e.evaluation_type === "Satisfaction");

  return (
    <div className="space-y-4 sm:space-y-5 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div>
          <h2 className="text-lg sm:text-xl font-bold text-gray-900">Links de Avaliação de Clientes</h2>
        </div>
        <button onClick={() => setShowForm(!showForm)} className="btn btn-primary text-sm">
          <Plus size={16} strokeWidth={2} /> Novo Link
        </button>
      </div>

      {showForm && (
        <div className="card p-6 bg-gradient-to-br from-indigo-50 to-purple-50 border-indigo-100">
          <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
            <Mail size={20} className="text-indigo-600" />
            Gerar Novo Link de Avaliação
          </h3>
          <form onSubmit={handleCreateLink} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Avaliação de Satisfação *</label>
                <select
                  value={selectedEvaluation}
                  onChange={(e) => setSelectedEvaluation(e.target.value)}
                  className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                >
                  <option value="">Selecione uma avaliação...</option>
                  {satisfactionEvaluations.map((ev: any) => (
                    <option key={ev.id} value={ev.id}>
                      {ev.name || ev.evaluation_number} - {ev.entity_name}
                    </option>
                  ))}
                </select>
                {satisfactionEvaluations.length === 0 && (
                  <p className="text-xs text-amber-600 flex items-center gap-1 mt-1">
                    <AlertCircle size={12} />
                    Nenhuma avaliação de satisfação disponível. Crie uma primeiro.
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Email do Cliente (opcional)</label>
                <input
                  type="email"
                  value={clientEmail}
                  onChange={(e) => setClientEmail(e.target.value)}
                  placeholder="cliente@empresa.com"
                  className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Nome do Cliente (opcional)</label>
                <input
                  type="text"
                  value={clientName}
                  onChange={(e) => setClientName(e.target.value)}
                  placeholder="Nome da empresa cliente"
                  className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Validade (dias)</label>
                <select
                  value={expiresDays}
                  onChange={(e) => setExpiresDays(Number(e.target.value))}
                  className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                >
                  <option value={7}>7 dias</option>
                  <option value={15}>15 dias</option>
                  <option value={30}>30 dias</option>
                  <option value={60}>60 dias</option>
                  <option value={90}>90 dias</option>
                </select>
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="submit"
                disabled={creating || !selectedEvaluation}
                className="bg-indigo-600 text-white px-6 py-2.5 rounded-xl font-semibold flex items-center gap-2 hover:bg-indigo-700 active:scale-95 transition-all disabled:opacity-50"
              >
                <Plus size={18} /> {creating ? "Gerando..." : "Gerar Link"}
              </button>
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="px-6 py-2.5 bg-gray-100 text-gray-700 rounded-xl font-semibold hover:bg-gray-200 transition-all"
              >
                Cancelar
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="card overflow-hidden">
        {links.length === 0 ? (
          <div className="p-10 text-center">
            <BarChart3 size={48} className="mx-auto text-gray-300 mb-3" />
            <p className="text-gray-500 font-medium">Nenhum link gerado ainda</p>
            <p className="text-xs text-gray-400 mt-1">Clique em "Novo Link" para criar seu primeiro link de avaliação</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-gray-50 text-[10px] font-semibold text-gray-500 uppercase tracking-wider border-b border-gray-100">
                  <th className="px-4 py-3">Avaliação</th>
                  <th className="px-4 py-3">Token / Link</th>
                  <th className="px-4 py-3">Cliente</th>
                  <th className="px-4 py-3 hidden md:table-cell">Validade</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Acções</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {links.map((link: any) => {
                  const expired = isExpired(link.expires_at);
                  const used = link.is_used === 1;
                  const fullUrl = `${window.location.origin}/avaliacao/${link.token}`;
                  return (
                    <tr key={link.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3">
                        <div>
                          <p className="text-sm font-semibold text-gray-900 truncate max-w-[180px]">
                            {link.evaluation_name || "Avaliação"}
                          </p>
                          <p className="text-xs text-gray-500">{link.entity_name}</p>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <code className="text-xs bg-gray-100 px-2 py-1 rounded font-mono max-w-[100px] truncate">
                            {link.token}
                          </code>
                          <button
                            onClick={() => copyToClipboard(fullUrl)}
                            className="p-1 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded transition-colors"
                            title="Copiar link"
                          >
                            {copiedToken === link.token ? <Check size={14} className="text-green-600" /> : <Copy size={14} />}
                          </button>
                          <a
                            href={fullUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                            title="Abrir link"
                          >
                            <ExternalLink size={14} />
                          </a>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div>
                          <p className="text-sm text-gray-900">{link.client_email || "—"}</p>
                        </div>
                      </td>
                      <td className="px-4 py-3 hidden md:table-cell">
                        <span className="text-xs text-gray-500 flex items-center gap-1">
                          <Calendar size={12} />
                          {link.expires_at || "—"}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        {used ? (
                          <span className="badge badge-success text-xs">Preenchido</span>
                        ) : expired ? (
                          <span className="badge badge-danger text-xs">Expirado</span>
                        ) : (
                          <span className="badge badge-neutral text-xs">Activo</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button
                          onClick={() => handleDelete(link.id)}
                          disabled={used}
                          className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-30"
                          title="Eliminar link"
                        >
                          <Trash2 size={14} />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
