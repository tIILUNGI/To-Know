import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Save, Trash2, CheckCircle2, Shield, XCircle } from "lucide-react";
import { useToast } from "../../context/ToastContext";
import ConfirmModal from "../common/ConfirmModal";
import WorkflowStepper from "./WorkflowStepper";

const STEP_NAMES: Record<number, string> = {
  1: "Rascunho",
  2: "Submetido",
  3: "Validação Documental",
  4: "Avaliação Técnica/Comercial",
  5: "Em Aprovação",
  6: "Aprovado/Reprovado",
  7: "Comunicação do Resultado",
  8: "Em Monitorização",
};

export default function ProcessDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [process, setProcess] = useState<any>(null);
  const [scores, setScores] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showDelete, setShowDelete] = useState(false);
  const [showTransition, setShowTransition] = useState(false);
  const [targetStep, setTargetStep] = useState<number | null>(null);
  const [transitionNotes, setTransitionNotes] = useState("");
  const [showApproval, setShowApproval] = useState(false);
  const [approvalData, setApprovalData] = useState({ decision: "", validity_date: "", conditions: "", comments: "" });
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
        if (data.criteria) {
          setScores(
            data.criteria.map((c: any) => ({
              criteria_id: c.criteria_id,
              score: c.score || 0,
              evidence: c.evidence || "",
              comments: c.comments || "",
            }))
          );
        }
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

  const handleTransition = async () => {
    if (!targetStep) return;
    try {
      const res = await fetch(`/api/processes/${id}/transition`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ target_step: targetStep, notes: transitionNotes }),
      });
      if (res.ok) {
        addToast("Workflow avançado com sucesso!", "success");
        fetch(`/api/processes/${id}`).then(r => r.json()).then(setProcess);
        setShowTransition(false);
        setTargetStep(null);
        setTransitionNotes("");
      } else {
        const data = await res.json();
        addToast(data.message || "Erro ao avançar workflow.", "error");
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
      // Call approve endpoint to record decision details
      const approveRes = await fetch(`/api/processes/${id}/approve`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          decision: approvalData.decision === "Approved" ? "Aprovado" : "Reprovado",
          conditions: approvalData.conditions,
          comments: approvalData.comments,
          validity_date: approvalData.validity_date || null,
          next_reevaluation_date: null,
          result_percentage: process?.result_percentage || 0,
        }),
      });

      if (!approveRes.ok) {
        const err = await approveRes.json();
        throw new Error(err.message || "Falha na aprovação");
      }

      // Transition to step 6 (Aprovado/Reprovado)
      const transitionRes = await fetch(`/api/processes/${id}/transition`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          target_step: 6,
          notes: `Decisão: ${approvalData.decision}. Validade: ${approvalData.validity_date}`,
        }),
      });

      if (transitionRes.ok) {
        addToast(`Processo ${approvalData.decision === "Approved" ? "aprovado" : "rejeitado"} com sucesso!`, "success");
        setShowApproval(false);
        setApprovalData({ decision: "", validity_date: "", conditions: "", comments: "" });
        fetch(`/api/processes/${id}`).then(r => r.json()).then(setProcess);
      } else {
        const err = await transitionRes.json();
        addToast(err.message || "Erro ao atualizar etapa.", "error");
      }
    } catch (err: any) {
      addToast(err.message || "Erro de conexão.", "error");
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
          navigate("/processos");
        } else {
          addToast("Erro ao eliminar processo.", "error");
        }
    } catch {
      addToast("Erro de conexão.", "error");
    }
    setShowDelete(false);
  };

  const getStepActions = (step: number) => {
    switch(step) {
      case 1: return { label: "Submeter", action: () => { setTargetStep(2); setShowTransition(true); }, hidden: false };
      case 2: return { label: "Iniciar Validação", action: () => { setTargetStep(3); setShowTransition(true); }, hidden: false };
      case 3: return { label: "Iniciar Avaliação", action: () => { setTargetStep(4); setShowTransition(true); }, hidden: false };
      case 4: return { label: "Enviar para Aprovação", action: () => { setTargetStep(5); setShowTransition(true); }, hidden: false };
      case 5: return { label: "Abrir Decisão", action: () => setShowApproval(true), hidden: false };
      case 6: return { label: "Comunicar Resultado", action: () => { setTargetStep(7); setShowTransition(true); }, hidden: false };
      case 7: return { label: "Iniciar Monitorização", action: () => { setTargetStep(8); setShowTransition(true); }, hidden: false };
      default: return null;
    }
  };

  const stepActions = getStepActions(process?.current_step || 1);

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
          {stepActions && !stepActions.hidden && (
            <button onClick={stepActions.action} className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 hover:bg-blue-700">
              <CheckCircle2 size={14} /> {stepActions.label}
            </button>
          )}
        </div>
      </div>

      {/* Workflow Stepper */}
      <div className="bg-white p-4 sm:p-6 rounded-lg border border-gray-100 shadow-sm">
        <h3 className="text-sm font-bold text-gray-900 mb-4">Workflow do Processo</h3>
        <WorkflowStepper currentStep={process.current_step || 1} />
      </div>

      {/* Transition Modal */}
      {showTransition && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg p-6">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-bold text-gray-900">Avançar Workflow</h3>
              <button onClick={() => setShowTransition(false)} className="text-gray-400 hover:text-gray-600">
                <XCircle size={20} />
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="text-xs font-medium text-gray-500 block mb-2">
                  Etapa atual: {process.current_step}. {STEP_NAMES[process.current_step]}
                </label>
                <label className="text-xs font-medium text-gray-500 block mb-2">Próxima etapa:</label>
                <select
                  value={targetStep || ""}
                  onChange={(e) => setTargetStep(Number(e.target.value))}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-100"
                >
                  <option value="">Selecione...</option>
                  {[2,3,4,5,6,7,8].filter(s => s > process.current_step).map(s => (
                    <option key={s} value={s}>{s}. {STEP_NAMES[s]}</option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="text-xs font-medium text-gray-500 block mb-2">Observações</label>
                <textarea
                  value={transitionNotes}
                  onChange={(e) => setTransitionNotes(e.target.value)}
                  placeholder="Adicione notas sobre esta transição..."
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-100 h-20 resize-none"
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button onClick={() => setShowTransition(false)} className="px-5 py-2.5 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200">
                Cancelar
              </button>
              <button
                onClick={handleTransition}
                disabled={!targetStep}
                className="px-5 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Confirmar Transição
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Approval Modal */}
      {showApproval && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg p-6">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <Shield size={20} className="text-emerald-600" /> Decisão de Aprovação
              </h3>
              <button onClick={() => setShowApproval(false)} className="text-gray-400 hover:text-gray-600">
                <XCircle size={20} />
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="text-xs font-medium text-gray-500 block mb-2">Decisão *</label>
                <div className="flex gap-3">
                  <button
                    onClick={() => setApprovalData({ ...approvalData, decision: "Approved" })}
                    className={`flex-1 py-3 rounded-lg text-sm font-medium flex items-center justify-center gap-2 transition-all ${
                      approvalData.decision === "Approved"
                        ? "bg-emerald-600 text-white shadow-lg"
                        : "bg-gray-100 text-gray-500 hover:bg-emerald-50"
                    }`}
                  >
                    <CheckCircle2 size={16} /> Aprovar
                  </button>
                  <button
                    onClick={() => setApprovalData({ ...approvalData, decision: "Rejected" })}
                    className={`flex-1 py-3 rounded-lg text-sm font-medium flex items-center justify-center gap-2 transition-all ${
                      approvalData.decision === "Rejected"
                        ? "bg-red-600 text-white shadow-lg"
                        : "bg-gray-100 text-gray-500 hover:bg-red-50"
                    }`}
                  >
                    <XCircle size={16} /> Rejeitar
                  </button>
                </div>
              </div>
              
              <div>
                <label className="text-xs font-medium text-gray-500 block mb-2">Data de Validade</label>
                <input
                  type="date"
                  value={approvalData.validity_date}
                  onChange={(e) => setApprovalData({ ...approvalData, validity_date: e.target.value })}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-100"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-500 block mb-2">Condições</label>
                <textarea
                  value={approvalData.conditions}
                  onChange={(e) => setApprovalData({ ...approvalData, conditions: e.target.value })}
                  placeholder="Condições específicas..."
                  rows={3}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-100 resize-none"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-500 block mb-2">Comentários</label>
                <textarea
                  value={approvalData.comments}
                  onChange={(e) => setApprovalData({ ...approvalData, comments: e.target.value })}
                  placeholder="Observações adicionais..."
                  rows={2}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-100 resize-none"
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button onClick={() => setShowApproval(false)} className="px-5 py-2.5 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200">
                Cancelar
              </button>
              <button
                onClick={handleApprovalDecision}
                disabled={!approvalData.decision}
                className="px-5 py-2.5 bg-emerald-600 text-white rounded-lg text-sm font-medium hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Confirmar Decisão
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Criteria Section */}
      <div className="bg-white p-4 sm:p-5 rounded-lg shadow-sm border border-gray-100">
        <h3 className="text-sm sm:text-base font-semibold text-gray-900 mb-4 sm:mb-5 flex items-center gap-2">
          <Shield size={18} className="text-blue-600" /> Critérios de Avaliação
        </h3>
        <div className="space-y-4 sm:space-y-6">
          {process.criteria && process.criteria.map((c: any) => (
            <div key={c.id} className="space-y-3 group border-b border-gray-50 pb-4 last:border-0">
              <div className="flex flex-col sm:flex-row justify-between items-start gap-2">
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">{c.name}</p>
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
                    className="w-full px-2 py-1.5 text-sm border border-gray-200 rounded-lg text-center font-bold"
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3">
                <div>
                  <label className="text-[10px] text-gray-400 ml-1 block mb-1">Evidências</label>
                  <input
                    value={scores.find((s) => s.criteria_id === c.criteria_id)?.evidence}
                    onChange={(e) => handleScoreChange(c.criteria_id, "evidence", e.target.value)}
                    className="w-full px-3 py-1.5 text-xs border border-gray-200 rounded-lg"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-gray-400 ml-1 block mb-1">Comentários</label>
                  <input
                    value={scores.find((s) => s.criteria_id === c.criteria_id)?.comments}
                    onChange={(e) => handleScoreChange(c.criteria_id, "comments", e.target.value)}
                    className="w-full px-3 py-1.5 text-xs border border-gray-200 rounded-lg"
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Summary */}
      <div className="bg-white p-4 sm:p-5 rounded-lg shadow-sm border border-gray-100">
        <h4 className="text-sm sm:text-base font-semibold text-gray-900 mb-4">Resumo</h4>
        <div className="flex flex-col items-center py-4 bg-gray-50 rounded-lg border border-gray-100">
          <div className="text-3xl sm:text-4xl font-bold text-blue-600">{Math.round(process.result_percentage || 0)}%</div>
          <div className="text-[10px] text-gray-400 mt-1">Conformidade Final</div>
        </div>
        <div className="mt-3 sm:mt-4 grid grid-cols-2 gap-2">
          <div className="flex justify-between items-center p-2 rounded-lg bg-gray-50">
            <span className="text-xs text-gray-500">Classificação</span>
            <span className={`text-[10px] font-medium px-2 py-0.5 rounded ${
              process.classification === "Aprovado" ? "bg-emerald-50 text-emerald-700" :
              process.classification === "Reprovado" ? "bg-red-50 text-red-700" :
              process.classification === "Condicionado" ? "bg-amber-50 text-amber-700" :
              "bg-gray-50 text-gray-700"
            }`}>
              {process.classification || "Pendente"}
            </span>
          </div>
          <div className="flex justify-between items-center p-2 rounded-lg bg-gray-50">
            <span className="text-xs text-gray-500">Etapa</span>
            <span className="text-xs font-medium text-blue-600 bg-blue-50 px-2 py-0.5 rounded">
              Step {process.current_step || 1}
            </span>
          </div>
        </div>
      </div>

      {/* Workflow History */}
      {process.workflow_history && process.workflow_history.length > 0 && (
        <div className="bg-white p-4 sm:p-5 rounded-lg shadow-sm border border-gray-100">
          <h4 className="text-sm sm:text-base font-semibold text-gray-900 mb-4">Histórico do Workflow</h4>
          <div className="space-y-2">
            {process.workflow_history.map((h: any) => (
              <div key={h.id} className="flex items-center gap-3 text-xs border-b border-gray-50 pb-2 last:border-0">
                <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                <div className="flex-1">
                  <span className="font-medium">{h.user_name}</span>
                  <span className="text-gray-400"> • {new Date(h.performed_at).toLocaleDateString("pt-BR")}</span>
                </div>
                <span className="text-gray-500">
                  Step {h.step_from} → {h.step_to}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}