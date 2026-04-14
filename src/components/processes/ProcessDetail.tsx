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
    <div className="space-y-6 lg:space-y-8 pb-20 animate-in fade-in duration-500">
      <ConfirmModal
        open={showDelete}
        title="Eliminar Processo"
        message={`Tem certeza que deseja eliminar o processo ${process.process_number}?`}
        confirmLabel="Eliminar"
        onConfirm={handleDeleteProcess}
        onCancel={() => setShowDelete(false)}
      />

      {/* Header */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center bg-white p-6 lg:p-8 rounded-[24px] lg:rounded-[32px] border border-gray-100 shadow-sm gap-4">
        <div className="flex items-center gap-4 lg:gap-6">
          <button onClick={() => navigate(-1)} className="p-3 hover:bg-gray-50 rounded-2xl text-gray-400 border border-transparent hover:border-gray-100 transition-all">
            <ArrowLeft size={24} />
          </button>
          <div>
            <h2 className="text-xl lg:text-3xl font-black text-gray-900 tracking-tight">{process.entity_name}</h2>
            <div className="flex items-center gap-3 mt-1 flex-wrap">
              <span className="text-xs font-black text-blue-600 bg-blue-50 px-2 py-1 rounded uppercase tracking-widest">
                {process.process_number}
              </span>
              <span className="text-gray-300">•</span>
              <span className="text-xs font-bold text-gray-500 uppercase tracking-widest">{process.type}</span>
            </div>
          </div>
        </div>
        <div className="flex flex-wrap gap-3">
          <button onClick={() => setShowDelete(true)} className="bg-white border border-red-200 text-red-600 px-4 lg:px-6 py-3 lg:py-4 rounded-2xl font-black text-sm flex items-center gap-2 hover:bg-red-50 transition-all">
            <Trash2 size={18} /> Eliminar
          </button>
          <button onClick={handleSaveScores} className="bg-white border border-gray-200 text-gray-700 px-4 lg:px-8 py-3 lg:py-4 rounded-2xl font-black text-sm flex items-center gap-3 hover:bg-gray-50 transition-all shadow-sm">
            <Save size={20} /> Salvar Notas
          </button>
          {process.status === "Draft" && (
            <button onClick={handleSubmit} className="bg-blue-600 text-white px-6 lg:px-10 py-3 lg:py-4 rounded-2xl font-black text-sm flex items-center gap-3 hover:bg-blue-700 active:scale-95 transition-all shadow-xl shadow-blue-200">
              <CheckCircle2 size={20} /> Submeter
            </button>
          )}
          {process.status === "In Approval" && (
            <button onClick={() => setShowApproval(!showApproval)} className="bg-emerald-600 text-white px-6 lg:px-10 py-3 lg:py-4 rounded-2xl font-black text-sm flex items-center gap-3 hover:bg-emerald-700 active:scale-95 transition-all shadow-xl shadow-emerald-200">
              <Shield size={20} /> Decidir
            </button>
          )}
        </div>
      </div>

      {/* Approval Panel */}
      {showApproval && (
        <div className="bg-white p-6 lg:p-10 rounded-[24px] lg:rounded-[40px] shadow-sm border-2 border-emerald-200 animate-in">
          <h3 className="text-xl font-black text-gray-900 mb-6 flex items-center gap-3">
            <Shield size={24} className="text-emerald-600" /> Decisão de Aprovação
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Decisão *</label>
              <div className="flex gap-3">
                <button
                  onClick={() => setApprovalData({ ...approvalData, decision: "Approved" })}
                  className={`flex-1 py-4 rounded-2xl font-black text-sm flex items-center justify-center gap-2 transition-all ${
                    approvalData.decision === "Approved"
                      ? "bg-emerald-600 text-white shadow-lg"
                      : "bg-gray-100 text-gray-500 hover:bg-emerald-50"
                  }`}
                >
                  <CheckCircle2 size={18} /> Aprovar
                </button>
                <button
                  onClick={() => setApprovalData({ ...approvalData, decision: "Rejected" })}
                  className={`flex-1 py-4 rounded-2xl font-black text-sm flex items-center justify-center gap-2 transition-all ${
                    approvalData.decision === "Rejected"
                      ? "bg-red-600 text-white shadow-lg"
                      : "bg-gray-100 text-gray-500 hover:bg-red-50"
                  }`}
                >
                  <XCircle size={18} /> Rejeitar
                </button>
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Data de Validade</label>
              <input
                type="date"
                value={approvalData.validity_date}
                onChange={(e) => setApprovalData({ ...approvalData, validity_date: e.target.value })}
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl font-bold focus:ring-4 focus:ring-blue-100 outline-none"
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Condições</label>
              <textarea
                value={approvalData.conditions}
                onChange={(e) => setApprovalData({ ...approvalData, conditions: e.target.value })}
                placeholder="Condições para aprovação..."
                rows={3}
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl font-medium text-sm focus:ring-4 focus:ring-blue-100 outline-none resize-none"
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Comentários</label>
              <textarea
                value={approvalData.comments}
                onChange={(e) => setApprovalData({ ...approvalData, comments: e.target.value })}
                placeholder="Observações do aprovador..."
                rows={3}
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl font-medium text-sm focus:ring-4 focus:ring-blue-100 outline-none resize-none"
              />
            </div>
          </div>
          <div className="flex justify-end mt-6">
            <button
              onClick={handleApprovalDecision}
              className="bg-emerald-600 text-white px-10 py-4 rounded-2xl font-black text-sm hover:bg-emerald-700 active:scale-95 transition-all shadow-xl shadow-emerald-200"
            >
              Confirmar Decisão
            </button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
        <div className="lg:col-span-2 space-y-6 lg:space-y-8">
          <div className="bg-white p-6 lg:p-10 rounded-[24px] lg:rounded-[40px] shadow-sm border border-gray-100">
            <h3 className="text-lg lg:text-xl font-black text-gray-900 mb-8 lg:mb-10 flex items-center gap-3">
              <Shield size={24} className="text-blue-600" /> Critérios de Avaliação
            </h3>
            <div className="space-y-8 lg:space-y-12">
              {process.criteria.map((c: any) => (
                <div key={c.id} className="space-y-4 lg:space-y-6 group">
                  <div className="flex flex-col lg:flex-row justify-between items-start gap-4">
                    <div className="flex-1">
                      <p className="text-sm font-black text-gray-900 group-hover:text-blue-600 transition-colors">{c.name}</p>
                      <p className="text-xs text-gray-400 mt-1 font-medium">{c.description}</p>
                      <p className="text-[10px] text-gray-300 mt-1 font-bold">Peso: {c.weight}x • Máximo: {c.max_score}</p>
                    </div>
                    <div className="w-full lg:w-32">
                      <label className="text-[8px] font-black text-gray-400 uppercase tracking-widest block mb-1">Nota (0-{c.max_score})</label>
                      <input
                        type="number"
                        min="0"
                        max={c.max_score}
                        value={scores.find((s) => s.criteria_id === c.criteria_id)?.score}
                        onChange={(e) => handleScoreChange(c.criteria_id, "score", Number(e.target.value))}
                        className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl font-bold text-blue-600 focus:ring-4 focus:ring-blue-100 outline-none transition-all"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 lg:gap-6">
                    <div className="space-y-1.5">
                      <label className="text-[8px] font-black text-gray-400 uppercase tracking-widest ml-1">Evidências</label>
                      <input
                        value={scores.find((s) => s.criteria_id === c.criteria_id)?.evidence}
                        onChange={(e) => handleScoreChange(c.criteria_id, "evidence", e.target.value)}
                        placeholder="Ex: Certidão validada..."
                        className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-xs font-medium focus:ring-4 focus:ring-blue-100 outline-none transition-all"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[8px] font-black text-gray-400 uppercase tracking-widest ml-1">Comentários</label>
                      <input
                        value={scores.find((s) => s.criteria_id === c.criteria_id)?.comments}
                        onChange={(e) => handleScoreChange(c.criteria_id, "comments", e.target.value)}
                        placeholder="Observações..."
                        className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-xs font-medium focus:ring-4 focus:ring-blue-100 outline-none transition-all"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-6 lg:space-y-8">
          {/* Score summary */}
          <div className="bg-white p-6 lg:p-8 rounded-[24px] lg:rounded-[40px] shadow-sm border border-gray-100">
            <h4 className="text-lg font-black text-gray-900 mb-6 lg:mb-8">Resumo do Score</h4>
            <div className="flex flex-col items-center py-6 bg-gray-50 rounded-[24px] lg:rounded-[32px] border border-gray-100">
              <div className="text-4xl lg:text-5xl font-black text-blue-600">{Math.round(process.result_percentage || 0)}%</div>
              <div className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mt-2">Conformidade Final</div>
            </div>
            <div className="mt-6 lg:mt-8 space-y-4">
              <div className="flex justify-between items-center p-4 rounded-2xl bg-white border border-gray-50">
                <span className="text-xs font-bold text-gray-500">Classificação</span>
                <span className={`text-xs font-black uppercase tracking-widest px-2 py-1 rounded-lg ${
                  process.classification === "Aprovado" ? "bg-emerald-50 text-emerald-700" :
                  process.classification === "Reprovado" ? "bg-red-50 text-red-700" :
                  "bg-gray-50 text-gray-700"
                }`}>
                  {process.classification || "Pendente"}
                </span>
              </div>
              <div className="flex justify-between items-center p-4 rounded-2xl bg-white border border-gray-50">
                <span className="text-xs font-bold text-gray-500">Estado Atual</span>
                <span className="text-xs font-black text-blue-600 bg-blue-50 px-2 py-1 rounded uppercase tracking-widest">
                  {process.status}
                </span>
              </div>
            </div>
          </div>

          {/* Additional info */}
          <div className="bg-white p-6 lg:p-8 rounded-[24px] lg:rounded-[40px] shadow-sm border border-gray-100">
            <h4 className="text-lg font-black text-gray-900 mb-6">Informações Adicionais</h4>
            <div className="space-y-6">
              <div>
                <label className="text-[8px] font-black text-gray-400 uppercase tracking-widest block mb-1">Justificativa</label>
                <p className="text-xs font-medium text-gray-600 leading-relaxed italic">"{process.justification}"</p>
              </div>
              <div>
                <label className="text-[8px] font-black text-gray-400 uppercase tracking-widest block mb-1">Área Requisitante</label>
                <p className="text-sm font-bold text-gray-900">{process.area || "Não informada"}</p>
              </div>
              <div className="flex items-center gap-3 pt-4 border-t border-gray-50">
                <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
                  <User size={16} />
                </div>
                <div>
                  <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest">Aberto por</p>
                  <p className="text-xs font-bold text-gray-900">{process.opener_name || "Sistema"}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
