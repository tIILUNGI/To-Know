import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Save, CheckCircle2, XCircle, Shield, User, Trash2 } from "lucide-react";
import { useToast } from "../../context/ToastContext";
import ConfirmModal from "../common/ConfirmModal";

export default function ProcessDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [process, setProcess] = useState<any>(null);
  const [scores, setScores] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showApproval, setShowApproval] = useState(false);
  const [approvalData, setApprovalData] = useState({ decision: "", conditions: "", comments: "", validity_date: "" });
  const [showDelete, setShowDelete] = useState(false);
  const { addToast } = useToast();

  useEffect(() => {
    fetch(`/api/processes/${id}`, {
      headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
    })
      .then((res) => {
        if (!res.ok) throw new Error();
        return res.json();
      })
      .then((data) => {
        setProcess(data);
        setScores(
          data.criteria.map((c: any) => ({
            criteria_id: c.criteria_id,
            score: c.score || 0,
            evidence: c.evidence || "",
            comments: c.comments || "",
          }))
        );
        setLoading(false);
      })
      .catch(() => {
        addToast("Erro ao carregar processo.", "error");
        setLoading(false);
      });
  }, [id]);

  const handleScoreChange = (criteriaId: number, field: string, value: any) => {
    setScores((prev) => prev.map((s) => (s.criteria_id === criteriaId ? { ...s, [field]: value } : s)));
  };

  const handleSaveScores = async () => {
    try {
      const res = await fetch(`/api/processes/${id}/score`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ scores }),
      });
      if (res.ok) {
        const updated = await res.json();
        setProcess({ ...process, result_percentage: updated.percentage, classification: updated.classification });
        addToast("Pontuações salvas com sucesso!", "success");
      } else {
        addToast("Erro ao salvar pontuações.", "error");
      }
    } catch {
      addToast("Erro de conexão.", "error");
    }
  };

  const handleSubmit = async () => {
    try {
      const res = await fetch(`/api/processes/${id}/submit`, {
        method: "POST",
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });
      if (res.ok) {
        addToast("Processo submetido para aprovação!", "success");
        navigate("/processes");
      } else {
        addToast("Erro ao submeter processo.", "error");
      }
    } catch {
      addToast("Erro de conexão.", "error");
    }
  };

  const handleApprovalDecision = async () => {
    if (!approvalData.decision) {
      addToast("Selecione uma decisão.", "warning");
      return;
    }
    try {
      const res = await fetch(`/api/processes/${id}/approve`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(approvalData),
      });
      if (res.ok) {
        addToast(`Processo ${approvalData.decision === "Approved" ? "aprovado" : "rejeitado"} com sucesso!`, "success");
        navigate("/processes");
      } else {
        const data = await res.json();
        addToast(data.message || "Erro na decisão.", "error");
      }
    } catch {
      addToast("Erro de conexão.", "error");
    }
  };

  const handleDeleteProcess = async () => {
    try {
      const res = await fetch(`/api/processes/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });
      if (res.ok) {
        addToast("Processo eliminado.", "success");
        navigate("/processes");
      } else {
        addToast("Erro ao eliminar processo.", "error");
      }
    } catch {
      addToast("Erro de conexão.", "error");
    }
    setShowDelete(false);
  };

  if (loading)
    return (
      <div className="h-full flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
      </div>
    );

  if (!process) return <div className="text-center py-20 text-gray-400 font-bold">Processo não encontrado.</div>;

  return (
    <div className="space-y-4 sm:space-y-5 pb-10 animate-in fade-in duration-500">
      <ConfirmModal
        open={showDelete}
        title="Eliminar Processo"
        message={`Tem certeza que deseja eliminar o processo ${process.process_number}?`}
        confirmLabel="Eliminar"
        onConfirm={handleDeleteProcess}
        onCancel={() => setShowDelete(false)}
      />

      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 bg-white p-4 sm:p-5 rounded-lg border border-gray-100 shadow-sm">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="p-2 hover:bg-gray-50 rounded-lg text-gray-400 border border-transparent hover:border-gray-100 transition-all">
            <ArrowLeft size={18} />
          </button>
          <div>
            <h2 className="text-lg sm:text-xl font-bold text-gray-900">{process.entity_name}</h2>
            <div className="flex items-center gap-2 mt-0.5 flex-wrap">
              <span className="text-xs font-medium text-blue-600 bg-blue-50 px-2 py-0.5 rounded">
                {process.process_number}
              </span>
              <span className="text-gray-300">•</span>
              <span className="text-xs font-medium text-gray-500">{process.type}</span>
            </div>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <button onClick={() => setShowDelete(true)} className="border border-red-200 text-red-600 px-3 py-2 rounded-lg text-sm font-medium flex items-center gap-2 hover:bg-red-50 transition-all">
            <Trash2 size={14} /> Eliminar
          </button>
          <button onClick={handleSaveScores} className="border border-gray-200 text-gray-700 px-3 py-2 rounded-lg text-sm font-medium flex items-center gap-2 hover:bg-gray-50 transition-all">
            <Save size={14} /> Salvar
          </button>
          {process.status === "Draft" && (
            <button onClick={handleSubmit} className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 hover:bg-blue-700">
              <CheckCircle2 size={14} /> Submeter
            </button>
          )}
          {process.status === "In Approval" && (
            <button onClick={() => setShowApproval(!showApproval)} className="bg-emerald-600 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 hover:bg-emerald-700">
              <Shield size={14} /> Decidir
            </button>
          )}
        </div>
      </div>

      {/* Approval Panel */}
      {showApproval && (
        <div className="bg-white p-4 sm:p-5 rounded-lg shadow-sm border-2 border-emerald-200 animate-in">
          <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Shield size={18} className="text-emerald-600" /> Decisão de Aprovação
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            <div className="space-y-2">
              <label className="text-xs font-medium text-gray-500">Decisão *</label>
              <div className="flex gap-2">
                <button
                  onClick={() => setApprovalData({ ...approvalData, decision: "Approved" })}
                  className={`flex-1 py-2.5 rounded-lg text-sm font-medium flex items-center justify-center gap-1.5 transition-all ${
                    approvalData.decision === "Approved"
                      ? "bg-emerald-600 text-white"
                      : "bg-gray-100 text-gray-500 hover:bg-emerald-50"
                  }`}
                >
                  <CheckCircle2 size={14} /> Aprovar
                </button>
                <button
                  onClick={() => setApprovalData({ ...approvalData, decision: "Rejected" })}
                  className={`flex-1 py-2.5 rounded-lg text-sm font-medium flex items-center justify-center gap-1.5 transition-all ${
                    approvalData.decision === "Rejected"
                      ? "bg-red-600 text-white"
                      : "bg-gray-100 text-gray-500 hover:bg-red-50"
                  }`}
                >
                  <XCircle size={14} /> Rejeitar
                </button>
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-gray-500">Data de Validade</label>
              <input
                type="date"
                value={approvalData.validity_date}
                onChange={(e) => setApprovalData({ ...approvalData, validity_date: e.target.value })}
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg"
              />
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <label className="text-xs font-medium text-gray-500">Condições</label>
              <textarea
                value={approvalData.conditions}
                onChange={(e) => setApprovalData({ ...approvalData, conditions: e.target.value })}
                placeholder="Condições para aprovação..."
                rows={2}
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg resize-none"
              />
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <label className="text-xs font-medium text-gray-500">Comentários</label>
              <textarea
                value={approvalData.comments}
                onChange={(e) => setApprovalData({ ...approvalData, comments: e.target.value })}
                placeholder="Observações..."
                rows={2}
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg resize-none"
              />
            </div>
          </div>
          <div className="mt-4 flex justify-end">
            <button
              onClick={handleApprovalDecision}
              className="bg-emerald-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-emerald-700"
            >
              Confirmar Decisão
            </button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-5">
        <div className="lg:col-span-2 space-y-4 sm:space-y-5">
          <div className="bg-white p-4 sm:p-5 rounded-lg shadow-sm border border-gray-100">
            <h3 className="text-sm sm:text-base font-semibold text-gray-900 mb-4 sm:mb-5 flex items-center gap-2">
              <Shield size={18} className="text-blue-600" /> Critérios de Avaliação
            </h3>
            <div className="space-y-4 sm:space-y-6">
              {process.criteria.map((c: any) => (
                <div key={c.id} className="space-y-3 group">
                  <div className="flex flex-col sm:flex-row justify-between items-start gap-2">
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900 group-hover:text-blue-600 transition-colors">{c.name}</p>
                      <p className="text-xs text-gray-400 mt-0.5">{c.description}</p>
                      <p className="text-[10px] text-gray-400 mt-0.5">Peso: {c.weight}x • Máx: {c.max_score}</p>
                    </div>
                    <div className="w-full sm:w-24">
                      <label className="text-[10px] text-gray-400 block mb-1">Nota (0-{c.max_score})</label>
                      <input
                        type="number"
                        min="0"
                        max={c.max_score}
                        value={scores.find((s) => s.criteria_id === c.criteria_id)?.score}
                        onChange={(e) => handleScoreChange(c.criteria_id, "score", Number(e.target.value))}
                        className="w-full px-2 py-1.5 text-sm border border-gray-200 rounded-lg text-center"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3">
                    <div className="space-y-1">
                      <label className="text-[10px] text-gray-400 ml-1">Evidências</label>
                      <input
                        value={scores.find((s) => s.criteria_id === c.criteria_id)?.evidence}
                        onChange={(e) => handleScoreChange(c.criteria_id, "evidence", e.target.value)}
                        className="w-full px-2 py-1.5 text-xs border border-gray-200 rounded-lg"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] text-gray-400 ml-1">Comentários</label>
                      <input
                        value={scores.find((s) => s.criteria_id === c.criteria_id)?.comments}
                        onChange={(e) => handleScoreChange(c.criteria_id, "comments", e.target.value)}
                        className="w-full px-2 py-1.5 text-xs border border-gray-200 rounded-lg"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-4 sm:space-y-5">
          {/* Score summary */}
          <div className="bg-white p-4 sm:p-5 rounded-lg shadow-sm border border-gray-100">
            <h4 className="text-sm sm:text-base font-semibold text-gray-900 mb-4">Resumo do Score</h4>
            <div className="flex flex-col items-center py-4 bg-gray-50 rounded-lg border border-gray-100">
              <div className="text-3xl sm:text-4xl font-bold text-blue-600">{Math.round(process.result_percentage || 0)}%</div>
              <div className="text-[10px] text-gray-400 mt-1">Conformidade Final</div>
            </div>
            <div className="mt-3 sm:mt-4 space-y-2">
              <div className="flex justify-between items-center p-2 rounded-lg bg-gray-50">
                <span className="text-xs text-gray-500">Classificação</span>
                <span className={`text-[10px] font-medium px-2 py-0.5 rounded ${
                  process.classification === "Aprovado" ? "bg-emerald-50 text-emerald-700" :
                  process.classification === "Reprovado" ? "bg-red-50 text-red-700" :
                  "bg-gray-50 text-gray-700"
                }`}>
                  {process.classification || "Pendente"}
                </span>
              </div>
              <div className="flex justify-between items-center p-2 rounded-lg bg-gray-50">
                <span className="text-xs text-gray-500">Estado</span>
                <span className="text-xs font-medium text-blue-600 bg-blue-50 px-2 py-0.5 rounded">
                  {process.status}
                </span>
              </div>
            </div>
          </div>

          {/* Additional info */}
          <div className="bg-white p-4 sm:p-5 rounded-lg shadow-sm border border-gray-100">
            <h4 className="text-sm sm:text-base font-semibold text-gray-900 mb-3 sm:mb-4">Informações</h4>
            <div className="space-y-3">
              <div>
                <label className="text-[10px] text-gray-400 block mb-1">Justificativa</label>
                <p className="text-xs text-gray-600 italic">"{process.justification}"</p>
              </div>
              <div>
                <label className="text-[10px] text-gray-400 block mb-1">Área</label>
                <p className="text-sm font-medium text-gray-900">{process.area || "Não informada"}</p>
              </div>
              <div className="flex items-center gap-2 pt-2 border-t border-gray-50">
                <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
                  <User size={12} />
                </div>
                <div>
                  <p className="text-[10px] text-gray-400">Aberto por</p>
                  <p className="text-xs font-medium text-gray-900">{process.opener_name || "Sistema"}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
